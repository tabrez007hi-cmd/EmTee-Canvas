import React from 'react';

// Recursive Node Component
const TreeNode = ({ item, allItems, onSelect, onRemove, onDuplicate, selectedId }) => {
  const children = allItems.filter(i => i.parentId === item.id);
  const isSelected = selectedId === item.id;
  const displayLabel = item.customId ? `${item.type}#${item.customId}` : item.type;

  return (
    <li>
      <div className="relative inline-block group">
        
        {/* Modern, Compact Styled Box */}
        <div
          onClick={() => onSelect(item.id)}
          className={`relative z-10 px-3 py-1.5 min-w-[90px] cursor-pointer transition-all duration-200
            rounded-md font-mono text-[11px] font-medium flex items-center justify-center
            ${isSelected 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-100 ring-offset-1' 
              : 'bg-white text-indigo-700 border border-indigo-200 shadow-sm hover:border-indigo-400 hover:shadow hover:-translate-y-0.5'
            }
          `}
        >
          &lt;{displayLabel}&gt;
        </div>

        {/* Action Buttons (Compact, show on hover) */}
        <div className="absolute -top-2.5 -right-2.5 z-20 hidden group-hover:flex gap-0.5">
           <button onClick={(e) => {e.stopPropagation(); onDuplicate(item.id);}} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-full shadow-sm hover:text-blue-600 hover:border-blue-200 transition-colors" title="Duplicate Node">
             <i className="bi bi-files text-[12px]"></i>
           </button>
           <button onClick={(e) => {e.stopPropagation(); onRemove(item.id);}} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-full shadow-sm hover:text-red-600 hover:border-red-200 transition-colors" title="Delete Node">
             <i className="bi bi-trash text-[12px]"></i>
           </button>
        </div>

      </div>

      {/* Render Children Recursively */}
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
  // Find all elements that sit at the root level of the canvas
  const rootItems = layoutItems.filter(item => !item.parentId || !layoutItems.some(parent => parent.id === item.parentId));

  return (
    /* ✨ FIX: absolute inset-0 locks this container perfectly inside the workspace, preventing it from stretching the main width. */
    <div className="absolute inset-0 overflow-auto bg-gray-50/50 custom-scrollbar">
      
      <style>{`
        .dom-tree ul {
          padding-top: 20px;
          position: relative;
          display: flex;
          justify-content: center;
          padding-left: 0;
        }
        .dom-tree li {
          float: left;
          text-align: center;
          list-style-type: none;
          position: relative;
          padding: 20px 6px 0 6px;
        }
        .dom-tree li::before, .dom-tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 1.5px solid #cbd5e1; 
          width: 50%;
          height: 20px;
        }
        .dom-tree li::after {
          right: auto;
          left: 50%;
          border-left: 1.5px solid #cbd5e1;
        }
        .dom-tree li:only-child::after, .dom-tree li:only-child::before {
          display: none;
        }
        .dom-tree li:only-child {
          padding-top: 0;
        }
        .dom-tree li:first-child::before, .dom-tree li:last-child::after {
          border: 0 none;
        }
        .dom-tree li:last-child::before {
          border-right: 1.5px solid #cbd5e1;
          border-radius: 0 4px 0 0;
        }
        .dom-tree li:first-child::after {
          border-radius: 4px 0 0 0;
        }
        .dom-tree ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 1.5px solid #cbd5e1;
          width: 0;
          height: 20px;
          transform: translateX(-50%);
        }
        .dom-tree > ul::before {
          display: none;
        }
      `}</style>
      
      {/* ✨ FIX: min-w-full and w-max ensures it centers when small, but smoothly scrolls sideways without cutting off the left edge when large. */}
      <div className="min-w-full w-max flex justify-center p-8">
        <div className="dom-tree pb-12 pt-4">
          {layoutItems.length === 0 ? (
            <div className="text-gray-400 font-mono italic mt-16 text-center flex flex-col items-center">
              <i className="bi bi-diagram-3 text-3xl mb-3 opacity-50"></i>
              The DOM Tree is completely empty.
            </div>
          ) : (
            <ul>
              <li>
                <div className="relative inline-block">
                  <div className="bg-slate-800 text-white rounded-lg px-5 py-2 font-bold text-[10px] tracking-widest z-10 relative cursor-default uppercase shadow-sm border border-slate-700">
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