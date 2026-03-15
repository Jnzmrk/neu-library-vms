import React from 'react';  
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../config/firebase";

const Login = () => {
  const handleLogin = async () => {
    try {
      // 1. Trigger the Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 2. Domain Restriction
      if (!user.email.endsWith("@neu.edu.ph")) {
        await signOut(auth);
        alert("Access Denied: Please use your @neu.edu.ph institutional email.");
        return;
      }

      // 3. Check Firestore 'isBlocked' status
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.isBlocked) {
          await signOut(auth);
          alert("Your account is blocked. Please contact the Librarian.");
          return; 
        }
      } else {
        // Create profile for brand-new users
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          isBlocked: false,
          role: "student",
          createdAt: serverTimestamp()
        });
      }

      console.log("Welcome to NEU Library:", user.displayName);
      
    } catch (error) {
      console.error("Full Error Object:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        alert("Login Error: " + error.code);
      }
    }
  };

  return (
    <div className="card">
      <h2>NEU Library</h2>
      <p className="welcome-text">Visitor Management System</p>
  
      {/* Updated to use the premium btn-google class and icon */}
      <button className="btn-google" onClick={handleLogin}>
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;