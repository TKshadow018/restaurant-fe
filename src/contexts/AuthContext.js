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
import { getUserProfile, createInitialUserProfile, isProfileComplete } from '@/services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
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
        // New user - create initial profile
        const initialProfile = createInitialUserProfile(user);
        await setDoc(userRef, {
          ...initialProfile,
          ...userData,
          createdAt: serverTimestamp(),
          isActive: true,
          role: 'customer' // Default role
        });
      } else {
        // Existing user - just update login time
        await updateDoc(userRef, userData);
      }
      
      // Fetch and update user profile state
      await loadUserProfile(user.uid);
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
    }
  };

  // Load user profile data
  const loadUserProfile = async (userId) => {
    try {
      const profile = await getUserProfile(userId);
      if (profile.success && profile.data) {
        setUserProfile(profile.data);
        setProfileComplete(isProfileComplete(profile.data));
      } else {
        setUserProfile(null);
        setProfileComplete(false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
      setProfileComplete(false);
    }
  };

  // Update user profile in context
  const updateUserProfile = async (profileData) => {
    try {
      setUserProfile(profileData);
      setProfileComplete(isProfileComplete(profileData));
    } catch (error) {
      console.error('Error updating user profile in context:', error);
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
    setUserProfile(null);
    setProfileComplete(false);
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Save/update user data and load profile
        await saveUserToFirestore(user);
      } else {
        // Clear profile data when user logs out
        setUserProfile(null);
        setProfileComplete(false);
        localStorage.removeItem('user');
      }
      
      setLoading(false);
    });

    // Handle redirect result when page loads
    getRedirectResult(auth).then(async (result) => {
      if (result) {
        console.log('Redirect sign-in successful:', result);
        await saveUserToFirestore(result.user);
      }
    }).catch((error) => {
      console.error('Redirect result error:', error);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    profileComplete,
    signup,
    login,
    signInWithGoogle,
    logout,
    updateUserProfile,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};