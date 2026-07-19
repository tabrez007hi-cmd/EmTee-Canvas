import React, { useEffect } from 'react';

// ✨ FIX: Pass down autoSave and onToggleAutoSave directly from props
export default function SettingsModal({ isOpen, onClose, autoSave, onToggleAutoSave }) {
  
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
          <i className="bi bi-x-lg text-lg"></i>
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
          <i className="bi bi-gear-fill text-indigo-600 mr-2"></i> Settings
        </h2>

        <div className="space-y-4">
          {/* Setting 1: Cloud Auto-Save */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <div className="text-sm font-bold text-gray-800">Cloud Auto-Save</div>
              <div className="text-[10px] text-gray-500">Sync layout to Firebase automatically</div>
            </div>
            {/* ✨ UPDATED: Uses parent state and localStorage sync triggers */}
            <button 
              onClick={onToggleAutoSave}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${autoSave ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${autoSave ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {/* Setting 2: Placeholder Static UI Toggle for Snapping Lines */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
            <div>
              <div className="text-sm font-bold text-gray-800">Canvas Grid Overlay</div>
              <div className="text-[10px] text-gray-500">Show blueprint snapping lines</div>
            </div>
            <button className="w-10 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-not-allowed">
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </button>
          </div>

          {/* Setting 3: Placeholder Static UI Toggle for Speed Performance */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
            <div>
              <div className="text-sm font-bold text-gray-800">Performance Mode</div>
              <div className="text-[10px] text-gray-500">Reduce animations for speed</div>
            </div>
            <button className="w-10 h-6 flex items-center bg-indigo-600 rounded-full p-1 p-1 cursor-not-allowed">
              <div className="bg-white w-4 h-4 rounded-full shadow-md translate-x-4"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}