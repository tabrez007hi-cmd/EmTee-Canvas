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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
          <i className="bi bi-x-lg text-lg"></i>
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Account Overview</h2>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {userProfile.photoURL && !imgError ? (
              <img 
                src={userProfile.photoURL} 
                alt="Profile" 
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-sm" 
              />
            ) : (
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 border-4 border-indigo-100 shadow-sm">
                <i className="bi bi-person-fill text-6xl mt-2"></i>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Account Number</label>
            <div className="font-mono text-sm text-indigo-600 font-semibold bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100/50">
              {userProfile.accountNumber || 'emtee_pending'}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Developer Username</label>
            <div className="text-sm font-medium text-gray-800 px-1">
              {displayUsername}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Registered Email</label>
            <div className="text-sm font-medium text-gray-800 px-1 truncate" title={userProfile.email}>
              {userProfile.email || 'No email provided'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}