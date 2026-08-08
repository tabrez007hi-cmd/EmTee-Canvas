import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithRedirect, getRedirectResult, updateProfile, onAuthStateChanged } from 'firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isInitializing, setIsInitializing] = useState(!!localStorage.getItem('awaitingGoogleRedirect'));
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const generateAccountNo = () => 'emtee_' + Math.random().toString(36).substr(2, 9).toUpperCase();

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    const processAuth = async () => {
      try {
        if (localStorage.getItem('awaitingGoogleRedirect')) {
          const result = await getRedirectResult(auth);

          if (result && result.user) {
            const userRef = ref(db, `users/${result.user.uid}/profile`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
              await set(userRef, {
                username: result.user.displayName || 'Google User',
                email: result.user.email,
                accountNumber: generateAccountNo(),
                photoURL: result.user.photoURL || '',
                role: 'normal'
              });
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message.replace('Firebase: ', ''));
      } finally {
        localStorage.removeItem('awaitingGoogleRedirect');
      }

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          if (isMounted) navigate('/user/home', { replace: true });
        } else {
          if (isMounted) setIsInitializing(false);
        }
      });
    };

    processAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match");

        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.username });

        await set(ref(db, `users/${userCred.user.uid}/profile`), {
          username: formData.username,
          email: formData.email,
          accountNumber: generateAccountNo(),
          photoURL: '',
          role: 'normal'
        });
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    localStorage.setItem('awaitingGoogleRedirect', 'true');
    signInWithRedirect(auth, googleProvider);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold animate-pulse text-sm tracking-widest uppercase">Securing your session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex items-center justify-center p-6 selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-800 p-8 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <i className="bi bi-lightning-charge-fill text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{isLogin ? 'Sign in to EmTeeCanvas' : 'Create your account'}</h2>
        </div>

        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-xs font-semibold rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">USERNAME</label>
              <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">EMAIL</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">PASSWORD</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-400 mb-1">CONFIRM PASSWORD</label>
              <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-500 mt-2 disabled:opacity-50 cursor-pointer transition-all hover:-translate-y-0.5">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mt-6 py-3.5 bg-slate-950 border border-slate-800 text-slate-300 font-bold rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
        >
          <i className="bi bi-google text-red-400"></i> Continue with Google
        </button>

        <p className="text-center text-xs text-slate-500 mt-8">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}