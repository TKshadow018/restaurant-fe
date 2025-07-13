import React, { useState, useEffect, useRef } from 'react'; // Add useRef
import { useFood } from '@/contexts/FoodContext';
import FoodModal from '@/components/admin/FoodModal';
import CategoryModal from '@/components/admin/CategoryModal'; // New import
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  writeBatch // Import writeBatch for bulk operations
} from 'firebase/firestore';
import { db } from '@/firebase/config';

const FoodManagement = () => {
  const { foods, deleteFood, updateFood, setFoods } = useFood();
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false); // New state
  const [editingFood, setEditingFood] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // State for bulk upload
  const fileInputRef = useRef(null); // Ref for the hidden file input

  // Load categories from Firebase
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories. Please check your connection and try again.');
        // Don't set hardcoded fallback categories - just keep the categories empty
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();

    // Set up real-time listener for categories
    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (querySnapshot) => {
        try {
          const categoriesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCategories(categoriesData);
          setError(null);
        } catch (listenerErr) {
          console.error('Error processing categories from listener:', listenerErr);
          // Don't change categories on error - keep whatever was last successful
        } finally {
          setCategoriesLoading(false);
        }
      },
      (err) => {
        console.error('Error in categories real-time listener:', err);
        setError('Error getting updates for categories: ' + err.message);
        setCategoriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
    // Handle multilingual name search
    const nameText = typeof food.name === 'string' 
      ? food.name 
      : `${food.name?.swedish || ''} ${food.name?.english || ''}`;
    
    const matchesSearch = nameText.toLowerCase().includes(searchTerm.toLowerCase());
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

  // New function to handle category management
  const handleManageCategories = () => {
    setShowCategoryModal(true);
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

  const handleBulkUploadClick = () => {
    // Trigger the hidden file input
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Invalid file type. Please upload a JSON file.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const itemsToUpload = JSON.parse(e.target.result);
        if (!Array.isArray(itemsToUpload)) {
          throw new Error('JSON file must contain an array of food items.');
        }

        // Use a batch write for efficiency
        const batch = writeBatch(db);
        let uploadedCount = 0;

        itemsToUpload.forEach(item => {
          // Basic validation to skip malformed items
          const hasValidName = item.name && (
            (typeof item.name === 'string') ||
            (item.name.swedish || item.name.english)
          );
          
          if (!hasValidName || !item.category || !item.price) {
            console.warn('Skipping invalid item:', item);
            return;
          }

          // Process the price data based on new structure
          let processedPrice = [];
          if (Array.isArray(item.price)) {
            // New structure: array of price objects
            processedPrice = item.price.filter(p => p.price && p.price !== '');
          } else if (typeof item.price === 'string' && item.price.includes('/')) {
            // Legacy structure: "69/119/139 SEK" format
            const prices = item.price.replace(' SEK', '').split('/');
            const volumes = ['small', 'medium', 'large'];
            processedPrice = prices.map((price, index) => ({
              volume: volumes[index] || 'normal',
              price: price.trim()
            }));
          } else {
            // Single price value
            const priceValue = typeof item.price === 'string' 
              ? item.price.replace(/[^0-9.]/g, '') 
              : item.price.toString();
            processedPrice = [{ volume: 'normal', price: priceValue }];
          }

          // Process names and descriptions
          const processedName = typeof item.name === 'string' 
            ? { english: item.name, swedish: item.name }
            : item.name;

          const processedDescription = typeof item.description === 'string'
            ? { english: item.description, swedish: item.description }
            : item.description || { english: '', swedish: '' };

          const newFoodDocRef = doc(collection(db, 'foods'));
          batch.set(newFoodDocRef, {
            name: processedName,
            description: processedDescription,
            price: processedPrice,
            category: item.category,
            subCategory: item.subCategory || '',
            image: item.image || 'https://via.placeholder.com/300x200.png?text=No+Image',
            available: item.available !== undefined ? item.available : true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          uploadedCount++;
        });

        await batch.commit();
        alert(`${uploadedCount} items uploaded successfully! The list will now refresh.`);

      } catch (err) {
        console.error('Error processing or uploading bulk data:', err);
        setError(`Failed to upload bulk data: ${err.message}`);
      } finally {
        setIsUploading(false);
        // Reset file input to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file.');
      setIsUploading(false);
    };

    reader.readAsText(file);
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
        <div className="d-flex gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/json"
            style={{ display: 'none' }}
          />
          {/* Bulk Upload Button */}
          <button 
            className="btn btn-success" 
            onClick={handleBulkUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-upload me-2" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
                Bulk Upload
              </>
            )}
          </button>
          <button className="btn btn-outline-secondary" onClick={handleManageCategories}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-tags me-2" viewBox="0 0 16 16">
              <path d="M3 2v4.586l7 7L14.586 9l-7-7H3zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2z"/>
              <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1v5.086z"/>
            </svg>
            Manage Categories
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleAddNew}
            disabled={categories.length === 0}
            title={categories.length === 0 ? "Please add categories first" : ""}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg me-2" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
            </svg>
            Add New Food
          </button>
        </div>
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
        {/* Categories Dropdown */}
        <div className="col-md-6">
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            disabled={categoriesLoading}
          >
            <option value="all">All Categories</option>
            {categories.length > 0 ? (
              categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))
            ) : !categoriesLoading && (
              <option value="" disabled>No categories available</option>
            )}
          </select>
          {categories.length === 0 && !categoriesLoading && (
            <small className="text-danger d-block mt-1">
              No categories found. Please add some categories first.
            </small>
          )}
          {categoriesLoading && (
            <small className="text-muted d-block mt-1">
              Loading categories...
            </small>
          )}
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
          filteredFoods.map(food => {
            // Helper function to get display name
            const getDisplayName = (name) => {
              if (typeof name === 'string') return name;
              return name?.english || name?.swedish || 'Unnamed Item';
            };

            // Helper function to get display description
            const getDisplayDescription = (description) => {
              if (typeof description === 'string') return description;
              return description?.english || description?.swedish || 'No description';
            };

            // Helper function to format price display
            const formatPriceDisplay = (price) => {
              if (typeof price === 'number') return `${price} SEK`;
              if (typeof price === 'string') return `${price} SEK`;
              if (Array.isArray(price) && price.length > 0) {
                const validPrices = price.filter(p => p.price && p.price !== '');
                if (validPrices.length === 0) return 'No price set';
                if (validPrices.length === 1) return `${validPrices[0].price} SEK`;
                return `${validPrices[0].price}-${validPrices[validPrices.length - 1].price} SEK`;
              }
              return 'No price set';
            };

            return (
            <div key={food.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <img 
                  src={food.image} 
                  className="card-img-top" 
                  alt={getDisplayName(food.name)}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">{getDisplayName(food.name)}</h5>
                    <span className={`badge ${food.available ? 'bg-success' : 'bg-secondary'}`}>
                      {food.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="card-text text-muted">{getDisplayDescription(food.description)}</p>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="h5 text-primary mb-0">{formatPriceDisplay(food.price)}</span>
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
            );
          })
        )}
      </div>

      {/* Food Modal */}
      <FoodModal
        show={showModal}
        onHide={() => setShowModal(false)}
        food={editingFood}
        onSave={handleSaveFood}
        categories={categories} // Pass categories to FoodModal
      />

      {/* Category Modal */}
      <CategoryModal
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        categories={categories}
      />
    </div>
  );
};

export default FoodManagement;