const { defineSecret } = require("firebase-functions/params");
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const BLACKLIST = ["testword"];

function containsBlacklistedWord(text) {
  const lower = text.toLowerCase();
  return BLACKLIST.some(word => lower.includes(word));
}

async function isToxic(text) {
  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY.value()}`
    },
    body: JSON.stringify({
      input: text
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Moderation HTTP error:", errText);
    throw new Error("Moderation API failed");
  }

  const data = await res.json();

  const result =
    data?.results?.[0] ||
    data?.data?.[0] ||
    null;

  return result?.flagged === true;
}



const { onCall, HttpsError } = require("firebase-functions/v2/https");

exports.postComment = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
  console.log("AUTH CONTEXT:", request.auth);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const { text, postId, commentId } = request.data;

  if (!text || text.trim() === "") {
    throw new HttpsError("invalid-argument", "Empty comment");
  }

  // 🔴 BLACKLIST CHECK
  if (containsBlacklistedWord(text)) {
    throw new HttpsError("permission-denied", "You've used a word that's not allowed in comments");
  }

  // 🔴 TOXICITY CHECK
  let toxic = false;
  try {
    toxic = await isToxic(text);
  } catch (err) {
    console.error("Moderation API failed:", err);
    // optional: decide behavior if API fails
    // safest:
    throw new HttpsError("internal", "Content moderation failed. Try again later.");
    // or fallback:
    // toxic = false;
  }

  if (toxic) {
    throw new HttpsError("permission-denied", "Your comment was flagged as inappropriate. Please edit and try again.");
  }

  const uid = request.auth.uid;

    const userRef = admin.database().ref(`users/${uid}/lastCommentTime`);
    const snap = await userRef.get();

    const now = Date.now();
    const lastTime = snap.val() || 0;

    const COOLDOWN = 10 * 1000;

    if (now - lastTime < COOLDOWN) {
    throw new HttpsError(
        "resource-exhausted",
        `You're commenting too fast. Please wait ${Math.ceil((COOLDOWN - (now - lastTime)) / 1000)}s`
    );
    }


  const user = request.auth.token;

  const basePath = `comments/posts/${postId}/comments`;

  if (commentId) {
    const ref = admin.database().ref(`${basePath}/${commentId}/replies`).push();
    await ref.set({
      author: user.name || "User",
      authorID: uid,
      content: text,
      timestamp: Date.now(),
      likes: 0,
      likedBy: {}
    });
  } else {
    const ref = admin.database().ref(basePath).push();
    await ref.set({
      author: user.name || "User",
      authorID: uid,
      content: text,
      timestamp: Date.now(),
      likes: 0,
      likedBy: {}
    });
  }

    await userRef.set(now);
  return { success: true };
});

exports.deleteComment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const uid = request.auth.uid;
  const { postId, commentId } = request.data;

  const base = `comments/posts/${postId}/comments/${commentId}`;
  const snap = await admin.database().ref(base).get();

  if (!snap.exists()) return;

  const data = snap.val();

  // 🔒 check permissions
  const isAuthor = data.authorID === uid;

  const adminSnap = await admin.database().ref(`admins/${uid}`).get();
  const isAdmin = adminSnap.exists();

  if (!isAuthor && !isAdmin) {
    throw new HttpsError("permission-denied", "Not allowed");
  }

  const hasReplies = data.replies && Object.keys(data.replies).length > 0;

  if (hasReplies) {
    await admin.database().ref(base).set({
      ...data,
      content: "This comment was deleted",
      author: "Deleted",
      deleted: true
    });
  } else {
    await admin.database().ref(base).remove();
  }

  return { success: true };
});


exports.deleteReply = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const uid = request.auth.uid;
  const { postId, commentId, replyId } = request.data;

  const replyPath = `comments/posts/${postId}/comments/${commentId}/replies/${replyId}`;
  const commentPath = `comments/posts/${postId}/comments/${commentId}`;

  const snap = await admin.database().ref(replyPath).get();
  if (!snap.exists()) return;

  const data = snap.val();

  const isAuthor = data.authorID === uid;

  const adminSnap = await admin.database().ref(`admins/${uid}`).get();
  const isAdmin = adminSnap.exists();

  if (!isAuthor && !isAdmin) {
    throw new HttpsError("permission-denied", "Not allowed");
  }

  await admin.database().ref(replyPath).remove();

  const commentSnap = await admin.database().ref(commentPath).get();
  const commentData = commentSnap.val();
  if (!commentData) return;

  const replies = commentData.replies || {};
  const hasReplies = Object.keys(replies).length > 0;

  if (commentData.deleted === true && !hasReplies) {
    await admin.database().ref(commentPath).remove();
  }

  return { success: true };
});

exports.editComment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const uid = request.auth.uid;
  const { postId, commentId, replyId, newText } = request.data;

  if (!newText || newText.trim() === "") {
    throw new HttpsError("invalid-argument", "Empty text");
  }

  let path;

  if (replyId) {
    path = `comments/posts/${postId}/comments/${commentId}/replies/${replyId}`;
  } else {
    path = `comments/posts/${postId}/comments/${commentId}`;
  }

  const snap = await admin.database().ref(path).get();
  if (!snap.exists()) return;

  const data = snap.val();

  const isAuthor = data.authorID === uid;
  const isAdminSnap = await admin.database().ref(`admins/${uid}`).get();
  const isAdmin = isAdminSnap.exists();

  if (!isAuthor && !isAdmin) {
    throw new HttpsError("permission-denied", "Not allowed");
  }

  await admin.database().ref(path).update({
    content: newText,
    edited: true,
    editedAt: Date.now()
  });

  return { success: true };
});

