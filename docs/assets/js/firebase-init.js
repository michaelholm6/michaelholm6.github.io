    import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } 
    from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
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

  // 👇 FUNCTIONS SETUP
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
  import { setPersistence, browserLocalPersistence } 
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

  setPersistence(auth, browserLocalPersistence);
  const db = getDatabase(app);

  window.auth = auth;
  window.db = db;
  window.app = app;

  // CRITICAL FIX: Specify the region where your Cloud Function is deployed
  const functions = getFunctions(app, "us-central1");
  
window.firebaseFunctions = {
  postComment: httpsCallable(getFunctions(window.app, "us-central1"), "postComment"),
  deleteComment: httpsCallable(getFunctions(window.app, "us-central1"), "deleteComment"),
  deleteReply: httpsCallable(getFunctions(window.app, "us-central1"), "deleteReply"),
  editComment: httpsCallable(functions, "editComment")
};


  // existing global exports
  window.firebase = {
    auth,
    db,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    ref,
    set,
    get,
    push,
    onValue,
    remove,
    runTransaction
  };

  export { app, auth, db, functions };