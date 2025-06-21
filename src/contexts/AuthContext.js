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
import { auth, googleProvider, db } from '@/firebase/config';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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

  // Helper function to save/update user in Firestore
  const saveUserToFirestore = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const userData = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (!userDoc.exists()) {
        // New user
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          isActive: true,
          role: 'customer' // Default role
        });
      } else {
        // Existing user - just update login time
        await updateDoc(userRef, userData);
      }
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(result.user);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user);
      return result;
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
      
      // Save/update user data when they sign in
      if (user) {
        saveUserToFirestore(user);
      }
      
      // Optional: Clean up any existing localStorage entries
      if (!user) {
        localStorage.removeItem('user');
      }
    });

    // Handle redirect result when page loads
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log('Redirect sign-in successful:', result);
        saveUserToFirestore(result.user);
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