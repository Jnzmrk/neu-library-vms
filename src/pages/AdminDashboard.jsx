import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../config/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, where, Timestamp, setDoc 
} from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const AdminDashboard = ({ setViewMode }) => {
  const [logs, setLogs] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRange, setFilterRange] = useState("Today");
  const [filterPurpose, setFilterPurpose] = useState("All Purposes");
  const [filterCollege, setFilterCollege] = useState("All Colleges");
  const [filterUserType, setFilterUserType] = useState("All User Types");

  // State for search bar focus and general hover effects
  const [searchFocus, setSearchFocus] = useState(false);
  const [hoverState, setHoverState] = useState({ 
    switch: false, signout: false, maroon: false, white: false 
  });

  useEffect(() => {
    const now = new Date();
    let startDate = new Date();
    if (filterRange === "Today") startDate.setHours(0, 0, 0, 0);
    else if (filterRange === "This Week") {
      const day = now.getDay();
      startDate = new Date(now.setDate(now.getDate() - day));
      startDate.setHours(0, 0, 0, 0);
    } 
    else if (filterRange === "This Month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (filterRange === "This Year") startDate = new Date(now.getFullYear(), 0, 1);

    const q = query(
      collection(db, "checkins"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [filterRange]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const statusMap = {};
      snapshot.docs.forEach(doc => { statusMap[doc.id] = doc.data().isBlocked; });
      setBlockedUsers(statusMap);
    });
    return () => unsubscribe();
  }, []);

  const chartData = useMemo(() => {
    const dataMap = {};
    logs.forEach(log => {
      const date = log.timestamp?.toDate();
      if (!date) return;
      let label = "";
      if (filterRange === "Today") label = date.getHours() + ":00";
      else if (filterRange === "This Week") label = date.toLocaleDateString('en-US', { weekday: 'short' });
      else if (filterRange === "This Month") label = date.getDate().toString();
      else if (filterRange === "This Year") label = date.toLocaleDateString('en-US', { month: 'short' });
      dataMap[label] = (dataMap[label] || 0) + 1;
    });
    return Object.keys(dataMap).map(key => ({ name: key, visits: dataMap[key] }));
  }, [logs, filterRange]);

  const toggleBlockUser = async (userId) => {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      const isCurrentlyBlocked = blockedUsers[userId] || false;
      await setDoc(userRef, { isBlocked: !isCurrentlyBlocked }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPurpose = filterPurpose === "All Purposes" || log.purpose === filterPurpose;
    const matchesCollege = filterCollege === "All Colleges" || log.college === filterCollege;
    const isEmployee = log.email?.includes('staff') || log.email?.includes('teacher') || log.userType === 'Employee';
    const matchesUserType = filterUserType === "All User Types" || (filterUserType === "Employee" && isEmployee) || (filterUserType === "Student" && !isEmployee);
    return matchesSearch && matchesPurpose && matchesCollege && matchesUserType;
  });

  return (
    <div style={styles.pageBackground}>
      <div style={styles.fixedContainer}>
        {/* Header */}
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <div style={styles.headerActions}>
            <button
              onClick={() => setViewMode("user")}
              onMouseEnter={() => setHoverState(prev => ({ ...prev, switch: true }))}
              onMouseLeave={() => setHoverState(prev => ({ ...prev, switch: false }))}
              style={{ ...styles.btnSwitch, backgroundColor: hoverState.switch ? "#5a0000" : "#730000" }}
            >
              Switch to User View
            </button>
            <button
              style={{ ...styles.btnSignout, backgroundColor: hoverState.signout ? "#dce6f0" : "#ebf2f7" }}
              onMouseEnter={() => setHoverState(prev => ({ ...prev, signout: true }))}
              onMouseLeave={() => setHoverState(prev => ({ ...prev, signout: false }))}
              onClick={() => auth.signOut()}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* SIDE-BY-SIDE SECTION: Chart + Stats */}
        <div style={styles.topSectionGrid}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Visitor Trends</h3>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#999' }} />
                  <Tooltip 
                    cursor={{ fill: '#f9f9f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontSize: '11px' }}
                  />
                  <Bar dataKey="visits" radius={[3, 3, 0, 0]} barSize={25}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#730000" : "#ffa500"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.sideStatsWrapper}>
            <div 
              onMouseEnter={() => setHoverState(prev => ({ ...prev, maroon: true }))}
              onMouseLeave={() => setHoverState(prev => ({ ...prev, maroon: false }))}
              style={{
                ...styles.statCardMaroon,
                transform: hoverState.maroon ? 'translateX(5px)' : 'translateX(0)',
              }}
            >
              <h3 style={styles.statNumWhite}>{logs.length}</h3>
              <p style={styles.statLabelWhite}>{filterRange.toUpperCase()} VISITS</p>
            </div>

            <div 
              onMouseEnter={() => setHoverState(prev => ({ ...prev, white: true }))}
              onMouseLeave={() => setHoverState(prev => ({ ...prev, white: false }))}
              style={{
                ...styles.statCardWhite,
                transform: hoverState.white ? 'translateX(5px)' : 'translateX(0)',
              }}
            >
              <h3 style={styles.statNumDark}>{filteredLogs.length}</h3>
              <p style={styles.statLabelGray}>RESULTS</p>
            </div>
          </div>
        </div>

        {/* IMPROVED DROPDOWN FILTERS */}
        <div style={styles.filterCard}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>User Type</label>
            <select style={styles.filterSelect} value={filterUserType} onChange={(e) => setFilterUserType(e.target.value)}>
              <option value="All User Types">All Types</option>
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>College / Dept</label>
            <select style={styles.filterSelect} value={filterCollege} onChange={(e) => setFilterCollege(e.target.value)}>
              <option value="All Colleges">All Colleges</option>
              <option value="College of Informatics and Computing Studies">CICS</option>
              <option value="College of CS">College of CS</option>
              <option value="College of Engineering">Engineering</option>
              <option value="College of Arts">Arts</option>
              <option value="College of Business">Business</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Purpose</label>
            <select style={styles.filterSelect} value={filterPurpose} onChange={(e) => setFilterPurpose(e.target.value)}>
              <option value="All Purposes">All Purposes</option>
              <option value="Computer Use">Computer Use</option>
              <option value="Research">Research</option>
              <option value="Study">Study</option>
              <option value="Borrowing/Returning">Borrowing</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Timeframe</label>
            <select style={styles.filterSelect} value={filterRange} onChange={(e) => setFilterRange(e.target.value)}>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
        </div>

        {/* Search & Table */}
        <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search name..."
             
              style={{ 
                ...styles.searchInput, 
                borderColor: searchFocus ? '#730000' : '#eee',
                boxShadow: searchFocus ? '0 0 8px rgba(115, 0, 0, 0.15)' : '0 2px 5px rgba(0,0,0,0.02)'
              }}
              value={searchTerm}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={{ ...styles.th, width: '22%' }}>NAME</th>
                <th style={{ ...styles.th, width: '13%' }}>TYPE</th>
                <th style={{ ...styles.th, width: '22%' }}>COLLEGE</th>
                <th style={{ ...styles.th, width: '18%' }}>PURPOSE</th>
                <th style={{ ...styles.th, width: '12%' }}>TIME</th>
                <th style={{ ...styles.th, width: '13%' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isEmployee = log.email?.includes('staff') || log.email?.includes('teacher') || log.userType === 'Employee';
                return (
                  <tr key={log.id}>
                    <td style={styles.td}><div style={styles.truncate}><strong>{log.name}</strong></div></td>
                    <td style={styles.td}>
                      <span style={{ ...styles.typeBadge, backgroundColor: isEmployee ? "#730000" : "#f0f0f0", color: isEmployee ? "#fff" : "#333" }}>
                        {isEmployee ? "STAFF" : "STUDENT"}
                      </span>
                    </td>
                    <td style={styles.td}><div style={styles.truncate}>{log.college || "N/A"}</div></td>
                    <td style={styles.td}><div style={styles.truncate}>{log.purpose}</div></td>
                    <td style={styles.td}>{log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => toggleBlockUser(log.userId)}
                        style={{ ...styles.btnBlock, backgroundColor: blockedUsers[log.userId] ? "#4a4a4a" : "#730000" }}
                      >
                        {blockedUsers[log.userId] ? "UNBLOCK" : "BLOCK"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageBackground: { backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '30px 0' },
  fixedContainer: { width: '1100px', flexShrink: 0 },
  headerCard: { marginTop:'-25px', paddingBottom: '20px',backgroundColor: 'white', padding: '20px 40px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { margin: 0, fontSize: '28px', fontWeight: '800', color: '#730000' },
  headerActions: { textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '5px' },
  btnSwitch: { color: "white", padding: "8px 14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: '0.8rem', transition: 'all 0.2s' },
  btnSignout: { padding: '6px', color: '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' },
  
  topSectionGrid: { display: 'flex', gap: '15px', marginBottom: '15px' , marginTop: '20px'},
  chartCard: { flex: 2, backgroundColor: 'white', padding: '15px 20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  chartTitle: { margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  sideStatsWrapper: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' },
  statCardMaroon: { flex: 1, backgroundColor: '#730000', padding: '15px 25px', borderRadius: '15px', color: 'white', borderLeft: '6px solid #ffa500', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  statCardWhite: { flex: 1, backgroundColor: 'white', padding: '15px 25px', borderRadius: '15px', borderLeft: '6px solid #730000', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  statNumWhite: { fontSize: '1.8rem', margin: 0, fontWeight: '800' },
  statNumDark: { fontSize: '1.8rem', margin: 0, fontWeight: '800', color: '#730000' },
  statLabelWhite: { fontSize: '0.65rem', fontWeight: 'bold', marginTop: '2px', opacity: 0.8 },
  statLabelGray: { fontSize: '0.65rem', fontWeight: 'bold', color: '#999', marginTop: '2px' },

  filterCard: { display: 'flex', gap: '20px', marginBottom: '15px', backgroundColor: 'white', padding: '15px 25px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  filterGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  filterLabel: { fontSize: '0.65rem', fontWeight: '800', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '2px' },
  filterSelect: { 
    width: '100%', 
    padding: '10px 12px', 
    borderRadius: '8px', 
    border: '1px solid #eee', 
    outline: 'none', 
    cursor: 'pointer', 
    fontSize: '0.85rem', 
    fontWeight: '600',
    color: '#444',
    backgroundColor: '#fdfdfd',
    appearance: 'none',
    backgroundImage: `linear-gradient(45deg, transparent 50%, #730000 50%), linear-gradient(135deg, #730000 50%, transparent 50%)`,
    backgroundPosition: `calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)`,
    backgroundSize: `5px 5px, 5px 5px`,
    backgroundRepeat: 'no-repeat',
    transition: 'border-color 0.2s ease'
  },
  
  searchInput: { 
    width: '320px', 
    padding: '12px 18px', 
    borderRadius: '12px', 
    border: '2px solid #eee', 
    outline: 'none', 
    fontSize: '0.9rem', 
    transition: 'all 0.3s ease'
  },

  tableWrapper: { backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { textAlign: 'left', backgroundColor: '#fafafa', borderBottom: '1px solid #eee' },
  th: { padding: '12px 20px', color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' },
  td: { padding: '14px 20px', borderBottom: '1px solid #f9f9f9', fontSize: '0.85rem' },
  typeBadge: { padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800' },
  truncate: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  btnBlock: { color: "white", width: '100%', padding: "6px 0", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: '0.75rem' }
};

export default AdminDashboard;