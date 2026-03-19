import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../config/firebase";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 1. Domain Verification
      if (!user.email.endsWith("@neu.edu.ph")) {
        await signOut(auth);
        alert("Access Denied: Please use your @neu.edu.ph institutional email.");
        return;
      }

      // 2. User Data & Block Status Check
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().isBlocked) {
        await signOut(auth);
        alert("Your account is blocked. Please contact the Librarian.");
        return;
      }

      // 3. New User Setup
      if (!userSnap.exists()) {
        const isStaff = user.email.includes('staff') || user.email.includes('teacher');
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          isBlocked: false,
          userType: isStaff ? 'Employee' : 'Student',
          createdAt: serverTimestamp()
        });
      }

      navigate("/checkin");
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        alert("Login Error: " + error.code);
      }
    } finally {
      setLoading(false);
    }
  };

  const dynamicButtonStyle = {
    ...styles.googleBtn,
    backgroundColor: isHovered ? '#f8f9fa' : 'white',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isHovered ? '0 6px 12px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.05)',
    opacity: loading ? 0.7 : 1,
    cursor: loading ? 'wait' : 'pointer'
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.brandBox}>
          <h1 style={styles.brandTextMain}>NEU</h1>
          <h2 style={styles.brandTextSub}>Library</h2>
        </header>

        <p style={styles.subtitle}>Visitor Management System</p>

        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleLogin}
          disabled={loading}
          style={dynamicButtonStyle}
        >
          {/* Optional: Add a Google Icon here */}
          <span>{loading ? "Verifying..." : "Sign in with Google"}</span>
        </button>

        <footer style={styles.footerText}>
          Use your institutional email to proceed.
        </footer>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#730000',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'white',
    padding: '50px 40px',
    borderRadius: '28px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
    margin: '20px',
  },
  brandBox: {
    marginBottom: '15px',
  },
  brandTextMain: {
    margin: 0,
    color: '#730000',
    fontSize: '4rem',
    fontWeight: '900',
    lineHeight: '1',
    letterSpacing: '-3px',
  },
  brandTextSub: {
    margin: 0,
    color: '#333',
    fontSize: '1.8rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#777',
    marginBottom: '40px',
    fontWeight: '500',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '16px',
    borderRadius: '14px',
    border: '1px solid #e0e0e0',
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#3c4043',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  footerText: {
    marginTop: '30px',
    fontSize: '0.85rem',
    color: '#aaa',
  }
};

export default Login;