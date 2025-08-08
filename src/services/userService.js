import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * Save user profile data to Firestore
 */
export const saveUserProfile = async (profileData) => {
  try {
    const userRef = doc(db, 'users', profileData.userId);
    
    const dataToSave = {
      ...profileData,
      updatedAt: serverTimestamp(),
      profileCompleted: true
    };

    await setDoc(userRef, dataToSave, { merge: true });
    
    console.log('User profile saved successfully');
    return { success: true, data: dataToSave };
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw new Error('Failed to save user profile');
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, data: null };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
};

/**
 * Update specific fields in user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);
    
    console.log('User profile updated successfully');
    return { success: true, data: updateData };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = (userData) => {
  if (!userData) return false;
  
  const requiredFields = [
    'firstName',
    'lastName',
    'dateOfBirth',
    'gender',
    'phoneNumber'
  ];

  const requiredAddressFields = [
    'address.street',
    'address.houseNumber',
    'address.postalCode',
    'address.city'
  ];

  // Check basic required fields
  for (const field of requiredFields) {
    if (!userData[field] || userData[field].toString().trim() === '') {
      return false;
    }
  }

  // Check address fields
  for (const field of requiredAddressFields) {
    const fieldPath = field.split('.');
    let value = userData;
    
    for (const path of fieldPath) {
      value = value?.[path];
    }
    
    if (!value || value.toString().trim() === '') {
      return false;
    }
  }

  return true;
};

/**
 * Get user's full name
 */
export const getUserFullName = (userData) => {
  if (!userData) return '';
  
  const firstName = userData.firstName || '';
  const lastName = userData.lastName || '';
  
  return `${firstName} ${lastName}`.trim();
};

/**
 * Get user's formatted address
 */
export const getUserFormattedAddress = (userData) => {
  if (!userData?.address) return '';
  
  const { street, houseNumber, postalCode, city } = userData.address;
  
  if (!street || !houseNumber || !postalCode || !city) {
    return '';
  }
  
  return `${street} ${houseNumber}, ${postalCode} ${city}`;
};

/**
 * Calculate user's age from date of birth
 */
export const calculateUserAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate user profile data before saving
 */
export const validateUserProfile = (profileData) => {
  const errors = {};
  
  // Validate required fields
  if (!profileData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!profileData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!profileData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const age = calculateUserAge(profileData.dateOfBirth);
    if (age < 13 || age > 120) {
      errors.dateOfBirth = 'Invalid age (must be between 13-120 years)';
    }
  }
  
  if (!profileData.gender) {
    errors.gender = 'Gender is required';
  }
  
  if (!profileData.phoneNumber?.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else {
    // Swedish phone number validation
    const phoneRegex = /^(\+46|0)[0-9]{8,9}$/;
    if (!phoneRegex.test(profileData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Invalid Swedish phone number format';
    }
  }
  
  // Validate address
  if (!profileData.address) {
    errors.address = 'Address information is required';
  } else {
    const { street, houseNumber, postalCode, city } = profileData.address;
    
    if (!street?.trim()) {
      errors['address.street'] = 'Street name is required';
    }
    
    if (!houseNumber?.trim()) {
      errors['address.houseNumber'] = 'House number is required';
    }
    
    if (!postalCode?.trim()) {
      errors['address.postalCode'] = 'Postal code is required';
    } else {
      // Swedish postal code validation
      const postalCodeRegex = /^(\d{3}\s?\d{2})$/;
      if (!postalCodeRegex.test(postalCode.trim())) {
        errors['address.postalCode'] = 'Invalid Swedish postal code format';
      }
    }
    
    if (!city?.trim()) {
      errors['address.city'] = 'City is required';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Create initial user profile structure
 */
export const createInitialUserProfile = (authUser) => {
  return {
    userId: authUser.uid,
    email: authUser.email,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: authUser.phoneNumber || '',
    address: {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      region: '',
      coordinates: { lat: null, lng: null }
    },
    profileCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
};

/**
 * Check if user needs to complete profile
 */
export const checkProfileCompletionRequired = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile.success || !profile.data) {
      return { required: true, reason: 'no_profile' };
    }
    
    const userData = profile.data;
    
    // If profile is already marked as completed, check if it's actually complete
    if (userData.profileCompleted) {
      if (isProfileComplete(userData)) {
        return { required: false, reason: 'complete' };
      } else {
        // Profile marked complete but missing data - require completion
        return { required: true, reason: 'incomplete_data' };
      }
    }
    
    // Check if user recently skipped (within 7 days) - only if explicitly skipped
    if (userData.profileSkipped && userData.skippedAt) {
      const skippedDate = new Date(userData.skippedAt);
      const daysSinceSkipped = (new Date() - skippedDate) / (1000 * 60 * 60 * 24);
      
      // Only ask again after 7 days if they explicitly clicked "Skip for now"
      if (daysSinceSkipped < 7) {
        return { required: false, reason: 'recently_skipped' };
      }
    }
    
    // Check if profile has any address information
    const hasAddressInfo = userData.address && (
      userData.address.street || 
      userData.address.postalCode || 
      userData.address.city
    );
    
    // If no address info and not recently skipped, require completion
    if (!hasAddressInfo) {
      return { required: true, reason: 'no_address' };
    }
    
    // If profile is not complete but has some info, still require completion
    if (!isProfileComplete(userData)) {
      return { required: true, reason: 'missing_fields' };
    }
    
    return { required: false, reason: 'complete' };
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return { required: true, reason: 'error' };
  }
};
