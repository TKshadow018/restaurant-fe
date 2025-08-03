import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const FoodModal = ({ show, onHide, food, onSave, categories }) => {
  const [formData, setFormData] = useState({
    name: {
      swedish: '',
      english: ''
    },
    description: {
      swedish: '',
      english: ''
    },
    price: [
      { volume: 'small', price: '' },
      { volume: 'medium', price: '' },
      { volume: 'large', price: '' }
    ],
    category: '',
    subCategory: '',
    image: '',
    available: true
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Safely get categories from Redux store with fallbacks
  const categoriesState = useSelector((state) => state.categories);
  const reduxCategories = categoriesState?.items || [];
  const categoriesStatus = categoriesState?.status || 'idle';
  
  // Use passed categories prop or fall back to Redux state
  const availableCategories = categories || reduxCategories || [];

  useEffect(() => {
    if (food) {
      // When editing an existing food item
      const categoryExists = availableCategories.some(
        (cat) => cat.name === food.category
      );

      // If the food's category exists, use it. Otherwise, default to the first available category.
      const categoryToSet = categoryExists
        ? food.category
        : availableCategories.length > 0
        ? availableCategories[0].name
        : '';

      // Handle price array - ensure we have at least 3 entries for small, medium, large
      const priceArray = Array.isArray(food.price) ? food.price : [];
      const formatPrice = (volume) => {
        const found = priceArray.find(p => p.volume === volume);
        return found ? found.price : '';
      };

      setFormData({
        name: {
          swedish: food.name?.swedish || '',
          english: food.name?.english || ''
        },
        description: {
          swedish: food.description?.swedish || '',
          english: food.description?.english || ''
        },
        price: [
          { volume: 'small', price: formatPrice('small') },
          { volume: 'medium', price: formatPrice('medium') },
          { volume: 'large', price: formatPrice('large') }
        ],
        category: categoryToSet,
        subCategory: food.subCategory || '',
        image: food.image || '',
        available: food.available !== undefined ? food.available : true
      });
      setImagePreview(food.image || '');
    } else {
      // For new food items, set the default category to the first available category
      // or empty string if no categories exist yet
      const defaultCategory = availableCategories.length > 0 ? availableCategories[0].name : '';
      
      setFormData({
        name: {
          swedish: '',
          english: ''
        },
        description: {
          swedish: '',
          english: ''
        },
        price: [
          { volume: 'small', price: '' },
          { volume: 'medium', price: '' },
          { volume: 'large', price: '' }
        ],
        category: defaultCategory,
        subCategory: '',
        image: '',
        available: true
      });
      setImagePreview('');
    }
  }, [food, availableCategories]);

  // Cleanup function to revoke object URLs
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clean up previous preview URL if it was a blob
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear the URL input when file is selected
      setFormData(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one price is provided
    const validPrices = formData.price
      .filter(p => p.price && p.price.trim() !== '')
      .map(p => ({
        volume: p.volume,
        price: p.price.toString() // Keep as string to match the data structure
      }));

    if (validPrices.length === 0) {
      alert('Please provide at least one price.');
      return;
    }

    // Validate that both languages have names and descriptions
    if (!formData.name.swedish.trim() || !formData.name.english.trim()) {
      alert('Please provide names in both Swedish and English.');
      return;
    }

    if (!formData.description.swedish.trim() || !formData.description.english.trim()) {
      alert('Please provide descriptions in both Swedish and English.');
      return;
    }

    // Handle image upload if file is selected
    let imageUrl = formData.image;
    if (imageFile) {
      try {
        setUploading(true);
        const storageRef = ref(storage, `food-images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        setUploading(false);
      } catch (error) {
        setUploading(false);
        alert('Failed to upload image. Please try again.');
        console.error('Image upload error:', error);
        return;
      }
    }

    // Validate that we have an image (either uploaded or URL)
    if (!imageUrl && !formData.image) {
      alert('Please provide an image (upload file or enter URL).');
      return;
    }

    const processedData = {
      ...formData,
      image: imageUrl,
      price: validPrices
    };
    
    onSave(processedData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('name.') || name.startsWith('description.')) {
      const [field, language] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [language]: value
        }
      }));
    } else if (name.startsWith('price.')) {
      const [field, index] = name.split('.');
      const priceIndex = parseInt(index);
      setFormData(prev => ({
        ...prev,
        price: prev.price.map((item, idx) => 
          idx === priceIndex ? { ...item, price: value } : item
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      
      // Update image preview when URL changes
      if (name === 'image') {
        setImagePreview(value);
        setImageFile(null); // Clear file selection if URL is entered
      }
    }
  };

  // Loading state for categories
  const isLoading = categoriesStatus === 'loading';

  // Debugging output to trace render state
  console.log('Render state:', {
    availableCategories: availableCategories.map(c => c.name),
    selectedCategory: formData.category,
    matchFound: availableCategories.some(c => c.name === formData.category)
  });

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{food ? 'Edit Food Item' : 'Add New Food Item'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Name Fields */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Name (Swedish)</Form.Label>
                <Form.Control
                  type="text"
                  name="name.swedish"
                  value={formData.name.swedish}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Name (English)</Form.Label>
                <Form.Control
                  type="text"
                  name="name.english"
                  value={formData.name.english}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          {/* Description Fields */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Description (Swedish)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description.swedish"
                  value={formData.description.swedish}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Description (English)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description.english"
                  value={formData.description.english}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          {/* Price Fields */}
          <Form.Group className="mb-3">
            <Form.Label>Prices (SEK)</Form.Label>
            <div className="row">
              <div className="col-md-4">
                <Form.Label className="text-muted small">Small</Form.Label>
                <Form.Control
                  type="number"
                  name="price.0"
                  value={formData.price[0]?.price || ''}
                  onChange={handleChange}
                  placeholder="Small price"
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="text-muted small">Medium</Form.Label>
                <Form.Control
                  type="number"
                  name="price.1"
                  value={formData.price[1]?.price || ''}
                  onChange={handleChange}
                  placeholder="Medium price"
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="text-muted small">Large</Form.Label>
                <Form.Control
                  type="number"
                  name="price.2"
                  value={formData.price[2]?.price || ''}
                  onChange={handleChange}
                  placeholder="Large price"
                />
              </div>
            </div>
            <Form.Text className="text-muted">
              Leave empty for sizes not available. At least one price is required.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            {isLoading ? (
              <div className="d-flex align-items-center">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Loading categories...</span>
              </div>
            ) : availableCategories.length > 0 ? (
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {/* Render a disabled placeholder option if category doesn't match */}
                {formData.category && !availableCategories.some(c => c.name === formData.category) && (
                  <option value="" disabled>
                    Selected category not found
                  </option>
                )}
                
                {/* Map through available categories */}
                {availableCategories.map(category => (
                  <option 
                    key={category.id} 
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            ) : (
              <div className="alert alert-warning">
                No categories found. Please add categories first.
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sub Category</Form.Label>
            <Form.Control
              type="text"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              placeholder="Enter sub category"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Image</Form.Label>
            
            {/* Image Upload Section */}
            <div className="mb-3">
              <Form.Label className="fw-bold">Upload Image File</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-2 d-flex align-items-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Uploading image...</span>
                </div>
              )}
            </div>

            {/* OR Divider */}
            <div className="text-center mb-3">
              <span className="text-muted">OR</span>
            </div>

            {/* Image URL Section */}
            <div className="mb-3">
              <Form.Label className="fw-bold">Image URL</Form.Label>
              <Form.Control
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="Enter image URL"
                disabled={!!imageFile || uploading}
              />
              <Form.Text className="text-muted">
                {imageFile ? 'File selected - URL input disabled' : 'Enter a direct image URL'}
              </Form.Text>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3">
                <Form.Label className="fw-bold">Preview</Form.Label>
                <div>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '200px', 
                      objectFit: 'cover',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="available"
              label="Available"
              checked={formData.available}
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={isLoading || availableCategories.length === 0 || uploading}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              <>{food ? 'Update' : 'Add'} Food Item</>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default FoodModal;