
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Вставь сюда данные из консоли Firebase (Project Settings -> Your apps -> SDK setup and configuration)
const firebaseConfig = {
  apiKey: "AIzaSyDz5oNkecJNWdH8rIIofFS90GatsGFd26A",
  authDomain: "anonlog-debbf.firebaseapp.com",
  projectId: "anonlog-debbf",
  storageBucket: "anonlog-debbf.firebasestorage.app",
  messagingSenderId: "44717397932",
  appId: "1:44717397932:web:7af73338290c3dd87ccc09"
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
