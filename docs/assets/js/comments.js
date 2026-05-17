// ==================== SETUP ====================
import { auth, db, functions } from "/assets/js/firebase-init.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
  remove,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const postId = window.POST_ID;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("google-signin-btn")
    ?.addEventListener("click", signInWithGoogle);

  document.getElementById("logout-btn")
    ?.addEventListener("click", logOut);

  document.getElementById("post-comment-btn")
    ?.addEventListener("click", postComment);
});

function formatDisplayName(user) {
  if (!user) return "User";

  if (user.email === "michaelholm6@gmail.com") {
    return "Michael Holm";
  }

  const firstName = (user.displayName || "User").trim().split(/\s+/)[0];
  const uidSuffix = user.uid?.slice(-5) || "xxxxx";
  return `${firstName}${uidSuffix}`;
}


// ==================== AUTH ====================

function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(result => updateAuthUI(result.user))
    .catch(err => alert(err.message));
}

function logOut() {
  signOut(auth)
    .then(() => updateAuthUI(null))
    .catch(err => alert(err.message));
}

function updateAuthUI(user) {
  const googleBtn = document.getElementById('google-signin-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');
  const form = document.getElementById('comment-form-container');

  if (user) {
    googleBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    userInfo.textContent = `Logged in as: ${formatDisplayName(user)}`;
    form.style.display = 'block';
  } else {
    googleBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
    form.style.display = 'none';
  }
}

onAuthStateChanged(auth, async (user) => {
  window.currentUser = user;

  const btn = document.getElementById("post-comment-btn");
  btn.disabled = !user;

  updateAuthUI(user);
  await checkAdmin(user);
  loadComments();
});

window.signInWithGoogle = signInWithGoogle;
window.logOut = logOut;
window.postComment = postComment;
window.likeComment = likeComment;
window.likeReply = likeReply;
window.deleteComment = deleteComment;
window.deleteReply = deleteReply;
window.toggleReply = toggleReply;
window.postReply = postReply;
window.startEditComment = startEditComment;
window.submitEditComment = submitEditComment;
window.cancelEdit = cancelEdit;
window.startEditReply = startEditReply;
window.submitEditReply = submitEditReply;
window.cancelEditReply = cancelEditReply;


// ==================== COMMENTS ====================

async function postComment() {
  const user = auth.currentUser;

  if (!user) {
    alert("Login state not ready yet. Try again in a second.");
    return;
  }

  const text = document.getElementById('comment-text').value.trim();
  if (!text) {
    alert("Please write a comment");
    return;
  }

  try {
    await window.firebaseFunctions.postComment({
      text,
      postId,
      displayName: formatDisplayName(auth.currentUser)
    });
    document.getElementById('comment-text').value = '';
  } catch (error) {
    alert(error.message || "Failed to post comment");
  }
}

function checkAdmin(user) {
  if (!user) {
    window.adminStatus = false;
    return Promise.resolve(false);
  }

  return get(ref(db, `admins/${user.uid}`)).then(snap => {
    window.adminStatus = snap.exists();
    return snap.exists();
  });
}

function loadComments() {
  const list = document.getElementById('comments-list');
  const commentsRef = ref(db, `comments/posts/${postId}/comments`);

  onValue(commentsRef, snapshot => {
    list.innerHTML = '';
    const data = snapshot.val();

    if (!data) {
      list.innerHTML = '<p style="color:#999;">No comments yet.</p>';
      return;
    }

    const arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    arr.sort((a, b) => b.timestamp - a.timestamp);
    arr.forEach(c => list.appendChild(createComment(c)));
  });
}

