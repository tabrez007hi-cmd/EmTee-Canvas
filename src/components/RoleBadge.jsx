// src/components/RoleBadge.jsx
import React from 'react';

export default function RoleBadge({ role, username = '', prefix = '' }) {
  const roleKey = role?.toLowerCase() || 'normal';
  const displayName = prefix + username;

  // 👑 ADMIN: Golden Sparkling Name + Star/Sparkle SVG
  if (roleKey === 'admin') {
    return (
      <div className="flex items-center gap-1.5" title="System Admin">
        <span 
          className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 animate-pulse truncate" 
          style={{ filter: 'drop-shadow(0px 0px 8px rgba(250,204,21,0.6))' }}
        >
          {displayName}
        </span>
        <svg className="w-4 h-4 text-yellow-400 shrink-0 animate-[spin_4s_linear_infinite]" style={{ filter: 'drop-shadow(0px 0px 6px rgba(250,204,21,0.9))' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l1.6 5.3 5.4.5-4.2 3.8 1.3 5.4-4.8-3-4.8 3 1.3-5.4-4.2-3.8 5.4-.5z"/>
        </svg>
      </div>
    );
  }

  // 💎 OTHER ROLES: Render standard Name + Shiny SVG Badge (No Words)
  const badges = {
    advance: (
      <svg className="w-4 h-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-transform hover:scale-110 shrink-0" fill="currentColor" viewBox="0 0 24 24" title="Advance User">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
      </svg>
    ),
    pro: (
      <svg className="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-transform hover:scale-110 shrink-0" fill="currentColor" viewBox="0 0 24 24" title="Pro Member">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
    ),
    normal: (
      <svg className="w-3.5 h-3.5 text-slate-400 shadow-sm transition-transform hover:scale-110 shrink-0" fill="currentColor" viewBox="0 0 24 24" title="User">
         <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    )
  };

  return (
    <div className="flex items-center gap-1.5">
      {username && <span className="font-semibold text-slate-200 truncate">{displayName}</span>}
      {badges[roleKey] || badges['normal']}
    </div>
  );
}