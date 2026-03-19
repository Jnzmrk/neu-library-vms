import React, { useState, useEffect } from 'react';
import { auth, db } from './config/firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css'; 
import Login from './pages/login';
import CheckIn from './pages/CheckIn';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  // NEW: State to toggle between admin and user "modes"
  const [viewMode, setViewMode] = useState("admin"); 

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      // 1. If user logs out, clean up listener and reset states
      if (!currentUser) {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setUser(null);
        setIsAdmin(false);
        setViewMode("admin"); // Reset viewMode on logout
        setLoading(false);
        return;
      }

      // 2. Institutional Email Check
      if (!currentUser.email.endsWith('@neu.edu.ph')) {
        await auth.signOut();
        alert("Access Denied: Please use your @neu.edu.ph institutional email.");
        setLoading(false);
        return;
      }

      // 3. Real-time Status Listener
      const userRef = doc(db, "users", currentUser.uid);
      
      unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData.isBlocked === true) {
            auth.signOut();
            alert("🚫 Your account has been blocked by the Administrator.");
            setLoading(false);
            return;
          }
          
          setIsAdmin(userData.role === 'admin');
        } else {
          setIsAdmin(false);
        }

        // 4. Finalize Login State
        setUser(currentUser);
        setLoading(false);
      }, (error) => {
        console.error("Firestore listener error:", error);
        setUser(currentUser);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Checking credentials...</p>
      </div>
    );
  }

  return (
    <Router>
      <main>
        <Routes>
          {!user ? (
            <Route path="*" element={<Login />} /> 
          ) : (isAdmin && viewMode === "admin") ? (
            // Pass setViewMode to AdminDashboard so you can click a button to switch
            <Route path="*" element={<AdminDashboard setViewMode={setViewMode} />} />
          ) : (
            // Pass isAdmin and setViewMode to CheckIn so you can switch back to Admin
            <Route path="*" element={<CheckIn isAdmin={isAdmin} setViewMode={setViewMode} />} /> 
          )}
        </Routes>
      </main>
    </Router>
  );
}

export default App;