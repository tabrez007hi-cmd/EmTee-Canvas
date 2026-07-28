import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useUI } from '../contexts/UIContext';
import { ref, set, get, update,onValue } from 'firebase/database';

const wrapHtmlToLayout = (htmlString) => {
  return JSON.stringify([{
    id: `element_${Date.now()}_root`,
    type: 'div',
    customId: `system-template`,
    parentId: null,
    text: '',
    styles: { width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    tabletStyles: {}, mobileStyles: {},
    rawHtml: htmlString.trim(),
    isRawChild: false
  }]);
};

export default function DeployTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('normal');
    const { showToast, showConfirm } = useUI();
  const [userProfile, setUserProfile] = useState(null);

  // ✨ Detect if we are updating an existing template via URL or Router State
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('id') || queryParams.get('edit') || location.state?.template?.id;

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('bi-layout-text-window');
  
  const [codeMode, setCodeMode] = useState('tailwind'); 
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/authentication'); return; }

    // 🔐 Parse emails from the .env file dynamically
const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS 
  ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.toLowerCase().trim()) 
  : [];

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
    
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      navigate('/user/home');
      return;
    }

    const loadTemplateData = (data) => {
      setName(data.name || '');
      setDescription(data.description || '');
      setIcon(data.icon || 'bi-layout-text-window');

      let rawStr = '';
      try {
        const parsed = JSON.parse(data.layouts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawStr = parsed[0].rawHtml || '';
        }
      } catch (e) {
        rawStr = data.layouts || '';
      }

      // 🛠️ Reverse-engineer the saved string to extract the CSS back into the CSS tab!
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/i;
      const match = rawStr.match(styleRegex);
      
      if (match) {
        setCodeMode('css');
        setCssCode(match[1].trim());
        setHtmlCode(rawStr.replace(match[0], '').trim());
      } else {
        setCodeMode('tailwind');
        setHtmlCode(rawStr.trim());
      }
    };

    if (location.state?.template) {
       loadTemplateData(location.state.template);
       setLoading(false);
    } else if (editId) {
      get(ref(db, `templates/${editId}`)).then((snap) => {
        if (snap.exists()) {
          loadTemplateData(snap.val());
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [navigate, editId, location.state]);

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!name.trim() || !htmlCode.trim() || !description.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalHtml = htmlCode.trim();
      if (codeMode === 'css' && cssCode.trim() !== '') {
        finalHtml = `<style>\n${cssCode.trim()}\n</style>\n${finalHtml}`;
      }

      // ✨ Intelligently switch between 'Update' and 'Create'
      if (editId) {
        const updates = {
          name: name.trim(),
          description: description.trim(),
          icon: icon,
          layouts: wrapHtmlToLayout(finalHtml),
          updatedAt: Date.now()
        };
        await update(ref(db, `templates/${editId}`), updates);
        showToast('Template updated successfully! ', 'success');
      } else {
        const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const payload = {
          id: templateId,
          name: name.trim(),
          description: description.trim(),
          icon: icon,
          authorId: auth.currentUser.uid,
          createdAt: Date.now(),
          layouts: wrapHtmlToLayout(finalHtml)
        };
        await set(ref(db, `templates/${templateId}`), payload);
        showToast('Template deployed successfully to global directory!','success');
      }
      
      navigate('/user/templates');
    } catch (error) {
      console.error(error);
      showToast('Deployment/Update failed. Please check your connection.', 'error');
    }
    setIsSubmitting(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-cloud-arrow-up-fill'} text-xl`}></i>
              </div>
              {editId ? 'Update Template' : 'Deploy Template'}
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              {editId ? 'Modify and refine an existing global template.' : 'Publish custom HTML components to the global marketplace.'}
            </p>
          </div>
          <button onClick={() => navigate('/user/home')} className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all cursor-pointer shadow-sm text-sm">
            <i className="bi bi-arrow-left mr-2"></i> Dashboard
          </button>
        </div>

        <form onSubmit={handleDeploy} className="space-y-6">
          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Template Title *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Modern Pricing Grid" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bootstrap Icon Class</label>
                <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. bi-layout-wtf" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description *</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this template is best used for..." className="w-full h-20 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar" />
              </div>
            </div>

            <hr className="border-slate-800 relative z-10" />

            <div className="relative z-10 space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Framework Architecture</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => setCodeMode('tailwind')} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${codeMode === 'tailwind' ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.2)] text-indigo-400' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                  <i className="bi bi-wind"></i> HTML + Tailwind
                </button>
                <button type="button" onClick={() => setCodeMode('css')} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${codeMode === 'css' ? 'bg-pink-500/10 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)] text-pink-400' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                  <i className="bi bi-filetype-css"></i> Pure HTML + Custom CSS
                </button>
              </div>
            </div>

            <div className={`grid gap-6 relative z-10 ${codeMode === 'css' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  <span>Raw HTML Code *</span>
                  <span className="text-indigo-500"><i className="bi bi-file-earmark-code"></i></span>
                </label>
                <textarea 
                  required 
                  value={htmlCode} 
                  onChange={(e) => setHtmlCode(e.target.value)} 
                  placeholder={codeMode === 'tailwind' ? '<div class="flex items-center text-blue-500">\n  Hello Tailwind!\n</div>' : '<div class="my-card">\n  Hello Standard CSS!\n</div>'}
                  className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-[11px] font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar leading-relaxed" 
                  spellCheck="false"
                />
              </div>

              {codeMode === 'css' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between">
                    <span>Custom Stylesheet (CSS)</span>
                    <span className="text-pink-500"><i className="bi bi-filetype-css"></i></span>
                  </label>
                  <textarea 
                    value={cssCode} 
                    onChange={(e) => setCssCode(e.target.value)} 
                    placeholder=".my-card {\n  display: flex;\n  align-items: center;\n  color: #3b82f6;\n}"
                    className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-[11px] font-mono text-pink-400 focus:outline-none focus:border-pink-500 transition-colors resize-none custom-scrollbar leading-relaxed" 
                    spellCheck="false"
                  />
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer relative z-10"
            >
              {isSubmitting ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className={`bi ${editId ? 'bi-cloud-check-fill' : 'bi-rocket-takeoff-fill'}`}></i>}
              {isSubmitting ? (editId ? 'Updating...' : 'Deploying...') : (editId ? 'Update Template' : 'Deploy Global Template')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}