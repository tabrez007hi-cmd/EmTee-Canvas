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
      className="fixed top-0 right-0 z-30 flex h-16 bg-white border-b border-gray-200 shadow-sm items-center justify-between px-6 transition-all duration-300"
      style={{ left: isCollapsed ? '4rem' : '16rem' }}
    >
      <div className="min-w-0 max-w-[40%]">
        {/* ✨ UPDATED: Dynamically presents current workspace project name */}
        <span className="font-bold text-gray-800 text-sm sm:text-base truncate block" title={activeWorkspaceName}>
          <i className="bi bi-folder-fill text-indigo-500 mr-2 text-xs sm:text-sm"></i>
          {activeWorkspaceName || 'Untitled Project'}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <NotificationBell />
        <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
        <button 
          onClick={onGoHome} 
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          title="Return to Dashboard"
        >
          <i className="bi bi-house-door-fill"></i>
          <span className="hidden sm:inline">Home</span>
        </button>
        <button 
          onClick={onOpenExport} 
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          title="Export Compiled HTML"
        >
          <i className="bi bi-file-earmark-code-fill"></i>
          <span className="hidden sm:inline">Export</span>
        </button>
        
        {/* ✨ NEW: Explicit Cloud Save Action Button */}
        <button 
          onClick={onSaveWorkspace} 
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          title="Save Workspace to Cloud"
        >
          <i className="bi bi-cloud-arrow-up-fill"></i>
          <span className="hidden sm:inline">Save</span>
        </button>

        <div className="w-px h-6 bg-gray-200"></div>

        {/* Settings Button */}
        <button onClick={onOpenSettings} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer" title="Workspace Settings">
          <i className="bi bi-gear-fill text-lg"></i>
        </button>

        {/* User Profile Button */}
        <button onClick={onOpenAccount} className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200">
          <span className="text-sm font-semibold text-gray-600 hidden lg:block">
            {userProfile?.username || 'Developer'}
          </span>
          
          {userProfile?.photoURL && !imgError ? (
            <img 
              src={userProfile.photoURL} 
              alt="User" 
              onError={() => setImgError(true)} 
              className="h-8 w-8 rounded-full object-cover border border-gray-200" 
            />
          ) : (
            <div className="h-8 w-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-200">
               <i className="bi bi-person-fill text-lg mt-1"></i>
            </div>
          )}
        </button>
        
        <button onClick={handleLogout} className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 text-xs font-bold rounded-md transition-colors cursor-pointer">
          Logout
        </button>
      </div>
    </nav>
  );
}