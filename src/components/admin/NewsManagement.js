import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { db } from '../../firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { fetchNews } from '../../store/slices/newsSlice';
import '../../styles/AdminComponents.css';

const NewsManagement = () => {
  const dispatch = useDispatch();
  const { items: allNews, status, error: storeError } = useSelector((state) => state.news);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Form data for news item
  const [formData, setFormData] = useState({
    title: {
      english: '',
      swedish: ''
    },
    subtitle: {
      english: '',
      swedish: ''
    },
    isActive: true,
    priority: 1
  });

  // Fetch all news from Redux store
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchNews());
    }
  }, [dispatch, status]);

  // Refresh data after operations
  const refreshData = () => {
    dispatch(fetchNews());
  };

  // Filter news based on search term
  const filteredNews = allNews.filter(item => {
    const titleText = typeof item.title === 'string' 
      ? item.title 
      : `${item.title?.english || ''} ${item.title?.swedish || ''}`;
    const subtitleText = typeof item.subtitle === 'string' 
      ? item.subtitle 
      : `${item.subtitle?.english || ''} ${item.subtitle?.swedish || ''}`;
    
    return titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
           subtitleText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: {
        english: newsItem.title?.english || newsItem.title || '',
        swedish: newsItem.title?.swedish || ''
      },
      subtitle: {
        english: newsItem.subtitle?.english || newsItem.subtitle || '',
        swedish: newsItem.subtitle?.swedish || ''
      },
      isActive: newsItem.isActive ?? true,
      priority: newsItem.priority || 1
    });
    setShowModal(true);
  };

  const handleDelete = async (newsId) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await deleteDoc(doc(db, 'news', newsId));
        setError(null);
        refreshData(); // Refresh data after deletion
      } catch (err) {
        console.error('Error deleting news:', err);
        setError('Failed to delete news item');
      }
    }
  };

  const handleAddNew = () => {
    setEditingNews(null);
    setFormData({
      title: {
        english: '',
        swedish: ''
      },
      subtitle: {
        english: '',
        swedish: ''
      },
      isActive: true,
      priority: 1
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [field, lang] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [lang]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that we don't exceed 10 items when adding new
    if (!editingNews && allNews.length >= 10) {
      setError('Maximum of 10 news items allowed');
      return;
    }

    try {
      const newsData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editingNews) {
        // Update existing news
        await updateDoc(doc(db, 'news', editingNews.id), newsData);
      } else {
        // Add new news
        await addDoc(collection(db, 'news'), {
          ...newsData,
          createdAt: serverTimestamp()
        });
      }
      
      setShowModal(false);
      setEditingNews(null);
      setError(null);
      refreshData(); // Refresh data after save
    } catch (err) {
      console.error('Error saving news:', err);
      setError('Failed to save news item');
    }
  };

  const toggleActive = async (newsItem) => {
    try {
      await updateDoc(doc(db, 'news', newsItem.id), {
        isActive: !newsItem.isActive,
        updatedAt: serverTimestamp()
      });
      refreshData(); // Refresh data after status change
    } catch (err) {
      console.error('Error updating news status:', err);
      setError('Failed to update news status');
    }
  };

  if (status === 'loading') {
    return (
      <div className="news-loading-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">News & Announcements Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={handleAddNew}
          disabled={allNews.length >= 10}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add News Item ({allNews.length}/10)
        </button>
      </div>

      {(error || storeError) && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error || storeError}
        </Alert>
      )}

      {/* Search */}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search news items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* News Items */}
      <div className="row g-4">
        {filteredNews.length === 0 ? (
          <div className="col-12">
            <div className="text-center py-5">
              <h5 className="text-muted">No news items found</h5>
              <p className="text-muted">
                {allNews.length === 0 
                  ? "Create your first news item to display announcements in the marquee."
                  : "Try adjusting your search terms."
                }
              </p>
            </div>
          </div>
        ) : (
          filteredNews.map(newsItem => (
            <div key={newsItem.id} className="col-lg-6 col-xl-4">
              <div className={`card h-100 border-0 shadow-sm ${!newsItem.isActive ? 'opacity-75' : ''}`}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-info">Priority: {newsItem.priority}</span>
                    <span className={`badge ${newsItem.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {newsItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <h5 className="card-title">
                    {newsItem.title?.english || newsItem.title || 'Untitled'}
                  </h5>
                  {newsItem.title?.swedish && (
                    <h6 className="card-subtitle text-muted mb-2">
                      🇸🇪 {newsItem.title.swedish}
                    </h6>
                  )}
                  
                  {(newsItem.subtitle?.english || newsItem.subtitle) && (
                    <div className="mb-2">
                      <small className="text-muted">
                        {newsItem.subtitle?.english || newsItem.subtitle}
                      </small>
                      {newsItem.subtitle?.swedish && (
                        <small className="text-muted d-block">
                          🇸🇪 {newsItem.subtitle.swedish}
                        </small>
                      )}
                    </div>
                  )}

                  <div className="mt-auto">
                    <small className="text-muted d-block mb-2">
                      Created: {newsItem.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </small>
                    <div className="btn-group w-100" role="group">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleEdit(newsItem)}
                      >
                        <i className="bi bi-pencil me-1"></i>Edit
                      </button>
                      <button
                        className={`btn btn-sm ${newsItem.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => toggleActive(newsItem)}
                      >
                        <i className={`bi ${newsItem.isActive ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                        {newsItem.isActive ? 'Hide' : 'Show'}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(newsItem.id)}
                      >
                        <i className="bi bi-trash me-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* News Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingNews ? 'Edit News Item' : 'Add New News Item'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Title Fields */}
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Title (English) *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title.english"
                    value={formData.title.english}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Title (Swedish)</Form.Label>
                  <Form.Control
                    type="text"
                    name="title.swedish"
                    value={formData.title.swedish}
                    onChange={handleChange}
                    maxLength={100}
                  />
                </Form.Group>
              </div>
            </div>

            {/* Subtitle Fields */}
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Subtitle (English)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="subtitle.english"
                    value={formData.subtitle.english}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Subtitle (Swedish)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="subtitle.swedish"
                    value={formData.subtitle.swedish}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </Form.Group>
              </div>
            </div>

            {/* Priority and Status */}
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Priority (1-10, lower number = higher priority)</Form.Label>
                  <Form.Control
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    min={1}
                    max={10}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isActive"
                    label="Active (show in marquee)"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingNews ? 'Update' : 'Add'} News Item
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default NewsManagement;
