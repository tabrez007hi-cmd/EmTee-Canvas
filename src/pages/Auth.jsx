import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Generates unique EmTeeCanvas Account ID
  const generateAccountNo = () => 'emtee_' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        navigate('/user/home'); // Updated route
      } else {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match");
        
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.username });

        // Save Profile to Realtime Database
        await set(ref(db, `users/${userCred.user.uid}/profile`), {
          username: formData.username,
          email: formData.email,
          accountNumber: generateAccountNo(),
          photoURL: '',
          role: 'normal' // Enforce default normal role
        });
        navigate('/user/home'); // Updated route
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(''); 
    setLoading(true);
    
    try {
      // Reverted to signInWithPopup for direct execution
      const userCred = await signInWithPopup(auth, googleProvider);
      
      // Check if user exists in Realtime DB, if not, create their profile
      const userRef = ref(db, `users/${userCred.user.uid}/profile`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await set(userRef, {
          username: userCred.user.displayName || 'Google User',
          email: userCred.user.email,
          accountNumber: generateAccountNo(),
          photoURL: userCred.user.photoURL || '',
          role: 'normal' // Enforce default normal role
        });
      }
      navigate('/user/home'); // Updated route
    } catch (err) {
      // Ignore the error if the user simply closed the popup manually
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <i className="bi bi-lightning-charge-fill text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{isLogin ? 'Sign in to EmTeeCanvas' : 'Create your account'}</h2>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">USERNAME</label>
              <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">EMAIL</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">PASSWORD</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CONFIRM PASSWORD</label>
              <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full border rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 mt-2 disabled:opacity-50 cursor-pointer">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="w-full mt-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <i className="bi bi-google text-red-500"></i> Continue with Google
        </button>

        <p className="text-center text-xs text-gray-500 mt-8">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-600 font-bold hover:underline cursor-pointer">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}