import React, { useState, useEffect } from 'react';
import { Modal, Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/contexts/AuthContext';
import AddressPickerMap from './AddressPickerMap';
import { saveUserProfile, updateUserProfile } from '@/services/userService';
import { useTranslation } from 'react-i18next';
import '@/styles/ProfileCompletion.css';

const ProfileCompletion = ({ show, onComplete, onSkip, onClose, allowSkip = true }) => {
  const { currentUser, updateUserProfile: updateAuthProfile } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      region: '',
      coordinates: { lat: null, lng: null }
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Pre-populate with existing user data if available
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        firstName: currentUser.displayName?.split(' ')[0] || '',
        lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
        phoneNumber: currentUser.phoneNumber || ''
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('profile.errors.firstNameRequired', 'First name is required');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('profile.errors.lastNameRequired', 'Last name is required');
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('profile.errors.dobRequired', 'Date of birth is required');
    } else {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.dateOfBirth = t('profile.errors.invalidAge', 'Please enter a valid age (13-120 years)');
      }
    }

    if (!formData.gender) {
      newErrors.gender = t('profile.errors.genderRequired', 'Gender is required');
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t('profile.errors.phoneRequired', 'Phone number is required');
    } else if (!/^(\+46|0)[0-9]{8,9}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = t('profile.errors.invalidPhone', 'Please enter a valid Swedish phone number');
    }

    // Basic address validation - just check if required fields are filled
    if (!formData.address.street.trim()) {
      newErrors.address = t('profile.errors.streetRequired', 'Street name is required');
    } else if (!formData.address.houseNumber.trim()) {
      newErrors.address = t('profile.errors.houseNumberRequired', 'House number is required');
    } else if (!formData.address.postalCode.trim()) {
      newErrors.address = t('profile.errors.postalCodeRequired', 'Postal code is required');
    } else if (!formData.address.city.trim()) {
      newErrors.address = t('profile.errors.cityRequired', 'City is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        ...formData,
        userId: currentUser.uid,
        email: currentUser.email,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };

      await saveUserProfile(profileData);
      await updateAuthProfile(profileData);

      // Call completion callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Profile save error:', error);
      setErrors({
        submit: t('profile.errors.saveFailed', 'Failed to save profile. Please try again.')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (onSkip) {
      setLoading(true);
      try {
        // Mark profile as skipped (not completed) in database
        const skippedData = {
          userId: currentUser.uid,
          email: currentUser.email,
          profileCompleted: false,
          profileSkipped: true,
          skippedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await updateUserProfile(currentUser.uid, skippedData);
        onSkip();
      } catch (error) {
        console.error('Skip profile error:', error);
        // Even if update fails, allow skip to continue
        onSkip();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    // Just close without marking as skipped - will appear again on next login
    if (onClose) {
      onClose();
    } else if (onSkip) {
      onSkip();
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={allowSkip ? handleClose : undefined}
      backdrop={allowSkip ? true : 'static'}
      keyboard={allowSkip}
      size="lg"
      centered
      className="profile-completion-modal"
    >
      <Modal.Header closeButton={allowSkip} className="profile-completion-header">
        <Modal.Title className="w-100 text-center">
          <h4 className="mb-0">
            {t('profile.completeTitle', 'Complete Your Profile')}
          </h4>
          <small className="d-block mt-1">
            {t('profile.completeSubtitle', 'Please fill in the required information')}
          </small>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="profile-completion-body">{errors.submit && (
                <Alert variant="danger">{errors.submit}</Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <h5 className="profile-section-title">
                  {t('profile.personalInfo', 'Personal Information')}
                </h5>

                <Row>
                  <Col md={6}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.firstName', 'First Name')} *
                      </Form.Label>
                      <Form.Control
                        className="profile-form-control"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        isInvalid={!!errors.firstName}
                        placeholder={t('profile.firstNamePlaceholder', 'Enter your first name')}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.lastName', 'Last Name')} *
                      </Form.Label>
                      <Form.Control
                        className="profile-form-control"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        isInvalid={!!errors.lastName}
                        placeholder={t('profile.lastNamePlaceholder', 'Enter your last name')}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.dateOfBirth', 'Date of Birth')} *
                      </Form.Label>
                      <Form.Control
                        className="profile-form-control"
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        isInvalid={!!errors.dateOfBirth}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.dateOfBirth}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.gender', 'Gender')} *
                      </Form.Label>
                      <Form.Select
                        className="profile-form-control"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        isInvalid={!!errors.gender}
                      >
                        <option value="">{t('profile.selectGender', 'Select gender')}</option>
                        <option value="male">{t('profile.male', 'Male')}</option>
                        <option value="female">{t('profile.female', 'Female')}</option>
                        <option value="other">{t('profile.other', 'Other')}</option>
                        <option value="prefer_not_to_say">{t('profile.preferNotToSay', 'Prefer not to say')}</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.gender}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="profile-form-group">
                  <Form.Label className="profile-form-label">
                    {t('profile.phoneNumber', 'Phone Number')} *
                  </Form.Label>
                  <Form.Control
                    className="profile-form-control"
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    isInvalid={!!errors.phoneNumber}
                    placeholder="+46 XX XXX XX XX"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phoneNumber}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    {t('profile.phoneHelp', 'Swedish phone number format')}
                  </Form.Text>
                </Form.Group>

                {/* Address Information */}
                <h5 className="profile-section-title mt-4">
                  {t('profile.addressInfo', 'Address Information')}
                </h5>

                <Row>
                  <Col md={8}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.street', 'Street Name')} *
                      </Form.Label>
                      <Form.Control
                        className="profile-form-control"
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        placeholder={t('profile.streetPlaceholder', 'e.g., Kungsgatan')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.houseNumber', 'House Number')} *
                      </Form.Label>
                      <Form.Control
                        className="profile-form-control"
                        type="text"
                        name="address.houseNumber"
                        value={formData.address.houseNumber}
                        onChange={handleInputChange}
                        placeholder="12A"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.postalCode', 'Postal Code')} *
                      </Form.Label>
                      <Form.Control
                        className="profile-form-control"
                        type="text"
                        name="address.postalCode"
                        value={formData.address.postalCode}
                        onChange={handleInputChange}
                        placeholder="123 45"
                        maxLength={6}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="profile-form-group">
                      <Form.Label className="profile-form-label">
                        {t('profile.city', 'City')} *
                      </Form.Label>
                      <Form.Control
                        className="profile-form-control"
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder={t('profile.cityPlaceholder', 'e.g., Stockholm')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="profile-form-group">
                  <Form.Label className="profile-form-label">
                    {t('profile.region', 'Region/County')}
                  </Form.Label>
                  <Form.Control
                    className="profile-form-control"
                    type="text"
                    name="address.region"
                    value={formData.address.region}
                    onChange={handleInputChange}
                    placeholder={t('profile.regionPlaceholder', 'e.g., Stockholm County')}
                  />
                </Form.Group>

                {errors.address && (
                  <Alert variant="danger" className="profile-error-alert">
                    {errors.address}
                  </Alert>
                )}
              </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        {allowSkip && (
          <Button 
            variant="outline-secondary" 
            onClick={handleSkip}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                {t('profile.skipping', 'Skipping...')}
              </>
            ) : (
              t('profile.skipForNow', 'Skip for now')
            )}
          </Button>
        )}
        
        <Button
          type="submit"
          variant="primary"
          className="profile-submit-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              {t('profile.saving', 'Saving Profile...')}
            </>
          ) : (
            t('profile.completeProfile', 'Complete Profile')
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileCompletion;
