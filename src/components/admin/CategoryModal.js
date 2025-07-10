import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs
} from 'firebase/firestore';
import { db } from '@/firebase/config';

const CategoryModal = ({ show, onHide, categories }) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!show) {
      // Reset form when modal closes
      setNewCategory('');
      setEditingCategory(null);
      setEditCategoryName('');
      setError(null);
      setSuccess(null);
    }
  }, [show]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      // Check if category already exists
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
      );
      
      if (existingCategory) {
        setError('Category already exists');
        return;
      }

      await addDoc(collection(db, 'categories'), {
        name: newCategory.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setNewCategory('');
      setSuccess('Category added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryName.trim() || !editingCategory) return;

    try {
      setLoading(true);
      setError(null);

      // Check if category name already exists (excluding current)
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === editCategoryName.trim().toLowerCase() && 
               cat.id !== editingCategory.id
      );
      
      if (existingCategory) {
        setError('Category name already exists');
        return;
      }

      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: editCategoryName.trim(),
        updatedAt: new Date()
      });

      setEditingCategory(null);
      setEditCategoryName('');
      setSuccess('Category updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if any foods are using this category
      const foodsSnapshot = await getDocs(collection(db, 'foods'));
      const foodsUsingCategory = foodsSnapshot.docs.some(doc => 
        doc.data().category === categoryName
      );

      if (foodsUsingCategory) {
        setError('Cannot delete category that is being used by food items. Please update or delete those food items first.');
        return;
      }

      await deleteDoc(doc(db, 'categories', categoryId));
      setSuccess('Category deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName('');
    setError(null);
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-tags me-2" viewBox="0 0 16 16">
                <path d="M3 2v4.586l7 7L14.586 9l-7-7H3zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2z"/>
                <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1v5.086z"/>
              </svg>
              Manage Categories
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger alert-dismissible" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            )}
            
            {success && (
              <div className="alert alert-success alert-dismissible" role="alert">
                {success}
                <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
              </div>
            )}

            {/* Add New Category */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Add New Category</h6>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddCategory}>
                  <div className="row align-items-end">
                    <div className="col-md-8">
                      <label htmlFor="newCategory" className="form-label">Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="newCategory"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter category name"
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-4">
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={loading || !newCategory.trim()}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Adding...
                          </>
                        ) : (
                          'Add Category'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Existing Categories */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Existing Categories ({categories.length})</h6>
              </div>
              <div className="card-body">
                {categories.length === 0 ? (
                  <p className="text-muted text-center py-3">No categories found</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {categories.map((category) => (
                      <div key={category.id} className="list-group-item px-0">
                        {editingCategory?.id === category.id ? (
                          <form onSubmit={handleUpdateCategory}>
                            <div className="row align-items-end">
                              <div className="col-md-6">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  disabled={loading}
                                  autoFocus
                                />
                              </div>
                              <div className="col-md-6">
                                <div className="btn-group w-100">
                                  <button 
                                    type="submit" 
                                    className="btn btn-success btn-sm"
                                    disabled={loading || !editCategoryName.trim()}
                                  >
                                    Save
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm"
                                    onClick={cancelEdit}
                                    disabled={loading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{category.name}</h6>
                              <small className="text-muted">
                                Created: {category.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                              </small>
                            </div>
                            <div className="btn-group">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEditCategory(category)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;