function createComment(comment) {
  const div = document.createElement('div');
  const user = auth.currentUser;
  const likedByUser = comment.likedBy?.[user?.uid];

  div.innerHTML = `
    <div style="padding:12px;border:1px solid #ddd;margin-bottom:10px;">
      <strong>${comment.author}</strong>
      <span style="float:right;color:#999;">
        ${new Date(comment.timestamp).toLocaleDateString()}
      </span>
      <p>${comment.content}</p>
      <div id="edit-box-${comment.id}" style="display:none; margin-top:10px;">
        <textarea id="edit-text-${comment.id}" style="width:100%; height:80px;"></textarea>
        <button onclick="submitEditComment('${comment.id}')">Finish editing</button>
        <button onclick="cancelEdit('${comment.id}')">Cancel</button>
      </div>

      <div id="btns-${comment.id}" class="comment-buttons">
        <div class="btn-row">

        ${user ? `
          <button
            class="like-btn ${likedByUser ? 'liked' : ''}"
            onclick="likeComment('${comment.id}')">
            👍 ${comment.likes || 0}
          </button>
          <button onclick="toggleReply('${comment.id}')">Reply</button>
        ` : `
          <span class="like-display">👍 ${comment.likes || 0}</span>
        `}

        ${renderDeleteButtonHTML({ commentId: comment.id, authorID: comment.authorID })}

        ${(user && (user.uid === comment.authorID || window.adminStatus)) ? `
          <button onclick="startEditComment('${comment.id}', \`${comment.content}\`)">✏️ Edit</button>
        ` : ""}

        </div>
      </div>

      <div id="reply-form-${comment.id}" class="reply-form" style="display:none;">
        <textarea id="reply-text-${comment.id}" class="reply-textarea"></textarea>
        <button onclick="postReply('${comment.id}')">Post</button>
      </div>

      <div id="replies-${comment.id}" style="margin-left:20px;"></div>
    </div>
  `;

  loadReplies(comment.id, div.querySelector(`#replies-${comment.id}`));
  return div;
}

function renderDeleteButtonHTML({ commentId = null, replyId = null, isReply = false, authorID = null }) {
  const user = auth.currentUser;
  if (!user) return '';

  const isAuthor = user.uid === authorID;
  const admin = window.adminStatus === true;
  if (!isAuthor && !admin) return '';

  if (isReply) {
    return `<button onclick="deleteReply('${commentId}', '${replyId}')" class="delete-btn">🗑 Delete</button>`;
  }

  return `<button onclick="deleteComment('${commentId}')" class="delete-btn">🗑 Delete</button>`;
}


// ==================== REPLIES ====================

