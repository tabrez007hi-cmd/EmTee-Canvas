import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import RoleBadge from './RoleBadge'; // ✨ FIX 3: Implemented RoleBadge everywhere!

export default function AccountModal({ isOpen, onClose, userProfile }) {
  const [imgError, setImgError] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handlePopState = () => { if (isOpen) onClose(); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (userProfile?.username) setNewUsername(userProfile.username);
  }, [userProfile]);

  if (!isOpen || !userProfile) return null;

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || !auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newUsername.trim() });
      await update(ref(db, `users/${auth.currentUser.uid}/profile`), { username: newUsername.trim() });
      setIsEditing(false);
    } catch (e) {
      alert("Failed to update username.");
    }
    setIsSaving(false);
  };

  const displayUsername = userProfile?.username || 'User';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>

        <button onClick={onClose} className="cursor-pointer absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center border border-slate-700 z-[100]">
          <i className="bi bi-x-lg text-sm"></i>
        </button>

        <h2 className="text-xl font-bold text-white mb-6 text-center border-b border-slate-800 pb-4 relative z-10">Account Overview</h2>

        <div className="flex flex-col items-center mb-6 relative z-10">
          <div className="relative">
            {userProfile.photoURL && !imgError ? (
              <img src={userProfile.photoURL} alt="Profile" onError={() => setImgError(true)} className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.3)]" />
            ) : (
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 border-4 border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.3)]"><i className="bi bi-person-fill text-6xl mt-2"></i></div>
            )}
          </div>
        </div>

        <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 relative z-10">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Account Number</label>
            <div className="font-mono text-sm text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/30">
              {userProfile.accountNumber || 'emtee_pending'}
            </div>
          </div>
          
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Developer Username</label>
            {isEditing ? (
              <div className="flex gap-2">
                <input 
                  type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                  autoFocus
                />
                <button onClick={handleSaveUsername} disabled={isSaving} className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                  {isSaving ? <i className="bi bi-hourglass-split"></i> : 'Save'}
                </button>
                <button onClick={() => setIsEditing(false)} className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1">
                {/* ✨ FIX 3: Replaced standard text with RoleBadge for consistent Admin styling */}
                <RoleBadge role={userProfile.role} username={userProfile.username} />
                <button onClick={() => setIsEditing(true)} className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer" title="Edit Username">
                  <i className="bi bi-pencil-square"></i>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Registered Email</label>
            <div className="text-sm font-medium text-slate-400 px-1 truncate" title={userProfile.email}>
              {userProfile.email || 'No email provided'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}