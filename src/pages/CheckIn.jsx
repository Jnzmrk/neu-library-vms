import { useState } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CheckIn = () => {
  const [purpose, setPurpose] = useState("Study");
  const [college, setCollege] = useState("College of CS");
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    const user = auth.currentUser;

    if (!user) {
      return alert("You must be signed in to check-in.");
    }

    if (loading) return;
    setLoading(true);

    try {
      const checkinsRef = collection(db, "checkins");
      
      await addDoc(checkinsRef, {
        userId: user.uid,
        name: user.displayName, 
        email: user.email,
        purpose: purpose, 
        college: college, 
        isBlocked: false,
        timestamp: serverTimestamp(),
      });
      
      alert("Welcome to NEU Library!"); 

      setTimeout(() => {
        auth.signOut();
      }, 2000);

    } catch (error) {
      console.error("Error saving check-in:", error);
      alert("Error saving check-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-card">
      <h2>Library Entry</h2>
      
      <p className="welcome-text">
        Welcome, <strong>{auth.currentUser?.displayName}</strong>
      </p>
      
      <div className="checkin-form">
        {/* Purpose of Visit Group */}
        <div className="input-group">
          <label>Purpose of Visit</label>
          <select 
            value={purpose} 
            onChange={(e) => setPurpose(e.target.value)}
            disabled={loading}
          >
            <option value="Study">Study</option>
            <option value="Research">Research</option>
            <option value="Computer Use">Computer Use</option>
            <option value="Thesis">Thesis</option>
          </select>
        </div>

        {/* College / Department Group */}
        <div className="input-group">
          <label>College / Department</label>
          <select 
            value={college} 
            onChange={(e) => setCollege(e.target.value)}
            disabled={loading}
          >
            <option value="College of CS">College of CS</option>
            <option value="College of Nursing">College of Nursing</option>
            <option value="College of Engineering">College of Engineering</option>
            <option value="College of Arts and Sciences">College of Arts and Sciences</option>
            <option value="College of Business Administration">College of Business Admin</option>
            <option value="College of Education">College of Education</option>
          </select>
        </div>

        {/* Action Buttons */}
        <button 
          className="btn-confirm" 
          onClick={handleCheckIn}
          disabled={loading}
          style={{ 
            opacity: loading ? 0.6 : 1, 
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Processing..." : "Confirm Check-In"}
        </button>

        <button 
          className="btn-signout-student" 
          onClick={() => auth.signOut()}
          disabled={loading}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default CheckIn;