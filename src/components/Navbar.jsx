import React, { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import NotificationBell from './NotificationBell';

export default function Navbar({ isCollapsed, userProfile, activeWorkspaceName, onSaveWorkspace, onOpenExport, onGoHome, onOpenAccount, onOpenSettings }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false); 

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav 
      className="fixed top-0 right-0 z-30 flex h-16 bg-slate-900 border-b border-slate-800 shadow-md items-center justify-between px-6 transition-all duration-300 text-slate-200"
      style={{ left: isCollapsed ? '4rem' : '16rem' }}
    >
      <div className="min-w-0 max-w-[40%]">
        <span className="font-bold text-white text-sm sm:text-base truncate block" title={activeWorkspaceName}>
          <i className="bi bi-folder-fill text-indigo-500 mr-2 text-xs sm:text-sm drop-shadow-[0_0_5px_rgba(79,70,229,0.8)]"></i>
          {activeWorkspaceName || 'Untitled Project'}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <NotificationBell />
        <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
        <button 
          onClick={onGoHome} 
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          title="Return to Dashboard"
        >
          <i className="bi bi-house-door-fill"></i>
          <span className="hidden sm:inline">Home</span>
        </button>
        <button 
          onClick={onOpenExport} 
          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-600 border border-blue-500/50 text-blue-400 hover:text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          title="Export Compiled HTML"
        >
          <i className="bi bi-file-earmark-code-fill"></i>
          <span className="hidden sm:inline">Export</span>
        </button>
        
        <button 
          onClick={onSaveWorkspace} 
          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-400 hover:text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          title="Save Workspace to Cloud"
        >
          <i className="bi bi-cloud-arrow-up-fill"></i>
          <span className="hidden sm:inline">Save</span>
        </button>

        <div className="w-px h-6 bg-slate-800"></div>

        {/* Settings Button */}
        <button onClick={onOpenSettings} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors cursor-pointer" title="Workspace Settings">
          <i className="bi bi-gear-fill text-lg"></i>
        </button>

        {/* User Profile Button */}
        <button onClick={onOpenAccount} className="flex items-center gap-2 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700">
          <span className="text-sm font-semibold text-slate-300 hidden lg:block">
            {userProfile?.username || 'Developer'}
          </span>
          
          {userProfile?.photoURL && !imgError ? (
            <img 
              src={userProfile.photoURL} 
              alt="User" 
              onError={() => setImgError(true)} 
              className="h-8 w-8 rounded-full object-cover border border-slate-700" 
            />
          ) : (
            <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 border border-slate-700">
               <i className="bi bi-person-fill text-lg mt-1"></i>
            </div>
          )}
        </button>
        
        <button onClick={handleLogout} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-xs font-bold rounded-lg transition-colors cursor-pointer">
          Logout
        </button>
      </div>
    </nav>
  );
}