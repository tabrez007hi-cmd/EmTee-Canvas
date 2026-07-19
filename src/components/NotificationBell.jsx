import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notifRef = ref(db, `users/${user.uid}/notifications`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        // Sort newest first
        const notifs = Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user || unreadCount === 0) return;

    const updates = {};
    notifications.forEach(n => {
      if (!n.read) updates[`${n.id}/read`] = true;
    });

    try {
      await update(ref(db, `users/${user.uid}/notifications`), updates);
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) handleMarkAllAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle} 
        className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer relative shadow-sm"
      >
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
            <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px] animate-fade-in">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
            <span className="font-bold text-slate-800 flex items-center gap-2"><i className="bi bi-bell text-indigo-600"></i> Notifications</span>
            {unreadCount > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <i className="bi bi-inbox text-3xl mb-2 block opacity-50"></i>
                <p className="text-sm font-semibold">You're all caught up!</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`p-3 rounded-xl border transition-colors ${!notif.read ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}