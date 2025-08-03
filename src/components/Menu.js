import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchMenuItems,
  clearError,
  setSearchTerm,
  setFilterCategory,
  setFilterAvailability,
} from "@/store/slices/menuSlice";
import {
  selectFilteredMenuItems,
  selectMenuCategories,
} from "@/store/selectors/menuSelectors";
import Loading from "@/components/Loading";
import MenuItemModal from "@/components/MenuItemModal";
import "@/styles/theme.css";

const Menu = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';
  const {
    loading,
    error,
    searchTerm,
    filterCategory,
    filterAvailability,
    menuItems,
  } = useSelector((state) => state.menu);

  const filteredMenuItems = useSelector(selectFilteredMenuItems);
  const categories = useSelector(selectMenuCategories);

  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Only fetch if menuItems don't exist in Redux store
    if (menuItems.length === 0) {
      dispatch(fetchMenuItems());
    }
  }, [dispatch, menuItems.length]);

  const handleErrorDismiss = () => {
    dispatch(clearError());
  };

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleCategoryChange = (e) => {
    dispatch(setFilterCategory(e.target.value));
  };

  const handleAvailabilityChange = (e) => {
    dispatch(setFilterAvailability(e.target.value));
  };

  // Helper functions to get localized content
  const getLocalizedText = (textObj, fallback = 'Unnamed Item') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj[currentLanguage] || textObj.english || textObj.swedish || fallback;
  };

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

  // Modal handlers
  const handleItemClick = (item) => {
    if (item.available) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const { t } = useTranslation();

  return (
    <>
      <div className="px-5 my-5">
        <h1 className="text-center mb-4 text-primary">{t('menu.title', 'MENU')}</h1>
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={handleErrorDismiss}
              aria-label={t('common.close', 'Close')}
            ></button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="row mb-4">
          <div className="col-md-4 p-2">
            <input
              type="text"
              className="form-control"
              placeholder={t('menu.searchPlaceholder', 'Search menu items...')}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="col-md-4 p-2">
            <select
              className="form-select"
              value={filterCategory}
              onChange={handleCategoryChange}
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category === "All" ? "all" : category}
                >
                  {category === "All" ? t('menu.filters.allCategories', 'All') : category}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4 p-2">
            <select
              className="form-select"
              value={filterAvailability}
              onChange={handleAvailabilityChange}
            >
              <option value="all">{t('menu.filters.all', 'All')}</option>
              <option value="available">{t('menu.filters.available', 'Available')}</option>
              <option value="unavailable">{t('menu.filters.unavailable', 'Unavailable')}</option>
            </select>
          </div>
        </div>

        {/* Menu Items */}
        {loading ? (
          <Loading message={t('menu.loading', 'Loading menu items...')} height="500px" />
        ) : (
          <div className="row g-4">
            {filteredMenuItems.length === 0 ? (
              <div className="col-12">
                <div className="text-center py-5">
                  <h5 className="text-muted">{t('menu.noItems', 'No menu items found')}</h5>
                  <p className="text-muted">
                    {t('menu.noItemsHint', 'Try adjusting your search or filter options.')}
                  </p>
                </div>
              </div>
            ) : (
              filteredMenuItems.map((item) => (
                <div key={item.id} className="col-md-6 col-lg-4">
                  <div
                    className="card h-100 border-0 shadow-lg"
                    style={{ cursor: "pointer", transition: "transform 0.2s" }}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-5px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    <div className="position-relative">
                      <img
                        src={item.image}
                        className="card-img-top"
                        alt={getLocalizedText(item.name)}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      {item.discount?.enabled && item.discount?.value > 0 && (
                        <div
                          className="position-absolute"
                          style={{ bottom: "15px", right: "10px" }}
                        >
                          <span className="badge bg-danger text-white px-4 py-3 rounded-pill shadow-lg fs-6">
                            {item.discount.value}% {t('menu.discount', 'OFF')}
                          </span>
                        </div>
                      )}
                      {item.originalPrice &&
                        item.originalPrice > item.price && (
                          <div
                            className="position-absolute"
                            style={{ bottom: "10px", right: "10px" }}
                          >
                            <span className="badge bg-danger text-white px-3 py-2 rounded-pill shadow-lg">
                              <i className="bi bi-tag-fill me-1"></i>
                              {t('menu.sale', 'SALE')}
                            </span>
                          </div>
                        )}
                    </div>
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title text-dark">{getLocalizedText(item.name)}</h5>
                        <span
                          className={`badge ${
                            item.available ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {item.available ? t('menu.status.available', 'Available') : t('menu.status.unavailable', 'Unavailable')}
                        </span>
                      </div>
                      <p className="card-text text-muted">{getLocalizedText(item.description, t('menu.noDescription', 'No description available'))}</p>
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <span className="h5 text-primary mb-0">
                              {formatPriceDisplay(item.price)}
                            </span>
                            {item.originalPrice &&
                              item.originalPrice > item.price && (
                                <small className="text-muted text-decoration-line-through">
                                  {item.originalPrice} SEK
                                </small>
                              )}
                          </div>
                          <small className="text-muted">{item.category}</small>
                        </div>
                        <div className="text-center">
                          <small className="text-muted">
                            <i className="bi bi-eye me-1"></i>
                            {t('menu.clickToView', 'Click to view details')}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Menu Item Modal */}
      <MenuItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  );
};

export default Menu;
