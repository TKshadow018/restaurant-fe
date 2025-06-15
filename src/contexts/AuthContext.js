import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Popup sign-in failed:', error);
      
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.message.includes('Cross-Origin-Opener-Policy')) {
        
        console.log('Falling back to redirect method');
        return signInWithRedirect(auth, googleProvider);
      }
      
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Optional: Clean up any existing localStorage entries
      if (!user) {
        localStorage.removeItem('user');
      }
    });

    // Handle redirect result when page loads
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log('Redirect sign-in successful:', result);
      }
    }).catch((error) => {
      console.error('Redirect result error:', error);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};