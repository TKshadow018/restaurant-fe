import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import Loading from "@/components/Loading";
import FeedbackModal from "@/components/FeedbackModal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContactInfo,
  setContactInfo,
  clearError,
} from "@/store/slices/contactSlice";
import { useTranslation } from "react-i18next";

const ContactUs = () => {
  const { t, i18n } = useTranslation(); // Add i18n to get current language
  const dispatch = useDispatch();
  const { contactInfo, loading, error } = useSelector(
    (state) => state.contact
  );

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    // Only fetch if contactInfo doesn't exist in Redux store
    if (!contactInfo) {
      dispatch(fetchContactInfo());
    }

    // Set up real-time listener for updates
    const unsubscribe = onSnapshot(
      collection(db, "contacts"),
      (querySnapshot) => {
        if (querySnapshot.docs.length > 0) {
          const contactData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data(),
          };
          // Update Redux store with real-time data
          dispatch(setContactInfo(contactData));
        }
      },
      (err) => {
        console.error("Error in real-time listener:", err);
      }
    );

    return () => unsubscribe();
  }, [dispatch, contactInfo]);

  const formatBusinessHours = (hours) => {
    if (!hours) return null;
    return hours.split("\n").map((line, index) => (
      <p key={index} className="text-muted mb-1">
        {line}
      </p>
    ));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Validate required fields
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.subject ||
        !formData.message
      ) {
        throw new Error(t('contact.messages.requiredFields'));
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error(t('contact.messages.invalidEmail'));
      }

      // Save to Firebase
      const docRef = await addDoc(collection(db, "contact-messages"), {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        isDisabled: false,
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString(),
      });

      console.log("Message saved with ID: ", docRef.id);

      // Reset form and show success
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setSubmitSuccess(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setSubmitError(
        err.message || t('contact.messages.submitError')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const handleErrorDismiss = () => {
    dispatch(clearError());
  };

  if (loading) {
    return <Loading message={t('contact.messages.loadingContact')} height="100vh" />;
  }

  return (
    <>
      <div className="container-fluid py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h1 className="display-4 fw-bold mb-3 text-primary">
                  {t('contact.title')}
                </h1>
                <p className="lead text-secondary">
                  {t('contact.subtitle')}
                </p>
              </div>
            </div>
          </div>
          {error && (
            <div
              className="alert alert-warning alert-dismissible fade show"
              role="alert"
            >
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={handleErrorDismiss}
                aria-label="Close"
              ></button>
            </div>
          )}
          {/* Success/Error Feedback Modal */}
          <FeedbackModal
            isSuccess={submitSuccess}
            message={
              submitSuccess
                ? t('contact.messages.success')
                : submitError
            }
            onClose={handleModalClose}
          />

          <div className="row g-4">
            {/* Contact Information Card */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-lg h-100">
                <div className="card-body p-4">
                  <h3 className="card-title mb-4 text-primary">{t('contact.getInTouch')}</h3>

                  {/* Address */}
                  <div className="d-flex align-items-start mb-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-circle p-3 bg-primary text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="currentColor"
                          className="bi bi-geo-alt"
                          viewBox="0 0 16 16"
                        >
                          <path d="m12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z" />
                          <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-1 text-dark">{t('contact.address')}</h5>
                      <p className="mb-0 text-muted">{contactInfo?.address}</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-start mb-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-circle p-3 bg-primary text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="currentColor"
                          className="bi bi-phone"
                          viewBox="0 0 16 16"
                        >
                          <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z" />
                          <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-1 text-dark">{t('contact.phone')}</h5>
                      <a
                        href={`tel:${contactInfo?.phone}`}
                        className="text-decoration-none text-primary"
                      >
                        {contactInfo?.phone}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="d-flex align-items-start mb-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-circle p-3 bg-primary text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="currentColor"
                          className="bi bi-envelope"
                          viewBox="0 0 16 16"
                        >
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-1 text-dark">{t('contact.email')}</h5>
                      <a
                        href={`mailto:${contactInfo?.email}`}
                        className="text-decoration-none text-primary"
                      >
                        {contactInfo?.email}
                      </a>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0">
                      <div className="rounded-circle p-3 bg-primary text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="currentColor"
                          className="bi bi-clock"
                          viewBox="0 0 16 16"
                        >
                          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-1 text-dark">{t('contact.businessHours')}</h5>
                      {contactInfo?.businessHours ? (
                        <div>
                          {formatBusinessHours(contactInfo.businessHours)}
                        </div>
                      ) : (
                        <div>
                          <p className="mb-1 text-muted">
                            {t('contact.defaultHours.monday')}
                          </p>
                          <p className="mb-1 text-muted">
                            {t('contact.defaultHours.saturday')}
                          </p>
                          <p className="mb-0 text-muted">
                            {t('contact.defaultHours.sunday')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Media Links */}
                  {(contactInfo?.socialMedia?.facebook ||
                    contactInfo?.socialMedia?.instagram ||
                    contactInfo?.socialMedia?.twitter) && (
                    <div className="d-flex align-items-start mt-4">
                      <div className="flex-shrink-0">
                        <div className="rounded-circle p-3 bg-primary text-white">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            className="bi bi-share"
                            viewBox="0 0 16 16"
                          >
                            <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5 className="mb-2 text-dark">{t('contact.followUs')}</h5>
                        <div className="d-flex gap-2 flex-wrap">
                          {contactInfo?.socialMedia?.facebook && (
                            <a
                              href={contactInfo.socialMedia.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary text-decoration-none"
                            >
                              📘 Facebook
                            </a>
                          )}
                          {contactInfo?.socialMedia?.instagram && (
                            <a
                              href={contactInfo.socialMedia.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary text-decoration-none"
                            >
                              📷 Instagram
                            </a>
                          )}
                          {contactInfo?.socialMedia?.twitter && (
                            <a
                              href={contactInfo.socialMedia.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary text-decoration-none"
                            >
                              🐦 Twitter
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-lg h-100">
                <div className="card-body p-4">
                  <h3 className="card-title mb-4 text-primary">
                    {t('contact.sendMessage')}
                  </h3>
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label
                          htmlFor="firstName"
                          className="form-label text-dark"
                        >
                          {t('contact.form.firstName')} {t('contact.form.required')}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-6">
                        <label
                          htmlFor="lastName"
                          className="form-label text-dark"
                        >
                          {t('contact.form.lastName')} {t('contact.form.required')}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="email" className="form-label text-dark">
                          {t('contact.form.email')} {t('contact.form.required')}
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="phone" className="form-label text-dark">
                          {t('contact.form.phone')}
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-12">
                        <label
                          htmlFor="subject"
                          className="form-label text-dark"
                        >
                          {t('contact.form.subject')} {t('contact.form.required')}
                        </label>
                        <select
                          className="form-select"
                          id="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          disabled={submitting}
                        >
                          <option value="">{t('contact.form.subjects.choose')}</option>
                          <option value="reservation">
                            {t('contact.form.subjects.reservation')}
                          </option>
                          <option value="feedback">{t('contact.form.subjects.feedback')}</option>
                          <option value="catering">
                            {t('contact.form.subjects.catering')}
                          </option>
                          <option value="general">{t('contact.form.subjects.general')}</option>
                          <option value="other">{t('contact.form.subjects.other')}</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label
                          htmlFor="message"
                          className="form-label text-dark"
                        >
                          {t('contact.form.message')} {t('contact.form.required')}
                        </label>
                        <textarea
                          className="form-control"
                          id="message"
                          rows="4"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          placeholder={t('contact.form.messagePlaceholder')}
                          disabled={submitting}
                        ></textarea>
                      </div>
                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg w-100"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t('contact.form.sending')}
                            </>
                          ) : (
                            t('contact.form.sendButton')
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* Google Maps */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-0">
                  <h3 className="card-title p-4 mb-0 text-primary">{t('contact.findUs')}</h3>
                  <div
                    className="map-container"
                    style={{ height: "400px", position: "relative" }}
                  >
                    <iframe
                      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2131.8181843147266!2d11.968582316073845!3d57.69718398108996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x464ff30b3b7f3f3f%3A0x4c9b9b9b9b9b9b9b!2s${encodeURIComponent(
                        contactInfo?.address || ""
                      )}!5e0!3m2!1s${i18n.language}!2s${i18n.language === 'sv' ? 'se' : 'us'}!4v1234567890123!5m2!1s${i18n.language}!2s${i18n.language === 'sv' ? 'se' : 'us'}`}
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${contactInfo?.name || process.env.REACT_APP_APP_TITLE} ${t('contact.findUs')}`}
                    ></iframe>

                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                      style={{ zIndex: -1 }}
                    >
                      <div className="text-center">
                        <div
                          className="spinner-border mb-3 text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">
                            {t('contact.messages.loadingMap')}
                          </span>
                        </div>
                        <p className="text-muted">{t('contact.messages.loadingMap')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
