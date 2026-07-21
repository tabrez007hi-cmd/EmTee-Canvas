import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, set, get } from 'firebase/database';

export default function JoinMembership() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/authentication'); return; }

    get(ref(db, `membershipRequests/${user.uid}`)).then((snap) => {
      if (snap.exists()) setCurrentRequest(snap.val().requestedRole);
    });
  }, [navigate]);

  const handleRequest = async (role) => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    
    const requestData = { uid: user.uid, email: user.email, username: user.displayName || 'Developer', requestedRole: role, status: 'pending', createdAt: Date.now() };

    try {
      await set(ref(db, `membershipRequests/${user.uid}`), requestData);
      setStatus(`Success! Your request for ${role.toUpperCase()} has been sent to the Admins. 🚀`);
      setCurrentRequest(role);
    } catch (err) {
      setStatus('Failed to send request. ❌');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col items-center py-12 px-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-4xl flex items-center justify-between mb-8 relative z-10">
        <h1 className="text-3xl font-extrabold text-white"><i className="bi bi-star-fill text-amber-400 mr-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"></i> Join Membership</h1>
        <button onClick={() => navigate('/user/home')} className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-800 transition-all cursor-pointer">
          Back to Dashboard
        </button>
      </div>

      {status && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-bold rounded-xl text-center w-full max-w-4xl animate-fade-in relative z-10">{status}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        {/* PRO TIER */}
        <div className="bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-[0_0_15px_rgba(251,191,36,0.3)]"><i className="bi bi-star-fill"></i></div>
          <h2 className="text-2xl font-bold text-white mb-2">Pro Version</h2>
          <p className="text-slate-400 text-sm mb-6 flex-1">Perfect for active creators. Unlock up to 10 workspaces and the ability to make them all 100% private.</p>
          <ul className="space-y-3 mb-8 text-sm font-semibold text-slate-300">
            <li><i className="bi bi-check-circle-fill text-emerald-400 mr-2"></i> 10 Active Workspaces</li>
            <li><i className="bi bi-check-circle-fill text-emerald-400 mr-2"></i> Unlimited Private Projects</li>
            <li><i className="bi bi-check-circle-fill text-emerald-400 mr-2"></i> HTML Export Access</li>
          </ul>
          <button 
            disabled={loading || currentRequest === 'pro'} 
            onClick={() => handleRequest('pro')} 
            className={`w-full py-3.5 rounded-xl font-bold transition-all ${currentRequest === 'pro' ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.4)] cursor-pointer'}`}
          >
            {currentRequest === 'pro' ? 'Request Pending...' : 'Request Pro Access'}
          </button>
        </div>

        {/* DEVELOPER TIER */}
        <div className="bg-slate-900 border border-purple-500/30 hover:border-purple-500/60 rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-[0_0_15px_rgba(168,85,247,0.3)]"><i className="bi bi-code-square"></i></div>
          <h2 className="text-2xl font-bold text-white mb-2">Developer Version</h2>
          <p className="text-slate-400 text-sm mb-6 flex-1">For advanced engineers. Unlimited workspaces, template deployment capabilities, and deep API access.</p>
          <ul className="space-y-3 mb-8 text-sm font-semibold text-slate-300">
            <li><i className="bi bi-check-circle-fill text-emerald-400 mr-2"></i> Unlimited Workspaces</li>
            <li><i className="bi bi-check-circle-fill text-emerald-400 mr-2"></i> Public Template Deployment</li>
            <li><i className="bi bi-check-circle-fill text-emerald-400 mr-2"></i> Developer Whitelisting</li>
          </ul>
          <button 
            disabled={loading || currentRequest === 'developer'} 
            onClick={() => handleRequest('developer')} 
            className={`w-full py-3.5 rounded-xl font-bold transition-all ${currentRequest === 'developer' ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] cursor-pointer'}`}
          >
            {currentRequest === 'developer' ? 'Request Pending...' : 'Request Dev Access'}
          </button>
        </div>
      </div>
    </div>
  );
}