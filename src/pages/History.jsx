import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase'; // Added auth for Sign Out
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, where, Timestamp } from 'firebase/firestore';

const History = () => {
  const [logs, setLogs] = useState([]);
  const [filterRange, setFilterRange] = useState("Today"); // 1. Added filter state

  useEffect(() => {
    // Calculate the start date based on the selected range
    const now = new Date();
    let startDate = new Date();

    if (filterRange === "Today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (filterRange === "This Week") {
      const day = now.getDay();
      const diff = now.getDate() - day;
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (filterRange === "This Month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // 2. Integrated 'where' clause for date filtering
    const q = query(
      collection(db, "checkins"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(historyData);
    }, (error) => {
      console.error("Query Error (Check if index is created):", error);
    });

    return () => unsubscribe();
  }, [filterRange]); // Effect re-runs when filterRange changes

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this log?")) {
      try {
        await deleteDoc(doc(db, "checkins", id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete.");
      }
    }
  };

  return (
    <div className="history-container">
      {/* 3. Integrated Admin Header with Filter Dropdown */}
      <div className="admin-header">
        <h1>Admin Dashboard: Analytics</h1>
        <div className="header-actions">
          <select 
            className="filter-select" 
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
          <button className="btn-export">Export CSV</button>
          <button className="btn-signout-student" onClick={() => auth.signOut()} style={{ width: 'auto', marginTop: 0 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Section (Optional: Visual matching of image_602494.png) */}
      <div className="stats-wrapper">
        <div className="stat-card maroon">
          <h3>{logs.length}</h3>
          <p>{filterRange} Visitors</p>
        </div>
        <div className="stat-card">
          <h3>6</h3> {/* Static for now or fetch total count */}
          <p>TOTAL VISITS</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>College</th>
              <th>Purpose</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontWeight: '700' }}>{log.name}</td>
                <td>{log.college}</td>
                <td>
                  <span className="purpose-badge" data-purpose={log.purpose}>
                    {log.purpose}
                  </span>
                </td>
                <td>{log.timestamp?.toDate().toLocaleTimeString()}</td>
                <td>
                  <button className="btn-block" onClick={() => handleDelete(log.id)}>
                    REMOVE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;