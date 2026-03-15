import React from 'react';
import { useState, useEffect } from 'react';
import { auth, db } from './config/firebase'; 
import { doc, getDoc } from 'firebase/firestore';

// 1. IMPORT THE CSS FILE HERE
import './App.css'; 

import Login from './pages/login';
import CheckIn from './pages/CheckIn';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        if (!currentUser.email.endsWith('@neu.edu.ph')) {
          await auth.signOut();
          alert("Access Denied: Please use your @neu.edu.ph institutional email.");
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.isBlocked === true) {
              await auth.signOut();
              alert("🚫 Your account has been blocked by the Administrator.");
              setUser(null);
              setIsAdmin(false);
              setLoading(false);
              return;
            }
            setIsAdmin(userData.role === 'admin');
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading-screen">Checking credentials...</div>;

  return (
    <main>
      {!user ? (
        <Login /> 
      ) : isAdmin ? (
        /* 2. WRAP THE DASHBOARD: 
           Your CSS uses #root:has(.history-container). 
           This wrapper triggers the 'breakout' to full width.
        */
        <div className="history-container">
          <AdminDashboard /> 
        </div>
      ) : (
        <CheckIn /> 
      )}
    </main>
  );
}

export default App;