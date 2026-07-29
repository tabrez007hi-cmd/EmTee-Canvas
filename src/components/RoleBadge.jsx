import React from 'react';

export default function RoleBadge({ role, username = '', prefix = '' }) {
  const roleKey = role?.toLowerCase() || 'normal';
  const displayName = prefix + username;

  // 👑 ADMIN: Golden Sparkling Name + Custom Crown SVG
  if (roleKey === 'admin') {
    return (
      <div className="flex items-center gap-1.5" title="System Admin">
        <span 
          className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 tracking-wide truncate" 
          style={{ filter: 'drop-shadow(0px 1px 2px rgba(250,204,21,0.4))' }}
        >
          {displayName}
        </span>
        <img 
          src="https://emteecanvas.vercel.app/crown.svg" 
          alt="Admin Crown"
          className="w-4 h-4 shrink-0 animate-pulse" 
          style={{ filter: 'drop-shadow(0px 0px 4px rgba(250,204,21,0.8))' }} 
        />
      </div>
    );
  }

  // 💎 OTHER ROLES: Render standard Name + Custom SVG URLs
  const badges = {
    advance: (
      <img 
        src="https://emteecanvas.vercel.app/thumb.svg" 
        alt="Advance User"
        title="Advance User"
        className="w-4 h-4 shrink-0 transition-transform hover:scale-110"
        style={{ filter: 'drop-shadow(0px 0px 6px rgba(168,85,247,0.8))' }} 
      />
    ),
    pro: (
      <img 
        src="https://emteecanvas.vercel.app/tick.svg" 
        alt="Pro Member"
        title="Pro Member"
        className="w-4 h-4 shrink-0 transition-transform hover:scale-110"
        style={{ filter: 'drop-shadow(0px 0px 6px rgba(245,158,11,0.8))' }} 
      />
    ),
    normal: (
      <svg className="w-3.5 h-3.5 text-slate-400 shadow-sm transition-transform hover:scale-110 shrink-0" fill="currentColor" viewBox="0 0 24 24" title="User">
         <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    )
  };

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {username && <span className="font-semibold text-slate-200 truncate">{displayName}</span>}
      {badges[roleKey] || badges['normal']}
    </div>
  );
}