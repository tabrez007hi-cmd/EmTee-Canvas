import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, get, update, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { generateCanvasHtml } from '../utils/templates';
import RoleBadge from '../components/RoleBadge';


const generateProjectSlug = (name) => {
  const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const uniqueId = Math.random().toString(36).substr(2, 6);
  return `${cleanName}_${uniqueId}`;
};

export default function SharedWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const wsId = queryParams.get('ws');
  const ownerId = queryParams.get('owner');

  const [workspace, setWorkspace] = useState(null);
  const [authorName, setAuthorName] = useState('Community Member'); 
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('web'); 
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('normal');
  const [userWorkspaces, setUserWorkspaces] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // 🔐 Parse emails from the .env file dynamically
const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS 
  ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.toLowerCase().trim()) 
  : [];

// Evaluate role (Example from UserHome.jsx)
const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());

const profileRef = ref(db, `users/${user.uid}/profile`);
onValue(profileRef, (snapshot) => {
  if (snapshot.exists()) {
     const data = snapshot.val();
     setUserProfile(data);
     // Assign 'admin' if email matches .env, otherwise fallback to database role or 'normal'
     setUserRole(isAdmin ? 'admin' : (data.role || 'normal'));
  }
});

        onValue(ref(db, `users/${user.uid}/workspaces`), (snap) => {
          if (snap.exists()) setUserWorkspaces(Object.values(snap.val()));
          else setUserWorkspaces([]);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!wsId || !ownerId) {
      alert("Invalid Share Link");
      navigate('/');
      return;
    }

    const fetchWorkspace = async () => {
      try {
        // 🚀 STEP 1: Always try the public database first! Guests have read access here.
        const publicSnap = await get(ref(db, `publicWorkspaces/${wsId}`));
        
        if (publicSnap.exists()) {
          const wsData = publicSnap.val();
          setWorkspace(wsData);
          if (wsData.authorName) {
             setAuthorName(wsData.authorName);
          }
          setLoading(false);
          return; // Exit early, we got the public data!
        }

        // 🔒 STEP 2: If it's not public, try the private path (This will only work if the owner themselves is viewing it)
        const wsRef = ref(db, `users/${ownerId}/workspaces/${wsId}`);
        const snap = await get(wsRef);

        if (snap.exists()) {
           const wsData = snap.val();
           
           if (!wsData.isPublic) {
              alert("Access Denied 🔒\nThis workspace is private and cannot be shared.");
              navigate('/');
              return;
           }
           
           setWorkspace(wsData);
           
           // Fetch profile safely here since we know the user has access
           const profileSnap = await get(ref(db, `users/${ownerId}/profile`));
           if (profileSnap.exists() && profileSnap.val().username) {
              setAuthorName(profileSnap.val().username);
           }
        } else {
           alert("Workspace not found or has been deleted.");
           navigate('/');
        }
      } catch (e) {
        console.error("Fetch Error:", e);
        // If Firebase throws a Permission Denied error, it lands here.
        alert("Access Denied 🔒\nThis workspace is private or you do not have permission to view it.");
        navigate('/');
      }
      setLoading(false);
    };

    fetchWorkspace();
  }, [wsId, ownerId, navigate]);

  const handleClone = async () => {
    if (!currentUser) return;
    
    const privateLimit = userRole === 'normal' ? 1 : userRole === 'pro' ? 10 : Infinity;
    const totalLimit = userRole === 'normal' ? 3 : userRole === 'pro' ? 10 : Infinity;
    
    if (userWorkspaces.length >= totalLimit) {
      alert(`Plan Limit Reached 🚨\nYou currently have ${userWorkspaces.length} workspaces. Please go to your Dashboard to delete or swap existing projects before importing new ones.`);
      navigate('/user/home');
      return;
    }

    const privateCount = userWorkspaces.filter(w => !w.isPublic).length;
    const forcePublic = userRole === 'normal' && privateCount >= privateLimit;

    const newId = generateProjectSlug(workspace.name);
    const importedProject = {
      ...workspace,
      id: newId,
      name: `${workspace.name} (Cloned)`,
      isPublic: forcePublic, 
      allowCodeView: false, 
      allowDomView: false,
      createdAt: Date.now(), 
      updatedAt: Date.now()
    };
    
    const dbUpdates = {};
    dbUpdates[`users/${currentUser.uid}/workspaces/${newId}`] = importedProject;
    
    if (forcePublic) {
       dbUpdates[`publicWorkspaces/${newId}`] = { 
          ...importedProject, authorId: currentUser.uid, authorName: userProfile?.username || 'Unknown', 
          authorPhoto: userProfile?.photoURL || null, authorRole: userRole 
       };
    }
    
    await update(ref(db), dbUpdates);
    alert('Workspace Cloned Successfully! 🚀');
    navigate(`/builder?u=${userProfile?.username || 'user'}&ws=${newId}&owner=${currentUser.uid}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  }

  if (!workspace) return null;

  const layoutsObj = typeof workspace.layouts === 'string' ? JSON.parse(workspace.layouts || '[]') : workspace.layouts;
  const compiledHtml = generateCanvasHtml(layoutsObj, true);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
      
      <nav className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md z-10">
        <div className="flex items-center gap-4">
          <div onClick={() => navigate('/')} className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer">
            <i className="bi bi-lightning-charge-fill text-white"></i>
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide text-white">{workspace.name}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Author: <span className="text-slate-300 font-bold">@{authorName}</span></div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-slate-950 rounded-lg p-1 border border-slate-800">
             <button onClick={() => setViewMode('web')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'web' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white cursor-pointer'}`}><i className="bi bi-globe mr-1"></i> Web View</button>
             <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white cursor-pointer'}`}><i className="bi bi-code-slash mr-1"></i> Source Code</button>
          </div>
          
          <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
          
          {/* ✨ FIX: Home / Dashboard button injected smoothly alongside the Clone logic */}
          {currentUser && (
            <button onClick={() => navigate('/user/home')} className="hidden sm:flex px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all shadow-sm border border-slate-700 cursor-pointer items-center gap-2">
              <i className="bi bi-house-door-fill"></i> Dashboard
            </button>
          )}

          {!currentUser ? (
            <button onClick={() => navigate('/authentication')} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer flex items-center gap-2">
              <i className="bi bi-person-circle"></i> Login to EmTeeCanvas
            </button>
          ) : (
            <button onClick={handleClone} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer flex items-center gap-2">
              <i className="bi bi-cloud-download-fill"></i> Clone to Workspace
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col relative w-full items-center bg-slate-950">
        <div className="w-full flex-1 max-w-[1600px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden relative flex flex-col">
          {viewMode === 'web' ? (
             <iframe srcDoc={compiledHtml} className="w-full flex-1 bg-white border-0" title="Web Preview" />
          ) : (
             <textarea 
               value={compiledHtml} 
               readOnly 
               className="w-full flex-1 bg-slate-950 text-emerald-400 font-mono text-[11px] p-6 focus:outline-none resize-none custom-scrollbar leading-relaxed border-0" 
             />
          )}
        </div>
      </main>

    </div>
  );
}