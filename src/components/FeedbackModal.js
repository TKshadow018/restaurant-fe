import React from 'react';
import '@/styles/theme.css';

const FeedbackModal = ({ isSuccess, message, onClose }) => {
  const show = Boolean(isSuccess || message);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title text-primary fw-bold">
              {isSuccess ? (
                <>
                  <span className="me-2">✓</span>
                  Success!
                </>
              ) : (
                <>
                  <span className="me-2">⚠</span>
                  Error
                </>
              )}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p className="mb-0 text-secondary">{message}</p>
          </div>
          <div className="modal-footer border-0">
            <button 
              type="button"
              className="btn btn-primary"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;