// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

// Firebase Authentication
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firestore
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCH74K5lI5LFen7nvSNzXdUBthmF9-jGQo",
    authDomain: "sso-operacional.firebaseapp.com",
    projectId: "sso-operacional",
    storageBucket: "sso-operacional.firebasestorage.app",
    messagingSenderId: "446993332337",
    appId: "1:446993332337:web:1404c4f6a1cfebab8b43d0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
