import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CheckIn = ({ isAdmin, setViewMode }) => {
  const [college, setCollege] = useState("");
  const [purpose, setPurpose] = useState("");
  const [userType, setUserType] = useState("Student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [isConfirmHovered, setIsConfirmHovered] = useState(false);
  const [isSignOutHovered, setIsSignOutHovered] = useState(false);
  const [isAdminHovered, setIsAdminHovered] = useState(false);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!college || !purpose) return alert("Please fill in all fields.");
    
    setIsSubmitting(true);
    
    // Clean the data before sending
    const checkinData = {
      userId: auth.currentUser.uid,
      name: auth.currentUser.displayName,
      email: auth.currentUser.email,
      userType: userType,
      college: college.trim(), // Ensure no trailing spaces
      purpose: purpose,
      timestamp: serverTimestamp(),
    };

    console.log("Submitting Check-in Data:", checkinData);

    try {
      await addDoc(collection(db, "checkins"), checkinData);

      setShowSuccess(true);
      setPurpose("");
      setCollege("");
      
      setTimeout(() => setShowSuccess(false), 2000);

    } catch (error) {
      console.error("Firebase Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      {showSuccess && (
        <div style={styles.overlay}>
          <div style={styles.successCard}>
            <div style={styles.checkCircle}>✓</div>
            <h2 style={styles.successTitle}>Check-in Successful!</h2>
            <p style={styles.successSub}>Enjoy your stay at the Library.</p>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h1 style={styles.mainTitle}>Library Entry</h1>
        <p style={styles.welcomeText}>
          Welcome, <span style={styles.userName}>{auth.currentUser?.displayName}</span>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>I AM A:</label>
            <div style={styles.toggleRow}>
              <button 
                type="button"
                onClick={() => setUserType("Student")}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: userType === "Student" ? "#730000" : "#f8f9fa",
                  color: userType === "Student" ? "white" : "#666",
                  border: userType === "Student" ? "1px solid #730000" : "1px solid #dee2e6"
                }}
              >
                Student
              </button>
              <button 
                type="button"
                onClick={() => setUserType("Employee")}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: userType === "Employee" ? "#730000" : "#f8f9fa",
                  color: userType === "Employee" ? "white" : "#666",
                  border: userType === "Employee" ? "1px solid #730000" : "1px solid #dee2e6"
                }}
              >
                Teacher/Staff
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>PURPOSE OF VISIT</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} style={styles.select}>
              <option value="">Select Purpose</option>
              <option value="Computer Use">Computer Use</option>
              <option value="Research">Research</option>
              <option value="Study">Study</option>
              <option value="Borrowing/Returning">Borrowing/Returning</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>COLLEGE / DEPARTMENT</label>
            <select value={college} onChange={(e) => setCollege(e.target.value)} style={styles.select}>
              <option value="">Select College</option>
              {/* FIXED VALUE BELOW: Removed the double "College of" typo */}
              <option value="College of Informatics and Computing Studies">College of Informatics and Computing Studies</option>
              <option value="College of Criminology">College of Criminology</option>
              <option value="College of Nursing">College of Nursing</option>
              <option value="College of Engineering">College of Engineering</option>
              <option value="College of Arts and Sciences">College of Arts and Sciences</option>
              <option value="College of Business">College of Business</option>
              <option value="N/A">N/A</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || showSuccess}
            onMouseEnter={() => setIsConfirmHovered(true)}
            onMouseLeave={() => setIsConfirmHovered(false)}
            style={{
              ...styles.confirmBtn,
              backgroundColor: isConfirmHovered ? "#5a0000" : "#730000",
              transform: isConfirmHovered ? "translateY(-1px)" : "translateY(0)",
              boxShadow: isConfirmHovered ? "0 4px 12px rgba(115,0,0,0.2)" : "none",
              opacity: (isSubmitting || showSuccess) ? 0.7 : 1
            }}
          >
            {isSubmitting ? "RECORDING..." : "Confirm Check-In"}
          </button>
        </form>

        <div style={styles.cardFooter}>
          {isAdmin && (
            <button 
              onClick={() => setViewMode("admin")}
              onMouseEnter={() => setIsAdminHovered(true)}
              onMouseLeave={() => setIsAdminHovered(false)}
              style={{
                ...styles.secondaryBtn,
                backgroundColor: isAdminHovered ? "#f1f3f5" : "transparent",
                color: "#730000",
                borderColor: isAdminHovered ? "#730000" : "#dee2e6",
                paddingLeft: isAdminHovered ? "25px" : "20px"
              }}
            >
              Admin Dashboard →
            </button>
          )}

          <button 
            onClick={() => auth.signOut()}
            onMouseEnter={() => setIsSignOutHovered(true)}
            onMouseLeave={() => setIsSignOutHovered(false)}
            style={{
              ...styles.secondaryBtn,
              backgroundColor: isSignOutHovered ? "#fff5f5" : "transparent",
              color: isSignOutHovered ? "#dc3545" : "#666",
              marginTop: "8px"
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { backgroundColor: "#730000", height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", position: "fixed", top: 0, left: 0, margin: 0, padding: 0 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  successCard: { backgroundColor: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '320px' },
  checkCircle: { width: '60px', height: '60px', backgroundColor: '#28a745', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', margin: '0 auto 20px auto' },
  successTitle: { margin: '0 0 10px 0', color: '#333', fontSize: '1.4rem' },
  successSub: { margin: 0, color: '#777', fontSize: '0.9rem' },
  card: { backgroundColor: "#ffffff", width: "360px", padding: "24px 32px", borderRadius: "24px", textAlign: "center", boxShadow: "0 15px 35px rgba(0,0,0,0.2)" },
  mainTitle: { color: "#730000", fontSize: "1.5rem", fontWeight: "800", margin: "0" },
  welcomeText: { color: "#888", fontSize: "0.85rem", marginBottom: "20px" },
  userName: { fontWeight: "700", color: "#444" },
  form: { textAlign: "left" },
  inputGroup: { marginBottom: "14px" }, 
  label: { fontSize: "0.65rem", fontWeight: "700", color: "#adb5bd", marginBottom: "6px", display: "block", textTransform: "uppercase" },
  toggleRow: { display: "flex", gap: "8px" },
  toggleBtn: { flex: 1, padding: "10px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  select: { width: "100%", padding: "10px 15px", borderRadius: "12px", border: "1px solid #dee2e6", fontSize: "0.9rem", outline: "none", backgroundColor: "#fff", color: "#495057", cursor: "pointer" },
  confirmBtn: { width: "100%", color: "white", padding: "12px", border: "none", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", marginTop: "10px", transition: "all 0.3s ease" },
  secondaryBtn: { width: "100%", padding: "10px 20px", border: "1px solid #dee2e6", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", textAlign: "center", transition: "all 0.3s ease", display: "flex", justifyContent: "center", alignItems: "center" },
  cardFooter: { marginTop: "16px" }
};

export default CheckIn;