import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/contexts/CartContext";

// Add custom styles for animations
const modalStyles = `
  @keyframes slideInUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform:                         {item.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="ingredient-tag text-white px-3 py-2 rounded-pill shadow-sm fw-medium"
                            style={{
                              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                              color: "#8b4513 !important",
                              fontSize: "0.85rem",
                              cursor: "default"
                            }}
                          >
                            {ingredient}
                          </span>
                        ))};
      opacity: 1;
    }
  }

  @keyframes pulse {
    0% {
      transform: rotate(-10deg) scale(1);
    }
    50% {
      transform: rotate(-10deg) scale(1.05);
    }
    100% {
      transform: rotate(-10deg) scale(1);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .modal-content-custom {
    animation: slideInUp 0.4s ease-out;
  }

  .ingredient-tag:hover {
    transform: translateY(-2px) scale(1.05);
    transition: all 0.3s ease;
  }

  .nutrition-card:hover {
    transform: translateY(-3px);
    transition: all 0.3s ease;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = modalStyles;
  document.head.appendChild(styleSheet);
}

const MenuItemModal = ({ item, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVolume, setSelectedVolume] = useState(null);
  const { addToCart } = useCart();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language === "sv" ? "swedish" : "english";

  // Helper function to get localized content
  const getLocalizedText = (textObj, fallback = "Unnamed Item") => {
    if (typeof textObj === "string") return textObj;
    if (!textObj) return fallback;
    return (
      textObj[currentLanguage] || textObj.english || textObj.swedish || fallback
    );
  };

  // Helper function to get available volumes and their prices
  const getAvailableVolumes = (price) => {
    if (Array.isArray(price) && price.length > 0) {
      return price.filter((p) => p.price && p.price !== "");
    }
    return [
      {
        volume: "normal",
        price:
          typeof price === "string" ? price.replace(/[^0-9.]/g, "") : price,
      },
    ];
  };

  const availableVolumes = useMemo(() => {
    return item ? getAvailableVolumes(item.price) : [];
  }, [item?.price]);

  // Initialize selected volume on component mount or when item changes
  useEffect(() => {
    if (availableVolumes.length > 0) {
      setSelectedVolume(availableVolumes[0].volume);
    }
  }, [item?.id]); // Reset when item changes

  // Update selected volume if current selection is no longer available
  useEffect(() => {
    if (
      selectedVolume &&
      !availableVolumes.some((v) => v.volume === selectedVolume)
    ) {
      if (availableVolumes.length > 0) {
        setSelectedVolume(availableVolumes[0].volume);
      }
    }
  }, [availableVolumes, selectedVolume]);

  // Early return after all hooks have been called
  if (!isOpen || !item) return null;

  // Helper function to get the price for the selected volume
  const getCurrentPrice = () => {
    if (!selectedVolume) return 0;
    const volumePrice = availableVolumes.find(
      (v) => v.volume === selectedVolume
    );
    return volumePrice ? parseFloat(volumePrice.price) || 0 : 0;
  };

  const itemPrice = getCurrentPrice();

  // Helper function to format volume display names
  const formatVolumeName = (volume) => {
    const volumeNames = {
      small: currentLanguage === "swedish" ? "Liten" : "Small",
      medium: currentLanguage === "swedish" ? "Mellan" : "Medium",
      large: currentLanguage === "swedish" ? "Stor" : "Large",
      normal: currentLanguage === "swedish" ? "Normal" : "Normal",
    };
    return volumeNames[volume] || volume;
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      image: item.image,
      selectedVolume: selectedVolume,
      selectedPrice: itemPrice,
      quantity: quantity,
      totalPrice: (itemPrice * quantity).toFixed(2),
    };

    addToCart(cartItem);
    setQuantity(1);

    // Reset to first available volume for next time
    if (availableVolumes.length > 0) {
      setSelectedVolume(availableVolumes[0].volume);
    }
    onClose();
  };

  const totalPrice = (itemPrice * quantity).toFixed(2);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered mx-2 mx-md-auto">
        <div className="modal-content modal-content-custom border-0 shadow-lg" style={{ borderRadius: "20px", overflow: "hidden" }}>
          <div className="modal-header border-0 position-relative" style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}>
            <h5 className="modal-title fw-bold fs-4 text-white">
              {getLocalizedText(item.name)}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
              style={{
                filter: "brightness(0) invert(1)",
                transform: "scale(1.2)"
              }}
            ></button>
          </div>
          <div className="modal-body p-0">
            <div className="row g-0">
              {/* Image Section */}
              <div className="col-md-6">
                <div className="position-relative" style={{ height: "100%" }}>
                  <img
                    src={item.image}
                    className="img-fluid w-100 d-none d-md-block"
                    alt={getLocalizedText(item.name)}
                    style={{ 
                      height: "300px", 
                      objectFit: "cover",
                      filter: "brightness(1.1) contrast(1.1)"
                    }}
                  />
                  <img
                    src={item.image}
                    className="img-fluid w-100 d-md-none"
                    alt={getLocalizedText(item.name)}
                    style={{ 
                      height: "200px", 
                      objectFit: "cover",
                      filter: "brightness(1.1) contrast(1.1)"
                    }}
                  />
                  {/* Overlay gradient */}
                  <div 
                    className="position-absolute w-100 h-100"
                    style={{
                      top: 0,
                      left: 0,
                      background: "linear-gradient(45deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)",
                      pointerEvents: "none"
                    }}
                  ></div>
                  {/* Discount Badge */}
                  {item.discount?.enabled && item.discount?.value > 0 && (
                    <div
                      className="position-absolute"
                      style={{ top: "20px", right: "20px" }}
                    >
                      <span className="badge text-white px-4 py-3 shadow-lg fs-5 fw-bold" style={{
                        background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                        borderRadius: "25px",
                        border: "3px solid white",
                        transform: "rotate(-10deg)",
                        animation: "pulse 2s infinite"
                      }}>
                        {item.discount.value}% OFF
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="col-md-6">
                <div className="p-2 p-md-4" style={{ background: "linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)" }}>
                  <div className="mb-2 mb-md-4">
                    <span className="text-white border-0 px-4 py-2 rounded-pill shadow-sm fw-bold" style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      fontSize: "0.9rem"
                    }}>
                      {item.category}
                    </span>
                  </div>
                  {/* Price Section */}
                  <div className="mb-2 mb-md-4">
                    <div className="d-flex align-items-center gap-2 gap-md-3 mb-2 mb-md-3 flex-wrap">
                      {item.originalPrice && item.originalPrice > itemPrice && (
                        <div className="text-muted text-decoration-line-through fs-4 fw-bold" style={{
                          background: "rgba(255,0,0,0.1)",
                          padding: "8px 16px",
                          borderRadius: "12px",
                          border: "2px dashed #dc3545"
                        }}>
                          {item.originalPrice} SEK
                        </div>
                      )}
                      <div className="text-white fs-4 fs-md-3 fw-bold px-2 px-md-4 py-1 py-md-2 rounded-pill shadow-sm" style={{
                        background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
                      }}>
                        {itemPrice} SEK
                      </div>
                    </div>
                    {item.discount?.enabled && item.discount?.value > 0 && (
                      <div className="alert alert-success border-0 py-2 px-3 rounded-pill" style={{
                        background: "linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(32,201,151,0.1) 100%)",
                        border: "2px solid rgba(40,167,69,0.3) !important"
                      }}>
                        <i className="bi bi-tag-fill me-2"></i>
                        <strong>{t('menu.modal.youSave', 'You save')}{" "}
                        {(
                          (item.originalPrice || itemPrice) - itemPrice
                        ).toFixed(2)}{" "}
                        SEK!</strong>
                      </div>
                    )}
                  </div>
                  {/* Size/Volume Selector */}
                  {availableVolumes.length > 1 && (
                    <div className="mb-2 mb-md-4">
                      <h6 className="fw-bold mb-2 mb-md-3 fs-6" style={{ color: "#667eea" }}>
                        <i className="bi bi-rulers me-2"></i>
                        {t('menu.modal.size', 'Size:')}
                      </h6>
                      <div className="btn-group w-100 shadow-sm" role="group" style={{ borderRadius: "15px", overflow: "hidden" }}>
                        {availableVolumes.map((volumeOption) => (
                          <button
                            key={volumeOption.volume}
                            type="button"
                            className={`btn border-0 ${
                              selectedVolume === volumeOption.volume
                                ? "text-white"
                                : "bg-white text-primary"
                            }`}
                            style={{
                              background: selectedVolume === volumeOption.volume 
                                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                                : "white",
                              borderRadius: "0",
                              transition: "all 0.3s ease",
                              transform: selectedVolume === volumeOption.volume ? "scale(1.05)" : "scale(1)",
                              zIndex: selectedVolume === volumeOption.volume ? 2 : 1
                            }}
                            onClick={() =>
                              setSelectedVolume(volumeOption.volume)
                            }
                          >
                            <div className="d-flex flex-column align-items-center py-1 py-md-2">
                              <span className="fw-bold fs-6 small">
                                {formatVolumeName(volumeOption.volume)}
                              </span>
                              <small className={selectedVolume === volumeOption.volume ? "text-white-50" : "text-muted"} style={{ fontSize: "0.7rem" }}>
                                {volumeOption.price} SEK
                              </small>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Ingredients/Features (if available) */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="mb-2 mb-md-4 d-none d-md-block">
                      <h6 className="fw-bold mb-3" style={{ color: "#667eea" }}>
                        <i className="bi bi-list-ul me-2"></i>
                        {t('menu.modal.ingredients', 'Ingredients:')}
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {item.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="text-white px-3 py-2 rounded-pill shadow-sm fw-medium ingredient-tag"
                            style={{
                              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                              color: "#8b4513 !important",
                              fontSize: "0.85rem"
                            }}
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Nutritional Info (if available) */}
                  {item.nutrition && (
                    <div className="mb-2 mb-md-4 d-none d-md-block">
                      <h6 className="fw-bold mb-3" style={{ color: "#667eea" }}>
                        <i className="bi bi-heart-pulse me-2"></i>
                        {t('menu.modal.nutritionalInfo', 'Nutritional Info:')}
                      </h6>
                      <div className="row g-3">
                        {item.nutrition.calories && (
                          <div className="col-6">
                            <div className="text-center p-3 rounded-3 shadow-sm nutrition-card" style={{
                              background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                            }}>
                              <div className="fw-bold text-dark fs-5">{item.nutrition.calories}</div>
                              <small className="text-muted">{t('menu.modal.calories', 'Calories')}</small>
                            </div>
                          </div>
                        )}
                        {item.nutrition.protein && (
                          <div className="col-6">
                            <div className="text-center p-3 rounded-3 shadow-sm nutrition-card" style={{
                              background: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
                            }}>
                              <div className="fw-bold text-dark fs-5">{item.nutrition.protein}g</div>
                              <small className="text-muted">{t('menu.modal.protein', 'Protein')}</small>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {item.available && (
                    <div className="mb-2 mb-md-4">
                      <h6 className="fw-bold mb-2 mb-md-3 fs-6" style={{ color: "#667eea" }}>
                        <i className="bi bi-123 me-2"></i>
                        {t('menu.modal.quantity', 'Quantity:')}
                      </h6>
                      <div className="d-flex align-items-center justify-content-center gap-2 gap-md-4 p-1 rounded-4 shadow-sm" style={{
                        background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
                        border: "2px solid rgba(102,126,234,0.2)"
                      }}>
                        <button
                          className="btn text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ 
                            width: "40px", 
                            height: "40px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            transition: "all 0.3s ease"
                          }}
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                        >
                          <i className="bi bi-dash fw-bold fs-5"></i>
                        </button>
                        <div className="text-center px-2 px-md-4">
                          <div className="fw-bold fs-4 fs-md-3 mb-1" style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text"
                          }}>
                            {quantity}
                          </div>
                        </div>
                        <button
                          className="btn text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ 
                            width: "40px", 
                            height: "40px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            transition: "all 0.3s ease"
                          }}
                          onClick={() => handleQuantityChange(1)}
                          onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                        >
                          <i className="bi bi-plus fw-bold fs-5"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-0 p-2 p-md-4 m-2 m-md-3 rounded-4 shadow-sm" style={{
            background: "linear-gradient(135deg, #f8f9ff 0%, #e8f4f8 100%)",
            border: "2px dashed rgba(102,126,234,0.3) !important"
          }}>
            <div className="d-flex align-items-start gap-2 gap-md-3">
              <i className="bi bi-info-circle-fill fs-5 fs-md-4" style={{ color: "#667eea" }}></i>
              <p className="text-muted mb-0 fw-medium" style={{ lineHeight: "1.7", fontSize: "0.9rem" }}>
                {getLocalizedText(item.description, "No description available")}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-0 pt-0 pb-2 pb-md-4 px-2 px-md-4">
            <div className="w-100 d-flex gap-2 gap-md-3 flex-column flex-md-row">
              <button
                type="button"
                className="btn btn-outline-secondary border-2 px-3 px-md-4 py-2 py-md-3 rounded-pill fw-bold"
                onClick={onClose}
                style={{
                  borderColor: "#6c757d",
                  transition: "all 0.3s ease",
                  fontSize: "0.9rem"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#6c757d";
                  e.target.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#6c757d";
                }}
              >
                <i className="bi bi-x-lg me-1 me-md-2"></i>
                <span className="d-none d-md-inline">{t('menu.modal.close', 'Close')}</span>
                <span className="d-md-none">Close</span>
              </button>
              {item.available ? (
                <button
                  type="button"
                  className="btn text-white flex-grow-1 border-0 px-3 px-md-4 py-2 py-md-3 rounded-pill fw-bold shadow-lg"
                  onClick={handleAddToCart}
                  style={{
                    background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                    fontSize: "0.9rem",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
                >
                  <i className="bi bi-cart-plus me-1 me-md-2"></i>
                  <span className="d-none d-md-inline">
                    {t('menu.modal.addToCart', 'Add to Cart')}{" "}
                    {availableVolumes.length > 1
                      ? `(${formatVolumeName(selectedVolume)})`
                      : ""}{" "}
                    - <span className="fw-bold fs-5">{totalPrice} SEK</span>
                  </span>
                  <span className="d-md-none">
                    Add - <span className="fw-bold">{totalPrice} SEK</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary flex-grow-1 border-0 px-3 px-md-4 py-2 py-md-3 rounded-pill fw-bold"
                  disabled
                  style={{
                    background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                    fontSize: "0.9rem"
                  }}
                >
                  <i className="bi bi-exclamation-triangle me-1 me-md-2"></i>
                  <span className="d-none d-md-inline">{t('menu.modal.currentlyUnavailable', 'Currently Unavailable')}</span>
                  <span className="d-md-none">Unavailable</span>
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
