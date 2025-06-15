import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  query 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import Loading from '@/components/Loading';
import '@/styles/theme.css';

const UserFeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    subject: 'all'
  });

  useEffect(() => {
    const q = query(collection(db, 'contact-messages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const feedbackList = [];
      querySnapshot.forEach((doc) => {
        feedbackList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setFeedbacks(feedbackList);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedbacks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleFeedbackStatus = async (feedbackId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'contact-messages', feedbackId), {
        isDisabled: !currentStatus
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      setError('Failed to update feedback status');
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteDoc(doc(db, 'contact-messages', feedbackId));
      } catch (error) {
        console.error('Error deleting feedback:', error);
        setError('Failed to delete feedback');
      }
    }
  };

  const viewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const statusMatch = filters.status === 'all' || 
      (filters.status === 'active' && !feedback.isDisabled) ||
      (filters.status === 'disabled' && feedback.isDisabled);
    
    const subjectMatch = filters.subject === 'all' || feedback.subject === filters.subject;
    
    return statusMatch && subjectMatch;
  });

  const getStatusBadge = (isDisabled) => {
    return isDisabled ? 'bg-secondary' : 'bg-success';
  };

  const getStatusText = (isDisabled) => {
    return isDisabled ? 'Disabled' : 'Active';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(feedbacks.map(f => f.subject))];
    return subjects.filter(subject => subject);
  };

  if (loading) {
    return <Loading message="Loading feedbacks..." height="500px" />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary fw-bold mb-0">User Feedback Management</h2>
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

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-secondary fw-bold">Filter by Status:</label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-secondary fw-bold">Filter by Subject:</label>
                  <select
                    className="form-select"
                    value={filters.subject}
                    onChange={(e) => setFilters({...filters, subject: e.target.value})}
                  >
                    <option value="all">All Subjects</option>
                    {getUniqueSubjects().map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Feedbacks Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {filteredFeedbacks.length === 0 ? (
                <div className="text-center py-5">
                  <h5 className="text-secondary">No feedbacks found</h5>
                  <p className="text-secondary">No feedback messages match your current filters.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFeedbacks.map((feedback) => (
                        <tr key={feedback.id}>
                          <td className="text-secondary fw-bold">
                            {feedback.firstName} {feedback.lastName}
                          </td>
                          <td className="text-secondary">{feedback.email}</td>
                          <td className="text-secondary">{feedback.subject}</td>
                          <td className="text-secondary">{formatDate(feedback.createdAt)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(feedback.isDisabled)}`}>
                              {getStatusText(feedback.isDisabled)}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => viewFeedback(feedback)}
                                title="View Details"
                              >
                                👁 View
                              </button>
                              <button
                                className={`btn btn-sm ${feedback.isDisabled ? 'btn-success' : 'btn-secondary'}`}
                                onClick={() => toggleFeedbackStatus(feedback.id, feedback.isDisabled)}
                                title={feedback.isDisabled ? 'Enable' : 'Disable'}
                              >
                                {feedback.isDisabled ? '✓ Enable' : '⚠ Disable'}
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteFeedback(feedback.id)}
                                title="Delete"
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Details Modal */}
      {showModal && selectedFeedback && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title text-primary fw-bold">Feedback Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong className="text-secondary">Name:</strong>
                    <p className="text-secondary">{selectedFeedback.firstName} {selectedFeedback.lastName}</p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-secondary">Email:</strong>
                    <p className="text-secondary">{selectedFeedback.email}</p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-secondary">Phone:</strong>
                    <p className="text-secondary">{selectedFeedback.phone || 'Not provided'}</p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-secondary">Subject:</strong>
                    <p className="text-secondary">{selectedFeedback.subject}</p>
                  </div>
                  <div className="col-12">
                    <strong className="text-secondary">Message:</strong>
                    <p className="text-secondary">{selectedFeedback.message}</p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-secondary">Date:</strong>
                    <p className="text-secondary">{formatDate(selectedFeedback.createdAt)}</p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-secondary">Status:</strong>
                    <span className={`badge ${getStatusBadge(selectedFeedback.isDisabled)}`}>
                      {getStatusText(selectedFeedback.isDisabled)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={`btn ${selectedFeedback.isDisabled ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => {
                    toggleFeedbackStatus(selectedFeedback.id, selectedFeedback.isDisabled);
                    setShowModal(false);
                  }}
                >
                  {selectedFeedback.isDisabled ? 'Enable Feedback' : 'Disable Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFeedbackManagement;