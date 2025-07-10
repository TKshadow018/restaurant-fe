import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const FoodModal = ({ show, onHide, food, onSave, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subCategory: '',
    image: '',
    available: true
  });

  // Safely get categories from Redux store with fallbacks
  const categoriesState = useSelector((state) => state.categories);
  const reduxCategories = categoriesState?.items || [];
  const categoriesStatus = categoriesState?.status || 'idle';
  
  // Use passed categories prop or fall back to Redux state
  const availableCategories = categories || reduxCategories || [];

  useEffect(() => {
    if (food) {
      setFormData({
        name: food.name || '',
        description: food.description || '',
        price: food.price || '',
        category: food.category || '',
        subCategory: food.subCategory || '',
        image: food.image || '',
        available: food.available !== undefined ? food.available : true
      });
    } else {
      // For new food items, set the default category to the first available category
      // or empty string if no categories exist yet
      const defaultCategory = availableCategories.length > 0 ? availableCategories[0].name : '';
      
      setFormData({
        name: '',
        description: '',
        price: '',
        category: defaultCategory,
        subCategory: '',
        image: '',
        available: true
      });
    }
  }, [food, availableCategories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: parseFloat(formData.price)
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Loading state for categories
  const isLoading = categoriesStatus === 'loading';

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{food ? 'Edit Food Item' : 'Add New Food Item'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Price ($)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
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
                {availableCategories.map(category => (
                  <option key={category.id} value={category.name}>
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
            <Form.Label>Image URL</Form.Label>
            <Form.Control
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
            />
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
            disabled={isLoading || availableCategories.length === 0}
          >
            {food ? 'Update' : 'Add'} Food Item
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default FoodModal;