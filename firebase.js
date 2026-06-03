// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ここを自分のFirebase設定に置き換える
const firebaseConfig = {
  apiKey: "AIzaSyAHbeksoONbWQECO3UsqtKzUTraY8CgMCU",
  authDomain: "jinkaku-yaminabe.firebaseapp.com",
  databaseURL: "https://jinkaku-yaminabe-default-rtdb.firebaseio.com",
  projectId: "jinkaku-yaminabe",
  storageBucket: "jinkaku-yaminabe.firebasestorage.app",
  messagingSenderId: "48965924149",
  appId: "1:48965924149:web:4463d50a88c39f8180087c"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
