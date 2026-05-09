import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyC9kKOWxPO76NIoUR5ygxW5ohfe0c3BrVM",
  authDomain: "syllabus-tracker-5396f.firebaseapp.com",
  projectId: "syllabus-tracker-5396f",
  storageBucket: "syllabus-tracker-5396f.firebasestorage.app",
  messagingSenderId: "675035254115",
  appId: "1:675035254115:web:b183ac3b551be8e7d5d756"
};

const app = initializeApp(firebaseConfig);

export default app;