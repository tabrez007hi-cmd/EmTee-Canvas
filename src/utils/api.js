import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const customFetch = async (endpoint, options = {}) => {
  const user = auth.currentUser;
  let token = '';
  
  // Securely get the JWT token from Firebase Auth
  if (user) {
    token = await user.getIdToken();
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Pass token to backend
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API Request Failed');
  }

  return response.json();
};