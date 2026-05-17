import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence
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
import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7Fzb-NtmvRTnSg26nrHEwaUexpbIk_Vo",
  authDomain: "michaels-workbench-comments.firebaseapp.com",
  databaseURL: "https://michaels-workbench-comments-default-rtdb.firebaseio.com",
  projectId: "michaels-workbench-comments",
  storageBucket: "michaels-workbench-comments.firebasestorage.app",
  messagingSenderId: "334714571311",
  appId: "1:334714571311:web:d73f28c4095b58c25614da"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const functions = getFunctions(app, "us-central1");

setPersistence(auth, browserLocalPersistence);

window.auth = auth;
window.db = db;
window.app = app;

window.firebaseFunctions = {
  postComment: httpsCallable(functions, "postComment"),
  deleteComment: httpsCallable(functions, "deleteComment"),
  deleteReply: httpsCallable(functions, "deleteReply"),
  editComment: httpsCallable(functions, "editComment")
};

export { app, auth, db, functions };
