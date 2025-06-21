import React, { useState, useEffect } from 'react';
import { useFood } from '@/contexts/FoodContext';
import FoodModal from '@/components/admin/FoodModal';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

const FoodManagement = () => {
  const { foods, deleteFood, updateFood, setFoods } = useFood();
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['All Categories', 'Appetizer', 'Main Course', 'Dessert', 'Beverage'];

  // Load foods from Firebase on component mount
  useEffect(() => {
    const loadFoodsFromFirebase = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'foods'));
        const foodsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFoods(foodsData);
        setError(null);
      } catch (err) {
        console.error('Error loading foods:', err);
        setError('Failed to load food items');
      } finally {
        setLoading(false);
      }
    };

    loadFoodsFromFirebase();

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      collection(db, 'foods'),
      (querySnapshot) => {
        const foodsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFoods(foodsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error in real-time listener:', err);
        setError('Failed to sync food items');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setFoods]);

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || food.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (food) => {
    setEditingFood(food);
    setShowModal(true);
  };

  const handleDelete = async (foodId) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        await deleteDoc(doc(db, 'foods', foodId));
        // The real-time listener will update the UI automatically
      } catch (err) {
        console.error('Error deleting food:', err);
        setError('Failed to delete food item');
      }
    }
  };

  const handleAddNew = () => {
    setEditingFood(null);
    setShowModal(true);
  };

  const toggleAvailability = async (food) => {
    try {
      await updateDoc(doc(db, 'foods', food.id), {
        available: !food.available
      });
      // The real-time listener will update the UI automatically
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability');
    }
  };

  const handleSaveFood = async (foodData) => {
    try {
      if (editingFood) {
        // Update existing food
        await updateDoc(doc(db, 'foods', editingFood.id), {
          ...foodData,
          updatedAt: new Date()
        });
      } else {
        // Add new food
        await addDoc(collection(db, 'foods'), {
          ...foodData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      setShowModal(false);
      setEditingFood(null);
      setError(null);
    } catch (err) {
      console.error('Error saving food:', err);
      setError('Failed to save food item');
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
        <h1 className="h2">Food Management</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Add New Food
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

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Appetizer">Appetizer</option>
            <option value="Main Course">Main Course</option>
            <option value="Dessert">Dessert</option>
            <option value="Beverage">Beverage</option>
          </select>
        </div>
      </div>

      {/* Food Grid */}
      <div className="row g-4">
        {filteredFoods.length === 0 ? (
          <div className="col-12">
            <div className="text-center py-5">
              <h5 className="text-muted">No food items found</h5>
              <p className="text-muted">Try adjusting your search or add a new food item.</p>
            </div>
          </div>
        ) : (
          filteredFoods.map(food => (
            <div key={food.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <img 
                  src={food.image} 
                  className="card-img-top" 
                  alt={food.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">{food.name}</h5>
                    <span className={`badge ${food.available ? 'bg-success' : 'bg-secondary'}`}>
                      {food.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="card-text text-muted">{food.description}</p>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="h5 text-primary mb-0">${food.price}</span>
                      <small className="text-muted">{food.category}</small>
                    </div>
                    <div className="btn-group w-100" role="group">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleEdit(food)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${food.available ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => toggleAvailability(food)}
                      >
                        {food.available ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(food.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Food Modal */}
      <FoodModal
        show={showModal}
        onHide={() => setShowModal(false)}
        food={editingFood}
        onSave={handleSaveFood}
      />
    </div>
  );
};

export default FoodManagement;