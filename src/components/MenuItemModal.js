import React, { useState } from 'react';

const MenuItemModal = ({ item, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !item) return null;

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    onAddToCart({
      ...item,
      quantity: quantity,
      totalPrice: (item.price * quantity).toFixed(2)
    });
    setQuantity(1);
    onClose();
  };

  const totalPrice = (item.price * quantity).toFixed(2);

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title text-primary fw-bold">{item.name}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body p-0">
            <div className="row g-0">
              {/* Image Section */}
              <div className="col-md-6">
                <div className="position-relative">
                  <img
                    src={item.image}
                    className="img-fluid w-100"
                    alt={item.name}
                    style={{ height: '350px', objectFit: 'cover' }}
                  />
                  {/* Discount Badge */}
                  {item.discount?.enabled && item.discount?.value > 0 && (
                    <div className="position-absolute" style={{ top: '15px', right: '15px' }}>
                      <span className="badge bg-danger text-white px-3 py-2 rounded-pill shadow-lg fs-6">
                        {item.discount.value}% OFF
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="col-md-6">
                <div className="p-4">
                  <div className="mb-3">
                    <span className="bg-light text-secondary border px-3 py-2">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-muted mb-4" style={{ lineHeight: '1.6' }}>
                    {item.description}
                  </p>

                  {/* Price Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <h3 className="text-primary mb-0">${item.price}</h3>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <small className="text-muted text-decoration-line-through fs-5">
                          ${item.originalPrice}
                        </small>
                      )}
                    </div>
                    {item.discount?.enabled && item.discount?.value > 0 && (
                      <small className="text-success">
                        You save ${((item.originalPrice || item.price) - item.price).toFixed(2)}!
                      </small>
                    )}
                  </div>

                  {/* Ingredients/Features (if available) */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-secondary mb-2">Ingredients:</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {item.ingredients.map((ingredient, index) => (
                          <span key={index} className="bg-light text-secondary border p-2 rounded">
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nutritional Info (if available) */}
                  {item.nutrition && (
                    <div className="mb-4">
                      <h6 className="text-secondary mb-2">Nutritional Info:</h6>
                      <div className="row g-2">
                        {item.nutrition.calories && (
                          <div className="col-6">
                            <small className="text-muted">Calories: {item.nutrition.calories}</small>
                          </div>
                        )}
                        {item.nutrition.protein && (
                          <div className="col-6">
                            <small className="text-muted">Protein: {item.nutrition.protein}g</small>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  {item.available && (
                    <div className="mb-4">
                      <h6 className="text-secondary mb-2">Quantity:</h6>
                      <div className="d-flex align-items-center gap-3">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <span className="fw-bold fs-5 px-3">{quantity}</span>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleQuantityChange(1)}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Total Price */}
                  {item.available && quantity > 1 && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <span className="text-secondary fw-bold">Total:</span>
                        <span className="text-primary fw-bold fs-4">${totalPrice}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-0 pt-0">
            <div className="w-100 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Close
              </button>
              {item.available ? (
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1"
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-cart-plus me-2"></i>
                  Add to Cart - ${totalPrice}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary flex-grow-1"
                  disabled
                >
                  Currently Unavailable
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;