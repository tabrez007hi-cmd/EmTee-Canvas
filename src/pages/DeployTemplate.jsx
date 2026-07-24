import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, set, get, onValue } from 'firebase/database';

export default function DeployTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('bi-layout-text-window');
  const [htmlCode, setHtmlCode] = useState('<div class="w-full p-8 text-center">\n  <h1 class="text-3xl font-bold text-gray-800">Hello World</h1>\n</div>');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState('');

  const [editTemplateId, setEditTemplateId] = useState(null);
  const [originalCreatedAt, setOriginalCreatedAt] = useState(Date.now());
  const [userRole, setUserRole] = useState('normal');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/'); return; }

    const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS 
      ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.toLowerCase().trim()) 
      : [];
      
    const profileRef = ref(db, `users/${user.uid}/profile`);
    onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
         const data = snapshot.val();
         setUserRole(isHardcodedDev ? 'developer' : (data.role || 'normal'));
      }
    });

    const searchParams = new URLSearchParams(location.search);
    const targetEditId = searchParams.get('edit');
    if (targetEditId) {
      get(ref(db, `templates/${targetEditId}`)).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.authorId !== auth.currentUser?.uid) { navigate('/user/home'); return; }
          setEditTemplateId(targetEditId);
          setName(data.name || '');
          setDescription(data.description || '');
          setIcon(data.icon || '');
          setOriginalCreatedAt(data.createdAt || Date.now());
          try {
            const parsedArray = JSON.parse(data.layouts);
            if (Array.isArray(parsedArray) && parsedArray.length > 0) {
              setHtmlCode(parsedArray[0].rawHtml || '');
            }
          } catch (err) {}
        }
      });
    }
  }, [location, navigate]);

  const handleDeploy = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !description.trim() || !htmlCode.trim()) { setError('Fill out all fields.'); return; }

    setIsDeploying(true);
    const templateId = editTemplateId || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const rootNodeId = `element_${Date.now()}_root`;

    const generatedLayout = [{
        id: rootNodeId, type: 'div', customId: `template-${templateId}`, parentId: null, text: '',
        styles: { width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
        tabletStyles: {}, mobileStyles: {}, rawHtml: htmlCode.trim(), isRawChild: false
    }];

    const templateData = { id: templateId, name: name.trim(), description: description.trim(), icon: icon.trim(), layouts: JSON.stringify(generatedLayout), authorId: auth.currentUser.uid, createdAt: originalCreatedAt };

    try {
      await set(ref(db, `templates/${templateId}`), templateData);
      navigate('/user/home');
    } catch (err) { setError('Failed to deploy.'); } 
    finally { setIsDeploying(false); }
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-200">
      <nav className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]"><i className="bi bi-lightning-charge-fill text-white"></i></div>
          <span className="font-bold text-white text-lg tracking-tight">EmTeeCanvas</span>
          <div className="h-4 w-px bg-slate-700 mx-2 hidden sm:block"></div>
          <span className="text-sm font-semibold text-slate-400 hidden sm:block">{editTemplateId ? 'Edit Template' : 'Template Deployment'}</span>
        </div>
        <button onClick={() => navigate('/user/home')} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"><i className="bi bi-arrow-left"></i> Return</button>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 sm:p-10 overflow-y-auto custom-scrollbar">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden mb-12">
          <div className={`${editTemplateId ? 'bg-emerald-600' : 'bg-indigo-600'} p-6 sm:p-8 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
            <h1 className="text-2xl font-extrabold mb-2 relative z-10">{editTemplateId ? 'Update HTML Template' : 'Deploy HTML Template'}</h1>
          </div>
          <form onSubmit={handleDeploy} className="p-6 space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm font-bold">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-4">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Template Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Icon Class</label><input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:border-indigo-500 outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm min-h-[120px] text-slate-200 focus:border-indigo-500 outline-none custom-scrollbar" /></div>
              </div>
              <div className="md:col-span-8 flex flex-col min-h-[400px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Raw HTML Code</label>
                <textarea value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} className="flex-1 w-full border border-slate-800 rounded-xl p-4 text-sm font-mono text-emerald-400 bg-slate-950 focus:border-indigo-500 outline-none custom-scrollbar" spellCheck="false" />
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button type="submit" disabled={isDeploying} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors cursor-pointer"><i className="bi bi-cloud-arrow-up-fill"></i> Deploy Template</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}