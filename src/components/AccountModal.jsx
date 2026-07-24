import React, { useState, useEffect } from 'react';

export default function AccountModal({ isOpen, onClose, userProfile }) {
  const [imgError, setImgError] = useState(false); 

  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  if (!isOpen || !userProfile) return null;

  const displayUsername = userProfile?.username || 'User';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>

        <button onClick={onClose} className="cursor-pointer absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center border border-slate-700 z-100">
          <i className="bi bi-x-lg text-sm"></i>
        </button>

        <h2 className="text-xl font-bold text-white mb-6 text-center border-b border-slate-800 pb-4 relative z-10">Account Overview</h2>

        <div className="flex flex-col items-center mb-6 relative z-10">
          <div className="relative">
            {userProfile.photoURL && !imgError ? (
              <img 
                src={userProfile.photoURL} 
                alt="Profile" 
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
              />
            ) : (
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 border-4 border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                <i className="bi bi-person-fill text-6xl mt-2"></i>
              </div>
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
            <div className="text-sm font-bold text-slate-200 px-1">
              {displayUsername}
            </div>
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