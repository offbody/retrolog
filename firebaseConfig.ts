
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_8-MU-LcmQpMzaKQ-1MXOKxFX719dlJw",
  authDomain: "retrolog-app.firebaseapp.com",
  projectId: "retrolog-app",
  storageBucket: "retrolog-app.firebasestorage.app",
  messagingSenderId: "378561938716",
  appId: "1:378561938716:web:34c0fd593b535b59a166d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
// Explicitly add scopes to avoid "invalid action" or missing permission errors
googleProvider.addScope('profile');
googleProvider.addScope('email');
