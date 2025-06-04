
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBeMxWFl4vxTSdE5KfKkpGTLETZ0zuHcA",
  authDomain: "templatemaster-b0e5b.firebaseapp.com",
  projectId: "templatemaster-b0e5b",
  storageBucket: "templatemaster-b0e5b.firebasestorage.app",
  messagingSenderId: "962640953278",
  appId: "1:962640953278:web:b75c3787185dd3c38c03ef",
  measurementId: "G-4MXX86P5QP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
