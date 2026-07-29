import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, onValue, set, update, get } from 'firebase/database';
import { useUI } from '../contexts/UIContext';
import RoleBadge from '../components/RoleBadge';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [universalMessage, setUniversalMessage] = useState('');
  const [isSendingGlobal, setIsSendingGlobal] = useState(false);
  const { showToast, showConfirm } = useUI();
  
  // ✨ NEW: Notification Management State
  const [sentNotifications, setSentNotifications] = useState([]);

  const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS 
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.toLowerCase().trim()) 
    : [];

  // ✨ NEW: Fetch all notifications across the platform
  const fetchSentNotifications = async () => {
    try {
      const snap = await get(ref(db, 'users'));
      if (snap.exists()) {
        const usersObj = snap.val();
        const notifMap = new Map();

        // Loop through all users to extract and group notifications by their ID
        Object.entries(usersObj).forEach(([uid, userData]) => {
          if (userData.notifications) {
            Object.values(userData.notifications).forEach(notif => {
              if (!notifMap.has(notif.id)) {
                notifMap.set(notif.id, {
                  ...notif,
                  recipients: [uid], // Track who received this exact notification
                  isGlobal: notif.id.startsWith('global_')
                });
              } else {
                notifMap.get(notif.id).recipients.push(uid);
              }
            });
          }
        });

        // Sort from newest to oldest
        const sortedNotifs = Array.from(notifMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        setSentNotifications(sortedNotifs);
      } else {
        setSentNotifications([]);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

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

    // ✨ Load notification log on mount
    fetchSentNotifications();
  }, [navigate]);

  const handleApprove = async (req) => {
    showConfirm({
      title: 'Approve Request?',
      message: `Approve ${req.email} for ${req.requestedRole.toUpperCase()} tier?`,
      onConfirm: async () => {
        await update(ref(db, `users/${req.uid}/profile`), { role: req.requestedRole });
        await set(ref(db, `roleAssignments/${req.uid}`), { ...req, status: 'approved', approvedAt: Date.now(), approvedBy: auth.currentUser.email });
        await set(ref(db, `membershipRequests/${req.uid}`), null);
        showToast('User Approved & Backed up! ✅', 'success');
      }
    });
  };

  const handleReject = (uid) => {
    showConfirm({
      title: 'Reject Request?',
      message: 'Are you sure you want to reject and delete this membership request?',
      danger: true,
      confirmText: 'Reject',
      onConfirm: async () => {
        await set(ref(db, `membershipRequests/${uid}`), null);
        showToast('Request rejected and deleted. 🗑️', 'success');
      }
    });
  };

  const handleRevoke = (uid) => {
    showConfirm({
      title: 'Revoke Access?',
      message: "Are you sure you want to revoke this user's access and downgrade them to Normal?",
      danger: true,
      confirmText: 'Revoke',
      onConfirm: async () => {
        await update(ref(db, `users/${uid}/profile`), { role: 'normal' });
        await set(ref(db, `roleAssignments/${uid}`), null);
        showToast("User's access has been revoked. 🔽", 'success');
      }
    });
  };

  const handleNotifyUser = async (user) => {
    showConfirm({
      title: 'Notify User',
      message: `Send a direct notification to ${user.username}:`,
      isPrompt: true,
      placeholder: 'Write message...',
      confirmText: 'Send',
      onConfirm: async (msg) => {
        if (!msg || !msg.trim()) return;
        const timestamp = Date.now();
        const notifId = `notif_${timestamp}`;
        const payload = { id: notifId, title: 'Admin Update', message: msg.trim(), createdAt: timestamp, read: false, sender: 'Admin' };
        
        await set(ref(db, `users/${user.uid}/notifications/${notifId}`), payload);
        showToast(`Notification sent to ${user.username}! 📨`, 'success');
        fetchSentNotifications(); // ✨ Refresh log
      }
    });
  };

  const handleSendUniversalMessage = async () => {
    if (!universalMessage.trim()) return;
    showConfirm({
      title: 'Universal Broadcast',
      message: 'Are you absolutely sure? This will send a notification to EVERY registered user.',
      danger: true,
      confirmText: 'Broadcast',
      onConfirm: async () => {   
        setIsSendingGlobal(true);
        try {
          const snap = await get(ref(db, 'users'));
          if (snap.exists()) {
            const usersObj = snap.val();
            const updates = {};
            const timestamp = Date.now();
            const notifId = `global_${timestamp}`;
            
            Object.keys(usersObj).forEach(uid => {
              updates[`users/${uid}/notifications/${notifId}`] = {
                id: notifId, title: 'Global Announcement', message: universalMessage.trim(), createdAt: timestamp, read: false, sender: 'System Admin'
              };
            });
            
            await update(ref(db), updates);
            showToast('Universal notification broadcasted successfully! 🌍', 'success');
            setUniversalMessage('');
            fetchSentNotifications(); // ✨ Refresh log
          }
        } catch(e) {
          showToast('Failed to send global notification.', 'error');
        }
        setIsSendingGlobal(false);
      }
    });
  };

  // ✨ NEW: Edit existing notifications globally
  const handleEditNotification = (notif) => {
    showConfirm({
      title: 'Edit Notification',
      message: 'Update the message for this notification. This will push the update to everyone who received it.',
      isPrompt: true,
      placeholder: notif.message,
      confirmText: 'Save Changes',
      onConfirm: async (newMsg) => {
        if (!newMsg || newMsg.trim() === notif.message) return;
        
        const updates = {};
        notif.recipients.forEach(uid => {
          updates[`users/${uid}/notifications/${notif.id}/message`] = newMsg.trim();
        });
        
        try {
          await update(ref(db), updates);
          showToast('Notification successfully updated! ✏️', 'success');
          fetchSentNotifications();
        } catch (e) {
          showToast('Failed to update notification.', 'error');
        }
      }
    });
  };

  // ✨ NEW: Delete existing notifications globally
  const handleDeleteNotification = (notif) => {
    showConfirm({
      title: 'Delete Notification?',
      message: `This will permanently delete this notification from the inboxes of ${notif.recipients.length} user(s).`,
      danger: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        const updates = {};
        notif.recipients.forEach(uid => {
          updates[`users/${uid}/notifications/${notif.id}`] = null;
        });
        
        try {
          await update(ref(db), updates);
          showToast('Notification permanently deleted. 🗑️', 'success');
          fetchSentNotifications();
        } catch (e) {
          showToast('Failed to delete notification.', 'error');
        }
      }
    });
  };

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans p-6 sm:p-10 text-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-white"><i className="bi bi-shield-lock-fill text-indigo-500 mr-2"></i> Admin Control Panel</h1>
          <button onClick={() => navigate('/user/home')} className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-lg transition-all cursor-pointer">Back to Dashboard</button>
        </div>

        {/* Universal Notification Broadcaster */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mb-10 overflow-hidden flex flex-col md:flex-row">
          <div className="bg-indigo-600 p-6 md:w-1/3 flex flex-col justify-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
            <h2 className="text-xl font-bold mb-2 relative z-10"><i className="bi bi-broadcast"></i> Universal Broadcast</h2>
            <p className="text-indigo-100 text-sm leading-relaxed relative z-10">Send a global push notification to every registered user on the platform simultaneously.</p>
          </div>
          <div className="p-6 md:w-2/3 flex flex-col">
            <textarea 
              value={universalMessage}
              onChange={(e) => setUniversalMessage(e.target.value)}
              placeholder="Write your announcement here..."
              className="w-full h-24 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 resize-none mb-4 custom-scrollbar placeholder-slate-600"
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSendUniversalMessage}
                disabled={isSendingGlobal || !universalMessage.trim()}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isSendingGlobal || !universalMessage.trim() ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer'}`}
              >
                {isSendingGlobal ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-send-fill"></i>}
                {isSendingGlobal ? 'Broadcasting...' : 'Send to All Users'}
              </button>
            </div>
          </div>
        </div>

        {/* ✨ NEW: SENT NOTIFICATIONS LOG */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mb-10 overflow-hidden">
          <div className="bg-slate-950 border-b border-slate-800 p-4 text-white font-bold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Sent Notifications Log</span>
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs">{sentNotifications.length}</span>
            </div>
            <button onClick={fetchSentNotifications} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs cursor-pointer bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
               <i className="bi bi-arrow-clockwise"></i> Refresh Log
            </button>
          </div>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300 relative">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Message Details</th>
                  <th className="p-4">Recipients</th>
                  <th className="p-4">Date Sent</th>
                  <th className="p-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {sentNotifications.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500"><i className="bi bi-envelope-x text-3xl block mb-2 opacity-30"></i>No notifications sent yet.</td></tr>}
                {sentNotifications.map(n => (
                  <tr key={n.id} className="border-b border-slate-800/50 hover:bg-slate-800 transition-colors group">
                    <td className="p-4 align-middle">
                      {n.isGlobal ? (
                        <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-max"><i className="bi bi-globe-americas"></i> Global</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-max"><i className="bi bi-person-fill"></i> Direct</span>
                      )}
                    </td>
                    <td className="p-4 align-middle max-w-sm">
                      <div className="font-bold text-white text-xs mb-1">{n.title}</div>
                      <div className="truncate text-slate-400 text-[11px]" title={n.message}>{n.message}</div>
                    </td>
                    <td className="p-4 align-middle text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-people-fill text-slate-500"></i> {n.recipients.length} User(s)
                      </div>
                    </td>
                    <td className="p-4 align-middle text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-right space-x-2 align-middle">
                      <button onClick={() => handleEditNotification(n)} className="w-8 h-8 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500 hover:text-white text-blue-400 rounded-lg transition-all cursor-pointer shadow-sm" title="Edit Message"><i className="bi bi-pencil-fill text-xs"></i></button>
                      <button onClick={() => handleDeleteNotification(n)} className="w-8 h-8 bg-slate-800 border border-slate-700 hover:bg-red-500 hover:border-red-500 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer shadow-sm" title="Delete Notification"><i className="bi bi-trash-fill text-xs"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PENDING REQUESTS TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mb-10 overflow-hidden">
          <div className="bg-slate-950 border-b border-slate-800 p-4 text-white font-bold flex items-center justify-between">
            <span>Pending Membership Requests</span>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs">{requests.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800">
                <tr><th className="p-4">User</th><th className="p-4">Email</th><th className="p-4">Requested Tier</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {requests.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No pending requests.</td></tr>}
                {requests.map(r => (
                  <tr key={r.uid} className="border-b border-slate-800/50 hover:bg-slate-800 transition-colors">
                    <td className="p-4 font-bold text-white">{r.username}</td>
                    <td className="p-4 text-slate-400">{r.email}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${r.requestedRole === 'pro' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>{r.requestedRole}</span></td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleApprove(r)} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded font-bold transition-all shadow-sm cursor-pointer">Approve</button>
                      <button onClick={() => handleReject(r.uid)} className="px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-red-500 hover:border-red-500 hover:text-white text-slate-400 rounded font-bold transition-all cursor-pointer">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACKUP / APPROVED USERS TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-950 border-b border-slate-800 p-4 text-white font-bold flex items-center justify-between">
            <span>Role Assignments Backup (Database)</span>
            <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-xs">{approvedUsers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800">
                <tr><th className="p-4">User</th><th className="p-4">Tier</th><th className="p-4">Approved By</th><th className="p-4">Date</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {approvedUsers.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-500">No active members.</td></tr>}
                {approvedUsers.map(u => (
                  <tr key={u.uid} className="border-b border-slate-800/50 hover:bg-slate-800 transition-colors">
                    <td className="p-4"><div><span className="font-bold text-white block">{u.username}</span><span className="text-xs text-slate-500">{u.email}</span></div></td>
                    <td className="p-4"><span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${u.requestedRole === 'pro' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>{u.requestedRole}</span></td>
                    <td className="p-4 text-xs font-mono text-slate-400">{u.approvedBy}</td>
                    <td className="p-4 text-xs text-slate-400">{new Date(u.approvedAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                      <button onClick={() => handleNotifyUser(u)} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-blue-400 rounded text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"><i className="bi bi-bell-fill"></i> Notify</button>
                      <button onClick={() => handleRevoke(u.uid)} className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-red-500 hover:border-red-500 hover:text-white text-slate-400 rounded text-xs font-bold transition-all cursor-pointer shadow-sm">Revoke</button>
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