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
      // Firebase keys cannot contain certain characters, so we sanitize the email
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 p-1.5 rounded-full"><i className="bi bi-x-lg"></i></button>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2"><i className="bi bi-shield-lock-fill text-indigo-600"></i> Grant Dev Access</h2>
        <p className="text-xs text-slate-500 mb-4">Enter a user's email to permanently upgrade their account to Developer status.</p>
        
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="user@gmail.com" 
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:border-indigo-500"
        />
        {status && <div className="text-xs font-bold text-green-600 mb-3">{status}</div>}
        
        <button onClick={handleGrantAccess} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm shadow-md transition-all">
          Authorize User
        </button>
      </div>
    </div>
  );
}