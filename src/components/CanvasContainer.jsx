import React, { useState, useEffect } from 'react';
import DomTreeView from './DomTreeView';

export default function CanvasContainer({ 
  code, iframeRef, layoutItems, 
  selectedElementId, onSelectElementId, 
  onRemoveItem, onDuplicateItem,
  allowCodeView = true, 
  allowDomView = true,
  onApplyCodeChanges // Action handler for saving code edits
}) {
  const [viewMode, setViewMode] = useState('preview');
  const [viewport, setViewport] = useState('desktop'); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Editable Code State
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editableCode, setEditableCode] = useState('');

  // Sync the editable text box with the compiled code unless actively editing
  useEffect(() => {
    if (!isEditingCode) {
      setEditableCode(code);
    }
  }, [code, isEditingCode]);

  const handleApplyCode = () => {
    if (onApplyCodeChanges) {
      onApplyCodeChanges(editableCode);
    }
    setIsEditingCode(false);
  };

  return (
    <div className={`bg-white border-gray-200 shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[45] rounded-none border-0' : 'border rounded-xl h-[calc(100vh-8.5rem)]'}`}>
      
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <span className="text-sm font-semibold text-gray-700 tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
          {isFullscreen ? 'Zen Fullscreen Mode' : 'Workspace Sandbox Arena'}
        </span>

        <div className="flex items-center gap-3">
          {viewMode === 'preview' && (
            <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              <button onClick={() => setViewport('desktop')} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${viewport === 'desktop' ? 'bg-white text-gray-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`} title="Desktop View">
                <i className="bi bi-pc-display text-sm"></i>
              </button>
              <button onClick={() => setViewport('mobile')} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${viewport === 'mobile' ? 'bg-white text-gray-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`} title="Mobile Phone View">
                <i className="bi bi-phone text-sm"></i>
              </button>
            </div>
          )}

          <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
            <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${viewMode === 'preview' ? 'bg-white text-gray-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
              <i className="bi bi-eye text-sm"></i> <span className="hidden sm:inline">Preview</span>
            </button>
            
            {allowCodeView && (
              <button onClick={() => setViewMode('code')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${viewMode === 'code' ? 'bg-white text-gray-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                <i className="bi bi-code-slash text-sm"></i> <span className="hidden sm:inline">Code View</span>
              </button>
            )}
            {allowDomView && (
              <button onClick={() => setViewMode('tree')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${viewMode === 'tree' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}>
                <i className="bi bi-diagram-3-fill text-sm"></i> <span className="hidden sm:inline">DOM Tree</span>
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-gray-200"></div>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer">
            <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'} text-[13px]`}></i>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 overflow-auto relative flex justify-center items-start custom-scrollbar">
        {viewMode === 'preview' && (
          <div className={`transition-all duration-300 w-full flex justify-center items-start ${viewport === 'mobile' ? 'py-4 md:py-8' : 'h-full'}`}>
            <div 
              style={viewport === 'mobile' ? { transform: 'scale(min(1, calc((100vh - 11rem) / 840)))', transformOrigin: 'top center' } : {}}
              className={`${viewport === 'mobile' ? 'w-[375px] h-[812px] box-content shadow-2xl border-[14px] border-slate-800 rounded-[3rem] overflow-hidden shrink-0 relative bg-white' : 'w-full h-full'}`}
            >
              {viewport === 'mobile' && (
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-50 pointer-events-none flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                  <div className="w-10 h-1.5 bg-slate-700 rounded-full"></div>
                </div>
              )}
              <iframe ref={iframeRef} srcDoc={code} title="Website Sandbox Viewport Render" className="w-full h-full bg-white border-none" sandbox="allow-scripts allow-same-origin" />
            </div>
          </div>
        )}
        
        {viewMode === 'code' && allowCodeView && (
          <div className="w-full h-full p-4 flex flex-col gap-3 bg-slate-50">
             <div className="flex justify-end gap-2 shrink-0">
               {!isEditingCode ? (
                 <button onClick={() => setIsEditingCode(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                   <i className="bi bi-pencil-fill"></i> Modify Code
                 </button>
               ) : (
                 <>
                   <button onClick={() => { setIsEditingCode(false); setEditableCode(code); }} className="px-4 py-2 bg-slate-500 text-white rounded-lg text-xs font-bold hover:bg-slate-600 shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                     <i className="bi bi-x-circle-fill"></i> Cancel
                   </button>
                   <button onClick={handleApplyCode} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                     <i className="bi bi-check-circle-fill"></i> Apply Changes
                   </button>
                 </>
               )}
             </div>
             
             <textarea 
               value={editableCode} 
               onChange={(e) => setEditableCode(e.target.value)}
               readOnly={!isEditingCode} 
               className={`flex-1 w-full bg-slate-900 border ${isEditingCode ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800'} rounded-xl p-6 font-mono text-xs ${isEditingCode ? 'text-indigo-300' : 'text-emerald-400'} focus:outline-none resize-none shadow-inner leading-relaxed overflow-auto custom-scrollbar transition-all`} 
               spellCheck="false" 
             />
          </div>
        )}

        {viewMode === 'tree' && allowDomView && (
          <DomTreeView layoutItems={layoutItems} selectedElementId={selectedElementId} onSelectElementId={onSelectElementId} onRemoveItem={onRemoveItem} onDuplicateItem={onDuplicateItem} />
        )}
      </div>
    </div>
  );
}