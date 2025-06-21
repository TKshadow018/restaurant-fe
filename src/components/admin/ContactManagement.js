import React, { useState, useEffect } from 'react';
import ContactModal from '@/components/admin/ContactModal';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot 
} from '@firebase/firestore';
import { db } from '@/firebase/config';

const ContactManagement = () => {
  const [contact, setContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load contact from Firebase on component mount
  useEffect(() => {
    const loadContactFromFirebase = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'contacts'));
        
        if (querySnapshot.docs.length > 0) {
          // Get the first (and only) contact document
          const contactData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          };
          setContact(contactData);
        } else {
          // Create default contact if none exists
          const defaultContact = {
            name: process.env.REACT_APP_APP_TITLE || 'Shah\'s Eatery',
            address: 'Övre Husargatan 25B, 413 14, Göteborg, Sverige',
            phone: '+46734770107',
            email: process.env.REACT_APP_CONTACT_EMAIL || '',
            businessHours: 'Monday - Friday: 11:00 AM - 10:00 PM\nSaturday: 12:00 PM - 11:00 PM\nSunday: 12:00 PM - 9:00 PM',
            active: true,
            socialMedia: {
              facebook: '',
              instagram: '',
              twitter: ''
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const docRef = await addDoc(collection(db, 'contacts'), defaultContact);
          setContact({ id: docRef.id, ...defaultContact });
        }
        setError(null);
      } catch (err) {
        console.error('Error loading contact:', err);
        setError('Failed to load contact information');
      } finally {
        setLoading(false);
      }
    };

    loadContactFromFirebase();

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      collection(db, 'contacts'),
      (querySnapshot) => {
        if (querySnapshot.docs.length > 0) {
          const contactData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          };
          setContact(contactData);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error in real-time listener:', err);
        setError('Failed to sync contact information');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleEdit = () => {
    setShowModal(true);
  };

  const handleSaveContact = async (contactData) => {
    try {
      if (contact) {
        // Update existing contact
        await updateDoc(doc(db, 'contacts', contact.id), {
          ...contactData,
          updatedAt: new Date()
        });
      }
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error('Error saving contact:', err);
      setError('Failed to save contact information');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Restaurant Contact Information</h1>
        <button className="btn btn-primary" onClick={handleEdit}>
          ✏️ Edit Contact Info
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Single Contact Information Card */}
      {contact && (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">{contact.name}</h4>
                  <div>
                    <span className={`badge ${contact.active ? 'bg-success' : 'bg-secondary'}`}>
                      {contact.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-start mb-3">
                      <div className="flex-shrink-0 me-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                          <span className="text-primary">📍</span>
                        </div>
                      </div>
                      <div>
                        <h6 className="mb-1">Address</h6>
                        <p className="text-muted mb-0">{contact.address}</p>
                      </div>
                    </div>

                    <div className="d-flex align-items-start mb-3">
                      <div className="flex-shrink-0 me-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                          <span className="text-primary">📞</span>
                        </div>
                      </div>
                      <div>
                        <h6 className="mb-1">Phone</h6>
                        <a href={`tel:${contact.phone}`} className="text-decoration-none">
                          {contact.phone}
                        </a>
                      </div>
                    </div>

                    <div className="d-flex align-items-start mb-3">
                      <div className="flex-shrink-0 me-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                          <span className="text-primary">✉️</span>
                        </div>
                      </div>
                      <div>
                        <h6 className="mb-1">Email</h6>
                        <a href={`mailto:${contact.email}`} className="text-decoration-none">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    {contact.businessHours && (
                      <div className="d-flex align-items-start mb-3">
                        <div className="flex-shrink-0 me-3">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                            <span className="text-primary">🕒</span>
                          </div>
                        </div>
                        <div>
                          <h6 className="mb-1">Business Hours</h6>
                          <pre className="text-muted mb-0" style={{ fontSize: '14px', fontFamily: 'inherit' }}>
                            {contact.businessHours}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Social Media Links */}
                    {(contact.socialMedia?.facebook || contact.socialMedia?.instagram || contact.socialMedia?.twitter) && (
                      <div className="d-flex align-items-start">
                        <div className="flex-shrink-0 me-3">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                            <span className="text-primary">🌐</span>
                          </div>
                        </div>
                        <div>
                          <h6 className="mb-2">Social Media</h6>
                          <div className="d-flex gap-2">
                            {contact.socialMedia?.facebook && (
                              <a href={contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                Facebook
                              </a>
                            )}
                            {contact.socialMedia?.instagram && (
                              <a href={contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                Instagram
                              </a>
                            )}
                            {contact.socialMedia?.twitter && (
                              <a href={contact.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                Twitter
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-footer bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Last updated: {contact.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      <ContactModal
        show={showModal}
        onHide={() => setShowModal(false)}
        contact={contact}
        onSave={handleSaveContact}
      />
    </div>
  );
};

export default ContactManagement;