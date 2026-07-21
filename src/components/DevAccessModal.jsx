import React, { useState } from 'react';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';

export default function DevAccessModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  if (!isOpen) return null;

  const handleGrantAccess = async () => {
    if (!email.trim()) return;
    try {
      const sanitizedEmail = email.toLowerCase().trim().replace(/[.#$[\]]/g, '_');
      await set(ref(db, `developerWhitelists/${sanitizedEmail}`), true);
      setStatus('Success! User granted Developer Access. ✅');
      setEmail('');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Error granting access. ❌');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors z-10"><i className="bi bi-x-lg text-sm"></i></button>
        
        <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3 relative z-10">
          <i className="bi bi-shield-lock-fill text-indigo-500 mr-2 drop-shadow-[0_0_8px_rgba(79,70,229,0.8)]"></i> Grant Dev Access
        </h2>
        <p className="text-xs text-slate-400 mb-5 relative z-10 leading-relaxed">Enter a user's email to permanently upgrade their account to Developer status.</p>
        
        <div className="relative z-10">
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="user@gmail.com" 
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {status && <div className="text-xs font-bold text-emerald-400 mb-3 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg">{status}</div>}
          
          <button onClick={handleGrantAccess} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all cursor-pointer">
            Authorize User
          </button>
        </div>
      </div>
    </div>
  );
}