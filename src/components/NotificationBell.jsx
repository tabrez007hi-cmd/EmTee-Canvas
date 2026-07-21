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
        const notifs = Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

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
    } catch (err) {}
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) handleMarkAllAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle} 
        className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer relative shadow-sm border border-slate-700"
      >
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
            <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden flex flex-col max-h-[400px] animate-fade-in text-slate-200">
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
            <span className="font-bold text-white flex items-center gap-2"><i className="bi bi-bell text-indigo-500 drop-shadow-[0_0_5px_rgba(79,70,229,0.8)]"></i> Notifications</span>
            {unreadCount > 0 && <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <i className="bi bi-inbox text-3xl mb-2 block opacity-30"></i>
                <p className="text-sm font-semibold text-slate-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`p-3 rounded-xl border transition-colors ${!notif.read ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/50 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{notif.title}</span>
                    <span className="text-[10px] text-slate-500">{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}