function toggleReply(id) {
  const el = document.getElementById(`reply-form-${id}`);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function postReply(commentId) {
  const user = auth.currentUser;
  if (!user) return alert('Login required');

  const text = document.getElementById(`reply-text-${commentId}`).value.trim();
  if (!text) return;

  try {
    await window.firebaseFunctions.postComment({
      text,
      postId,
      commentId,
      displayName: formatDisplayName(auth.currentUser)
    });
    document.getElementById(`reply-text-${commentId}`).value = '';
  } catch (err) {
    alert(err.message || "Blocked by moderation");
  }
}

function loadReplies(commentId, container) {
  if (!container) return;

  const repliesRef = ref(db, `comments/posts/${postId}/comments/${commentId}/replies`);

  onValue(repliesRef, snapshot => {
    container.innerHTML = '';

    const data = snapshot.val();
    if (!data) return;

    Object.entries(data).forEach(([id, r]) => {
      const user = auth.currentUser;
      const likedByUser = r.likedBy?.[user?.uid];
      const replyDiv = document.createElement('div');
      replyDiv.className = "reply";

      replyDiv.innerHTML = `
        <strong>${r.author}</strong>
        <span style="float:right;color:#666;">
          ${new Date(r.timestamp).toLocaleDateString()}
        </span>

        <p>${r.content}</p>
        <div id="edit-reply-box-${id}" style="display:none; margin-top:10px;">
          <textarea id="edit-reply-text-${id}" style="width:100%; height:60px;"></textarea>
          <button onclick="submitEditReply('${commentId}', '${id}')">Finish editing</button>
          <button onclick="cancelEditReply('${id}')">Cancel</button>
        </div>

        <div class="btn-row">
          ${user ? `
            <button
              class="like-btn ${likedByUser ? 'liked' : ''}"
              onclick="likeReply('${commentId}','${id}')">
              👍 ${r.likes || 0}
            </button>
          ` : `
            <span class="like-display">👍 ${r.likes || 0}</span>
          `}

          ${renderDeleteButtonHTML({ commentId, replyId: id, isReply: true, authorID: r.authorID })}

          ${(user && (user.uid === r.authorID || window.adminStatus)) ? `
            <button onclick="startEditReply('${commentId}', '${id}', \`${r.content}\`)">✏️ Edit</button>
          ` : ""}
        </div>
      `;

      container.appendChild(replyDiv);
    });
  });
}

function startEditComment(commentId, oldText) {
  const box = document.getElementById(`edit-box-${commentId}`);
  const textarea = document.getElementById(`edit-text-${commentId}`);
  textarea.value = oldText;
  box.style.display = "block";
}

async function submitEditComment(commentId) {
  const newText = document.getElementById(`edit-text-${commentId}`).value.trim();
  if (!newText) return alert("Cannot be empty");

  try {
    await window.firebaseFunctions.editComment({ postId, commentId, newText });
  } catch (err) {
    alert(err.message || "Edit failed");
  }
}

function cancelEdit(commentId) {
  document.getElementById(`edit-box-${commentId}`).style.display = "none";
}

function startEditReply(commentId, replyId, oldText) {
  const box = document.getElementById(`edit-reply-box-${replyId}`);
  const textarea = document.getElementById(`edit-reply-text-${replyId}`);
  textarea.value = oldText;
  box.style.display = "block";
}

async function submitEditReply(commentId, replyId) {
  const newText = document.getElementById(`edit-reply-text-${replyId}`).value.trim();
  if (!newText) return alert("Cannot be empty");

  try {
    await window.firebaseFunctions.editComment({ postId, commentId, replyId, newText });
  } catch (err) {
    alert(err.message || "Edit failed");
  }
}

function cancelEditReply(replyId) {
  document.getElementById(`edit-reply-box-${replyId}`).style.display = "none";
}

async function deleteReply(commentId, replyId) {
  if (!confirm("Delete this reply?")) return;

  try {
    await window.firebaseFunctions.deleteReply({ postId, commentId, replyId });
  } catch (err) {
    alert(err.message || "Delete failed");
  }
}


// ==================== LIKES ====================

async function likeComment(id) {
  const user = auth.currentUser;
  if (!user) return alert("Login required");

  const likeRef = ref(db, `comments/posts/${postId}/comments/${id}/likedBy/${user.uid}`);
  const countRef = ref(db, `comments/posts/${postId}/comments/${id}/likes`);

  const snap = await get(likeRef);

  if (snap.exists()) {
    await remove(likeRef);
    await runTransaction(countRef, current => Math.max((current || 1) - 1, 0));
  } else {
    await set(likeRef, true);
    await runTransaction(countRef, current => (current || 0) + 1);
  }
}

async function likeReply(commentId, replyId) {
  const user = auth.currentUser;
  if (!user) return alert("Login required");

  const likeRef = ref(db, `comments/posts/${postId}/comments/${commentId}/replies/${replyId}/likedBy/${user.uid}`);
  const countRef = ref(db, `comments/posts/${postId}/comments/${commentId}/replies/${replyId}/likes`);

  const snap = await get(likeRef);

  if (snap.exists()) {
    await remove(likeRef);
    await runTransaction(countRef, current => Math.max((current || 1) - 1, 0));
  } else {
    await set(likeRef, true);
    await runTransaction(countRef, current => (current || 0) + 1);
  }
}


// ==================== DELETE ====================

async function deleteComment(id) {
  if (!confirm('Delete comment?')) return;

  try {
    await window.firebaseFunctions.deleteComment({ postId, commentId: id });
  } catch (err) {
    alert(err.message || "Delete failed");
  }
}
