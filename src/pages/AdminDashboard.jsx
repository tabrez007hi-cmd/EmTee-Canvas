import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, onValue, set, update, get } from 'firebase/database';

const ADMIN_EMAILS = ["tabrez007hi@gmail.com", "admin@gmail.com"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✨ NEW: Universal Messaging State
  const [universalMessage, setUniversalMessage] = useState('');
  const [isSendingGlobal, setIsSendingGlobal] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      navigate('/user/home');
      return;
    }

    onValue(ref(db, 'membershipRequests'), (snap) => {
      if (snap.exists()) setRequests(Object.values(snap.val()).sort((a, b) => b.createdAt - a.createdAt));
      else setRequests([]);
    });

    onValue(ref(db, 'roleAssignments'), (snap) => {
      if (snap.exists()) setApprovedUsers(Object.values(snap.val()).sort((a, b) => b.approvedAt - a.approvedAt));
      else setApprovedUsers([]);
      setLoading(false);
    });
  }, [navigate]);

  const handleApprove = async (req) => {
    if (!window.confirm(`Approve ${req.email} for ${req.requestedRole.toUpperCase()}?`)) return;
    await update(ref(db, `users/${req.uid}/profile`), { role: req.requestedRole });
    await set(ref(db, `roleAssignments/${req.uid}`), { ...req, status: 'approved', approvedAt: Date.now(), approvedBy: auth.currentUser.email });
    await set(ref(db, `membershipRequests/${req.uid}`), null);
    alert('User Approved & Backed up! ✅');
  };

  const handleReject = async (uid) => {
    if (window.confirm('Reject and delete this request?')) await set(ref(db, `membershipRequests/${uid}`), null);
  };

  const handleRevoke = async (uid) => {
    if (window.confirm('Revoke this user\'s access and downgrade them to Normal?')) {
      await update(ref(db, `users/${uid}/profile`), { role: 'normal' });
      await set(ref(db, `roleAssignments/${uid}`), null);
    }
  };

  // ✨ NEW: Send Targeted Notification
  const handleNotifyUser = async (user) => {
    const msg = prompt(`Enter notification message for ${user.username} (${user.email}):`);
    if (!msg || !msg.trim()) return;
    
    const timestamp = Date.now();
    const notifId = `notif_${timestamp}`;
    const payload = { id: notifId, title: 'Admin Update', message: msg.trim(), createdAt: timestamp, read: false, sender: 'Admin' };
    
    await set(ref(db, `users/${user.uid}/notifications/${notifId}`), payload);
    alert(`Notification sent to ${user.username}! 📨`);
  };

  // ✨ NEW: Send Universal Notification (Fan-out)
  const handleSendUniversalMessage = async () => {
    if (!universalMessage.trim()) return;
    if (!window.confirm('Are you absolutely sure? This will send a notification to EVERY registered user.')) return;
    
    setIsSendingGlobal(true);
    try {
      const snap = await get(ref(db, 'users'));
      if (snap.exists()) {
        const usersObj = snap.val();
        const updates = {};
        const timestamp = Date.now();
        const notifId = `global_${timestamp}`;
        
        // Build a massive payload to update all users simultaneously
        Object.keys(usersObj).forEach(uid => {
          updates[`users/${uid}/notifications/${notifId}`] = {
            id: notifId,
            title: 'Global Announcement',
            message: universalMessage.trim(),
            createdAt: timestamp,
            read: false,
            sender: 'System Admin'
          };
        });
        
        await update(ref(db), updates);
        alert('Universal notification broadcasted successfully! 🌍');
        setUniversalMessage('');
      }
    } catch(e) {
      console.error(e);
      alert('Failed to send global notification.');
    }
    setIsSendingGlobal(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800"><i className="bi bi-shield-lock-fill text-indigo-600 mr-2"></i> Admin Control Panel</h1>
          <button onClick={() => navigate('/user/home')} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-all cursor-pointer">Back to Dashboard</button>
        </div>

        {/* ✨ NEW: Universal Notification Broadcaster */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-10 overflow-hidden flex flex-col md:flex-row">
          <div className="bg-indigo-600 p-6 md:w-1/3 flex flex-col justify-center text-white">
            <h2 className="text-xl font-bold mb-2"><i className="bi bi-broadcast"></i> Universal Broadcast</h2>
            <p className="text-indigo-100 text-sm leading-relaxed">Send a global push notification to every registered user on the platform simultaneously.</p>
          </div>
          <div className="p-6 md:w-2/3 flex flex-col">
            <textarea 
              value={universalMessage}
              onChange={(e) => setUniversalMessage(e.target.value)}
              placeholder="Write your announcement here..."
              className="w-full h-24 border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 resize-none mb-4 custom-scrollbar"
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSendUniversalMessage}
                disabled={isSendingGlobal || !universalMessage.trim()}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isSendingGlobal || !universalMessage.trim() ? 'bg-indigo-300 text-indigo-100 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer active:scale-95'}`}
              >
                {isSendingGlobal ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-send-fill"></i>}
                {isSendingGlobal ? 'Broadcasting...' : 'Send to All Users'}
              </button>
            </div>
          </div>
        </div>

        {/* PENDING REQUESTS TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-10 overflow-hidden">
          <div className="bg-slate-800 p-4 text-white font-bold flex items-center justify-between">
            <span>Pending Membership Requests</span>
            <span className="bg-red-500 px-2 py-0.5 rounded text-xs">{requests.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr><th className="p-4">User</th><th className="p-4">Email</th><th className="p-4">Requested Tier</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {requests.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-400">No pending requests.</td></tr>}
                {requests.map(r => (
                  <tr key={r.uid} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{r.username}</td>
                    <td className="p-4">{r.email}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${r.requestedRole === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>{r.requestedRole}</span></td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleApprove(r)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded font-bold transition-colors shadow-sm cursor-pointer">Approve</button>
                      <button onClick={() => handleReject(r.uid)} className="px-3 py-1 bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 rounded font-bold transition-colors cursor-pointer">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACKUP / APPROVED USERS TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-indigo-50 p-4 text-indigo-800 font-bold border-b border-indigo-100 flex items-center justify-between">
            <span>Role Assignments Backup (Database)</span>
            <span className="bg-indigo-200 px-2 py-0.5 rounded text-xs">{approvedUsers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr><th className="p-4">User</th><th className="p-4">Tier</th><th className="p-4">Approved By</th><th className="p-4">Date</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {approvedUsers.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400">No active members.</td></tr>}
                {approvedUsers.map(u => (
                  <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4"><div><span className="font-bold text-slate-800 block">{u.username}</span><span className="text-xs text-slate-400">{u.email}</span></div></td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.requestedRole === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>{u.requestedRole}</span></td>
                    <td className="p-4 text-xs font-mono">{u.approvedBy}</td>
                    <td className="p-4 text-xs">{new Date(u.approvedAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                      {/* ✨ NEW: Targeted Notification Button */}
                      <button onClick={() => handleNotifyUser(u)} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 rounded text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1"><i className="bi bi-bell-fill"></i> Notify</button>
                      <button onClick={() => handleRevoke(u.uid)} className="px-3 py-1.5 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 rounded text-xs font-bold transition-colors cursor-pointer shadow-sm">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}