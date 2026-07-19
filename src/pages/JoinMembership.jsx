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

    // Check if they already have a pending request
    get(ref(db, `membershipRequests/${user.uid}`)).then((snap) => {
      if (snap.exists()) setCurrentRequest(snap.val().requestedRole);
    });
  }, [navigate]);

  const handleRequest = async (role) => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    
    const requestData = {
      uid: user.uid,
      email: user.email,
      username: user.displayName || 'Developer',
      requestedRole: role,
      status: 'pending',
      createdAt: Date.now()
    };

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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800"><i className="bi bi-star-fill text-amber-500 mr-2"></i> Join Membership</h1>
        <button onClick={() => navigate('/user/home')} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all cursor-pointer">
          Back to Dashboard
        </button>
      </div>

      {status && <div className="mb-6 p-4 bg-green-100 text-green-700 font-bold rounded-xl text-center w-full max-w-4xl animate-fade-in">{status}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* PRO TIER */}
        <div className="bg-white border border-amber-200 rounded-3xl p-8 shadow-lg flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4"><i className="bi bi-star-fill"></i></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Pro Version</h2>
          <p className="text-slate-500 text-sm mb-6 flex-1">Perfect for active creators. Unlock up to 10 workspaces and the ability to make them all 100% private.</p>
          <ul className="space-y-3 mb-8 text-sm font-semibold text-slate-600">
            <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i> 10 Active Workspaces</li>
            <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i> Unlimited Private Projects</li>
            <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i> HTML Export Access</li>
          </ul>
          <button 
            disabled={loading || currentRequest === 'pro'} 
            onClick={() => handleRequest('pro')} 
            className={`w-full py-3 rounded-xl font-bold transition-all ${currentRequest === 'pro' ? 'bg-amber-100 text-amber-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md cursor-pointer'}`}
          >
            {currentRequest === 'pro' ? 'Request Pending...' : 'Request Pro Access'}
          </button>
        </div>

        {/* DEVELOPER TIER */}
        <div className="bg-white border border-purple-200 rounded-3xl p-8 shadow-lg flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-4"><i className="bi bi-code-square"></i></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Developer Version</h2>
          <p className="text-slate-500 text-sm mb-6 flex-1">For advanced engineers. Unlimited workspaces, template deployment capabilities, and deep API access.</p>
          <ul className="space-y-3 mb-8 text-sm font-semibold text-slate-600">
            <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i> Unlimited Workspaces</li>
            <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i> Public Template Deployment</li>
            <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i> Developer Whitelisting</li>
          </ul>
          <button 
            disabled={loading || currentRequest === 'developer'} 
            onClick={() => handleRequest('developer')} 
            className={`w-full py-3 rounded-xl font-bold transition-all ${currentRequest === 'developer' ? 'bg-purple-100 text-purple-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer'}`}
          >
            {currentRequest === 'developer' ? 'Request Pending...' : 'Request Dev Access'}
          </button>
        </div>
      </div>
    </div>
  );
}