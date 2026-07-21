import React from 'react';

// Recursive Node Component
const TreeNode = ({ item, allItems, onSelect, onRemove, onDuplicate, selectedId }) => {
  const children = allItems.filter(i => i.parentId === item.id);
  const isSelected = selectedId === item.id;
  const displayLabel = item.customId ? `${item.type}#${item.customId}` : item.type;

  return (
    <li>
      <div className="relative inline-block group">
        <div
          onClick={() => onSelect(item.id)}
          className={`relative z-10 px-3 py-1.5 min-w-[90px] cursor-pointer transition-all duration-200
            rounded-lg font-mono text-[11px] font-bold flex items-center justify-center
            ${isSelected 
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)] ring-2 ring-indigo-500/30 ring-offset-slate-950 ring-offset-2' 
              : 'bg-slate-900 text-indigo-400 border border-slate-700 shadow-sm hover:border-indigo-500/50 hover:text-indigo-300 hover:shadow-[0_0_10px_rgba(79,70,229,0.2)] hover:-translate-y-0.5'
            }
          `}
        >
          &lt;{displayLabel}&gt;
        </div>

        <div className="absolute -top-3 -right-3 z-20 hidden group-hover:flex gap-1 bg-slate-800 p-1 rounded-full border border-slate-700 shadow-lg">
           <button onClick={(e) => {e.stopPropagation(); onDuplicate(item.id);}} className="w-6 h-6 flex items-center justify-center bg-slate-900 border border-slate-700 text-slate-400 rounded-full hover:text-blue-400 hover:border-blue-500/50 transition-colors cursor-pointer" title="Duplicate Node">
             <i className="bi bi-files text-[10px]"></i>
           </button>
           <button onClick={(e) => {e.stopPropagation(); onRemove(item.id);}} className="w-6 h-6 flex items-center justify-center bg-slate-900 border border-slate-700 text-slate-400 rounded-full hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer" title="Delete Node">
             <i className="bi bi-trash text-[10px]"></i>
           </button>
        </div>
      </div>

      {children.length > 0 && (
        <ul>
          {children.map(child => (
            <TreeNode
              key={child.id} item={child} allItems={allItems}
              onSelect={onSelect} onRemove={onRemove}
              onDuplicate={onDuplicate} selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function DomTreeView({ layoutItems, selectedElementId, onSelectElementId, onRemoveItem, onDuplicateItem }) {
  const rootItems = layoutItems.filter(item => !item.parentId || !layoutItems.some(parent => parent.id === item.parentId));

  return (
    <div className="absolute inset-0 overflow-auto bg-slate-950/50 custom-scrollbar text-slate-200">
      <style>{`
        .dom-tree ul { padding-top: 20px; position: relative; display: flex; justify-content: center; padding-left: 0; }
        .dom-tree li { float: left; text-align: center; list-style-type: none; position: relative; padding: 20px 6px 0 6px; }
        .dom-tree li::before, .dom-tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 1.5px solid #334155; width: 50%; height: 20px; }
        .dom-tree li::after { right: auto; left: 50%; border-left: 1.5px solid #334155; }
        .dom-tree li:only-child::after, .dom-tree li:only-child::before { display: none; }
        .dom-tree li:only-child { padding-top: 0; }
        .dom-tree li:first-child::before, .dom-tree li:last-child::after { border: 0 none; }
        .dom-tree li:last-child::before { border-right: 1.5px solid #334155; border-radius: 0 4px 0 0; }
        .dom-tree li:first-child::after { border-radius: 4px 0 0 0; }
        .dom-tree ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 1.5px solid #334155; width: 0; height: 20px; transform: translateX(-50%); }
        .dom-tree > ul::before { display: none; }
      `}</style>
      
      <div className="min-w-full w-max flex justify-center p-8">
        <div className="dom-tree pb-12 pt-4">
          {layoutItems.length === 0 ? (
            <div className="text-slate-500 font-mono italic mt-16 text-center flex flex-col items-center">
              <i className="bi bi-diagram-3 text-4xl mb-4 opacity-30"></i>
              The DOM Tree is completely empty.
            </div>
          ) : (
            <ul>
              <li>
                <div className="relative inline-block">
                  <div className="bg-slate-900 text-white rounded-lg px-6 py-2.5 font-bold text-[10px] tracking-widest z-10 relative cursor-default uppercase shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700 shadow-inner">
                    ROOT DOCUMENT
                  </div>
                </div>
                <ul>
                  {rootItems.map(item => (
                    <TreeNode 
                      key={item.id} item={item} allItems={layoutItems} 
                      onSelect={onSelectElementId} onRemove={onRemoveItem} 
                      onDuplicate={onDuplicateItem} selectedId={selectedElementId} 
                    />
                  ))}
                </ul>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}