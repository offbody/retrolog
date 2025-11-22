
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Вставь сюда данные из консоли Firebase (Project Settings -> Your apps -> SDK setup and configuration)
const firebaseConfig = {
  apiKey: "ВAIzaSyDz5oNkecJNWdH8rIIofFS90GatsGFd26A",
  authDomain: "anonlog-debbf.firebaseapp.com",
  projectId: "anonlog-debbf",
  storageBucket: "anonlog-debbf.firebasestorage.app",
  messagingSenderId: "44717397932",
  appId: "1:44717397932:web:7af73338290c3dd87ccc09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
