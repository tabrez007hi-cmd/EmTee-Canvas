import React, { useState, useRef } from 'react';

export default function FreeformEditor({ layoutItems, setLayoutItems }) {
  const [selectedId, setSelectedId] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const canvasRef = useRef(null);

  // Tools for the sidebar
  const tools = [
    { type: 'text', icon: 'bi-fonts', label: 'Text' },
    { type: 'box', icon: 'bi-square', label: 'Box' },
    { type: 'circle', icon: 'bi-circle', label: 'Circle' },
    { type: 'image', icon: 'bi-image', label: 'Image' }
  ];

  // 1. Handle New Item Drop from Sidebar
  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('tool_type');
    if (!type) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let src = '';
    if (type === 'image') {
      src = prompt("Please enter the Image URL:");
      if (!src) return; // Cancel if no URL provided
    }

    const newItem = {
      id: `ff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      x, y,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 'auto' : 150,
      content: type === 'text' ? 'Double click to edit text...' : '',
      src,
      styles: {
        color: '#ffffff',
        backgroundColor: type === 'box' || type === 'circle' ? '#4f46e5' : 'transparent',
        fontSize: '16px',
        borderRadius: type === 'circle' ? '50%' : '8px'
      }
    };

    setLayoutItems([...layoutItems, newItem]);
    setSelectedId(newItem.id);
  };

  const handleDragOver = (e) => e.preventDefault();

  // 2. Handle Moving Existing Items
  const handleItemMouseDown = (e, item) => {
    e.stopPropagation();
    setSelectedId(item.id);
    
    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggingItem({ id: item.id, offsetX, offsetY });
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingItem) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - draggingItem.offsetX;
    const newY = e.clientY - rect.top - draggingItem.offsetY;

    setLayoutItems(prev => prev.map(i => i.id === draggingItem.id ? { ...i, x: newX, y: newY } : i));
  };

  const handleCanvasMouseUp = () => setDraggingItem(null);

  // 3. Inline Toolbar Actions
  const updateItemStyle = (id, prop, value) => {
    setLayoutItems(prev => prev.map(i => i.id === id ? { ...i, styles: { ...i.styles, [prop]: value } } : i));
  };

  const handleDuplicate = (id) => {
    const item = layoutItems.find(i => i.id === id);
    if (!item) return;
    const clone = { ...item, id: `ff_${Date.now()}`, x: item.x + 20, y: item.y + 20 };
    setLayoutItems([...layoutItems, clone]);
    setSelectedId(clone.id);
  };

  const handleDelete = (id) => {
    setLayoutItems(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleTextChange = (e, id) => {
    setLayoutItems(prev => prev.map(i => i.id === id ? { ...i, content: e.target.value } : i));
  };

  const selectedItem = layoutItems.find(i => i.id === selectedId);

  return (
    <div className="flex h-full w-full bg-slate-950 font-sans">
      {/* Mini Sidebar */}
      <div className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20 shrink-0 shadow-[10px_0_30px_rgba(0,0,0,0.3)]">
        {tools.map(tool => (
          <div 
            key={tool.type}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('tool_type', tool.type)}
            className="flex flex-col items-center justify-center w-12 h-12 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-indigo-600 transition-colors cursor-grab shadow-sm"
            title={`Drag & Drop ${tool.label}`}
          >
            <i className={`bi ${tool.icon} text-xl`}></i>
          </div>
        ))}
      </div>

      {/* Freeform Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-slate-950"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onClick={() => setSelectedId(null)}
        style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }} // Blueprint grid
      >
        {layoutItems.map(item => (
          <div
            key={item.id}
            onMouseDown={(e) => handleItemMouseDown(e, item)}
            style={{
              position: 'absolute',
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: item.width !== 'auto' ? `${item.width}px` : undefined,
              height: item.height !== 'auto' ? `${item.height}px` : undefined,
              backgroundColor: item.styles.backgroundColor,
              borderRadius: item.styles.borderRadius,
              cursor: draggingItem?.id === item.id ? 'grabbing' : 'grab',
              zIndex: selectedId === item.id ? 10 : 1,
              outline: selectedId === item.id ? '2px dashed #6366f1' : 'none',
              outlineOffset: '4px'
            }}
            className="transition-shadow"
          >
            {item.type === 'text' && (
              <textarea 
                value={item.content}
                onChange={(e) => handleTextChange(e, item.id)}
                style={{ color: item.styles.color, fontSize: item.styles.fontSize }}
                className="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden whitespace-pre-wrap"
              />
            )}
            {item.type === 'image' && (
              <img src={item.src} alt="Canvas element" className="w-full h-full object-cover rounded-inherit pointer-events-none" />
            )}
          </div>
        ))}

        {/* Inline Floating Toolbar */}
        {selectedItem && (
          <div 
            className="absolute z-50 flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-fade-in"
            style={{ left: selectedItem.x, top: selectedItem.y - 60 }} // Floats right above the element
            onClick={(e) => e.stopPropagation()}
          >
            <input 
              type="color" value={selectedItem.styles.color || '#ffffff'} 
              onChange={(e) => updateItemStyle(selectedItem.id, 'color', e.target.value)} 
              className="w-6 h-6 rounded cursor-pointer border border-slate-700 p-0" title="Text Color" 
            />
            <input 
              type="color" value={selectedItem.styles.backgroundColor || '#transparent'} 
              onChange={(e) => updateItemStyle(selectedItem.id, 'backgroundColor', e.target.value)} 
              className="w-6 h-6 rounded cursor-pointer border border-slate-700 p-0" title="Background Color" 
            />
            {selectedItem.type === 'text' && (
              <input 
                type="number" value={parseInt(selectedItem.styles.fontSize) || 16} 
                onChange={(e) => updateItemStyle(selectedItem.id, 'fontSize', `${e.target.value}px`)} 
                className="w-16 bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs outline-none" title="Font Size" 
              />
            )}
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button onClick={() => handleDuplicate(selectedItem.id)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-400 bg-slate-800 rounded-md transition-colors"><i className="bi bi-files text-xs"></i></button>
            <button onClick={() => handleDelete(selectedItem.id)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-400 bg-slate-800 rounded-md transition-colors"><i className="bi bi-trash text-xs"></i></button>
          </div>
        )}
      </div>
    </div>
  );
}