import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyATWPJcAthVJvO6pTKAP4NO-nBzjuu2Z9E",
  authDomain: "neu-library-vms.firebaseapp.com",
  databaseURL: "https://neu-library-vms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "neu-library-vms",
  storageBucket: "neu-library-vms.firebasestorage.app",
  messagingSenderId: "137333842772",
  appId: "1:137333842772:web:517d2a990a4a65dd36dec1",
  measurementId: "G-62WK5GSFVV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);