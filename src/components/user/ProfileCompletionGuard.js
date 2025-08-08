import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkProfileCompletionRequired } from '@/services/userService';
import ProfileCompletion from './ProfileCompletion';
import Loading from '../Loading';

/**
 * ProfileCompletionGuard - Shows profile completion modal if needed
 */
const ProfileCompletionGuard = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [profileCheck, setProfileCheck] = useState({
    loading: true,
    required: false,
    reason: null
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    checkProfileStatus();
  }, [currentUser]);

  const checkProfileStatus = async () => {
    if (!currentUser) {
      setProfileCheck({
        loading: false,
        required: false,
        reason: 'no_user'
      });
      setShowProfileModal(false);
      return;
    }

    try {
      setProfileCheck(prev => ({ ...prev, loading: true }));
      
      const result = await checkProfileCompletionRequired(currentUser.uid);
      
      setProfileCheck({
        loading: false,
        required: result.required,
        reason: result.reason
      });
      
      // Show modal if profile completion is required
      setShowProfileModal(result.required);
    } catch (error) {
      console.error('Profile check error:', error);
      setProfileCheck({
        loading: false,
        required: true, // Err on the side of caution
        reason: 'error'
      });
      setShowProfileModal(true);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    setProfileCheck({
      loading: false,
      required: false,
      reason: 'complete'
    });
  };

  const handleProfileSkip = () => {
    setShowProfileModal(false);
    setProfileCheck({
      loading: false,
      required: false, // Allow access even if skipped
      reason: 'skipped'
    });
  };

  const handleProfileClose = () => {
    // Just close modal without updating database - will appear again on next login
    setShowProfileModal(false);
    setProfileCheck({
      loading: false,
      required: false, // Allow access for current session
      reason: 'closed'
    });
  };

  // Show loading while checking auth or profile status
  if (authLoading || profileCheck.loading) {
    return <Loading message="Checking profile status..." />;
  }

  // Determine if skip should be allowed based on the reason
  const allowSkip = profileCheck.reason !== 'error'; // Allow skip unless there's a system error

  return (
    <>
      {children}
      
      {/* Profile Completion Modal */}
      <ProfileCompletion
        show={showProfileModal}
        onComplete={handleProfileComplete}
        onSkip={handleProfileSkip}
        onClose={handleProfileClose}
        allowSkip={allowSkip}
      />
    </>
  );
};

export default ProfileCompletionGuard;
