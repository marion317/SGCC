import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // opcional

const firebaseConfig = {
  apiKey: "AIzaSyA_5yV5wIrBBxYngCY-Gb74g0mabqgBdSQ",
  authDomain: "conducion-escuela.firebaseapp.com",
  projectId: "conducion-escuela",
  storageBucket: "conducion-escuela.firebasestorage.app",
  messagingSenderId: "604961470029",
  appId: "1:604961470029:web:a9599331cc9d7be4d90e04",
  measurementId: "G-NPPX5BXDYD"
};

const app = initializeApp(firebaseConfig);

// 🔥 ESTO ES LO IMPORTANTE
export const auth = getAuth(app);
export const db = getFirestore(app);

// const analytics = getAnalytics(app); // déjalo comentado por ahora