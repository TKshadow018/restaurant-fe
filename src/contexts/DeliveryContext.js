import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';

const DeliveryContext = createContext();

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};

export const DeliveryProvider = ({ children }) => {
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener for delivery settings
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'delivery');
    
    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        if (doc.exists()) {
          setIsDeliveryEnabled(doc.data().enabled ?? true);
        } else {
          setIsDeliveryEnabled(true);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching delivery settings:', err);
        setError('Failed to load delivery settings');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Function to toggle delivery status (admin only)
  const toggleDelivery = async () => {
    try {
      const newStatus = !isDeliveryEnabled;
      const settingsRef = doc(db, 'settings', 'delivery');
      
      await setDoc(settingsRef, {
        enabled: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }, { merge: true });

      setIsDeliveryEnabled(newStatus);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error updating delivery settings:', err);
      setError('Failed to update delivery settings');
      return false;
    }
  };

  const value = {
    isDeliveryEnabled,
    loading,
    error,
    toggleDelivery
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
};

export default DeliveryContext;
