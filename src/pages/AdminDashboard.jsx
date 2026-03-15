import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, Timestamp } from 'firebase/firestore';
import { json2csv } from 'json-2-csv';

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRange, setFilterRange] = useState("Today"); // State for date filtering

  useEffect(() => {
    // 1. Calculate the start date based on the selected range
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

    // 2. Integrated 'where' clause for dynamic date filtering
    const q = query(
      collection(db, "checkins"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore Index Error: ", error);
      // Note: If you see an error here, check the console for the index-creation link.
    });

    return () => unsubscribe();
  }, [filterRange]); // Re-run query when filter changes

  const handleDownloadCSV = async () => {
    if (logs.length === 0) return alert("No data to export!");
    try {
      const data = logs.map(log => ({
        Name: log.name,
        College: log.college || "N/A",
        Purpose: log.purpose,
        Time: log.timestamp?.toDate().toLocaleString()
      }));
      const csv = await json2csv(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NEU_${filterRange}_Report_${new Date().toLocaleDateString()}.csv`;
      a.click();
    } catch (err) { console.error("CSV Error:", err); }
  };

  const toggleBlockUser = async (userId, currentStatus) => {
    if (!userId) return alert("User ID not found for this entry.");
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isBlocked: !currentStatus });
    } catch (e) { 
      console.error("Firebase Update Error:", e);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="history-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          {/* Integrated Filter Dropdown */}
          <select 
            className="filter-select" 
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>

          <button onClick={handleDownloadCSV} className="btn-export"></button>
          <button className="btn-signout-student" onClick={() => auth.signOut()} style={{ width: 'auto', marginTop: 0 }}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="stats-wrapper">
        <div className="stat-card maroon">
          {/* Automatically updates based on the filtered logs count */}
          <h3>{logs.length}</h3>
          <p>{filterRange.toUpperCase()} VISITS</p>
        </div>
        <div className="stat-card gray">
          <h3>{logs.length}</h3> {/* Consider a separate query if you want "Lifetime" total here */}
          <p>FILTERED TOTAL</p>
        </div>
      </div>

      <div className="search-wrapper">
        <input 
          type="text" 
          placeholder="Search by student name..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>NAME</th>
              <th>COLLEGE</th>
              <th>PURPOSE</th>
              <th>TIME</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className="name-cell"><strong>{log.name}</strong></td>
                <td>{log.college || "N/A"}</td>
                <td>{log.purpose}</td>
                <td className="time-cell">{log.timestamp?.toDate().toLocaleTimeString()}</td>
                <td>
                  <button 
                    onClick={() => toggleBlockUser(log.userId, log.isBlocked)}
                    className={`btn-block-action ${log.isBlocked ? 'active' : ''}`}
                  >
                    {log.isBlocked ? "UNBLOCK" : "BLOCK"}
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

export default AdminDashboard;