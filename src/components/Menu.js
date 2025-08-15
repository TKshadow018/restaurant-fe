import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
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
import "@/styles/menu.css";

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
  
  // Auto-apply campaign state
  const [activeAutoApplyCampaign, setActiveAutoApplyCampaign] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    // Only fetch if menuItems don't exist in Redux store
    if (menuItems.length === 0) {
      dispatch(fetchMenuItems());
    }
  }, [dispatch, menuItems.length]);

  // Check for active auto-apply campaigns
  useEffect(() => {
    const checkAutoApplyCampaigns = async () => {
      try {
        const now = new Date();
        const campaignsRef = collection(db, "campaigns");
        const q = query(
          campaignsRef,
          where("autoApplyOnMenu", "==", true),
          where("hasTimeRestriction", "==", true)
        );
        
        const querySnapshot = await getDocs(q);
        const campaigns = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Find the first valid auto-apply campaign
        for (const campaign of campaigns) {
          if (isValidAutoApplyCampaign(campaign, now)) {
            setActiveAutoApplyCampaign(campaign);
            // Store in localStorage for cart to access
            localStorage.setItem('autoApplyCampaign', JSON.stringify(campaign));
            return;
          }
        }
        
        // No valid campaign found
        setActiveAutoApplyCampaign(null);
        localStorage.removeItem('autoApplyCampaign');
      } catch (error) {
        console.error('Error checking auto-apply campaigns:', error);
      }
    };

    checkAutoApplyCampaigns();
    // Check every minute for time-based campaigns
    const interval = setInterval(checkAutoApplyCampaigns, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to validate if a campaign is currently valid
  const isValidAutoApplyCampaign = (campaign, currentTime) => {
    // Check date range
    if (campaign.campainStartDate && new Date(campaign.campainStartDate) > currentTime) {
      return false;
    }
    if (campaign.campainEndDate && new Date(campaign.campainEndDate) < currentTime) {
      return false;
    }

    // Check time restrictions
    if (campaign.hasTimeRestriction) {
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = campaign.startTime.split(':').map(Number);
      const [endHour, endMinute] = campaign.endTime.split(':').map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > endTimeInMinutes) {
        return false;
      }

      // Check day of week
      const currentDay = currentTime.getDay();
      if (campaign.daysOfWeek && !campaign.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    return true;
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterAvailability]);

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

  // Calculate discounted price for an item if auto-apply campaign is active
  const getDiscountedPrice = (item) => {
    if (!activeAutoApplyCampaign || !activeAutoApplyCampaign.couponCode) {
      return null;
    }

    // Check if item is eligible for the campaign
    if (activeAutoApplyCampaign.eligibleDishes && 
        activeAutoApplyCampaign.eligibleDishes.length > 0 && 
        !activeAutoApplyCampaign.eligibleDishes.includes(item.id)) {
      return null;
    }

    let originalPrice;
    if (typeof item.price === 'number') {
      originalPrice = item.price;
    } else if (typeof item.price === 'string') {
      originalPrice = parseFloat(item.price);
    } else if (Array.isArray(item.price) && item.price.length > 0) {
      const validPrices = item.price.filter(p => p.price && p.price !== '');
      if (validPrices.length === 0) return null;
      originalPrice = parseFloat(validPrices[0].price);
    } else {
      return null;
    }

    if (isNaN(originalPrice)) return null;

    let discountedPrice;
    if (activeAutoApplyCampaign.discountType === 'percentage') {
      const discountAmount = (originalPrice * (activeAutoApplyCampaign.discountPercentage || 0)) / 100;
      discountedPrice = originalPrice - discountAmount;
    } else {
      discountedPrice = originalPrice - (activeAutoApplyCampaign.discountFixedAmount || 0);
    }

    return Math.max(0, discountedPrice); // Ensure price doesn't go negative
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

  // Pagination logic
  const totalItems = filteredMenuItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredMenuItems.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of menu section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            className={`btn ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'} mx-1`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show pagination with ellipsis for large number of pages
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        buttons.push(
          <button key={1} className="btn btn-outline-primary mx-1" onClick={() => handlePageChange(1)}>
            1
          </button>
        );
        if (startPage > 2) {
          buttons.push(<span key="ellipsis1" className="mx-2">...</span>);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        buttons.push(
          <button
            key={i}
            className={`btn ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'} mx-1`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          buttons.push(<span key="ellipsis2" className="mx-2">...</span>);
        }
        buttons.push(
          <button key={totalPages} className="btn btn-outline-primary mx-1" onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </button>
        );
      }
    }

    return buttons;
  };

  const { t } = useTranslation();

  return (
    <>
      <div className="px-5 mt-2 mb-3">
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
        <div className="row mb-1">
          <div className="col-md-4 p-2">
            <label className="form-label text-muted small mb-1">
              <i className="bi bi-search me-1"></i>
              {t('menu.searchLabel', 'Search Menu')}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t('menu.searchPlaceholder', 'Search menu items...')}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="col-md-4 p-2">
            <label className="form-label text-muted small mb-1">
              <i className="bi bi-grid-3x3-gap me-1"></i>
              {t('menu.categoryLabel', 'Food Category')}
            </label>
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
            <label className="form-label text-muted small mb-1">
              <i className="bi bi-check-circle me-1"></i>
              {t('menu.availabilityLabel', 'Availability Status')}
            </label>
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
          <>
            {/* Results count */}
            {filteredMenuItems.length > 0 && (
              <div className="row mb-1">
                <div className="col-12">
                  <p className="text-muted mb-4px">
                    {t('menu.pagination.showing')} {startIndex + 1}-{Math.min(endIndex, totalItems)} {t('menu.pagination.of')} {totalItems} {t('menu.pagination.items')}
                    {currentPage > 1 && ` (${t('menu.pagination.page')} ${currentPage} ${t('menu.pagination.of')} ${totalPages})`}
                  </p>
                </div>
              </div>
            )}
            
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
                currentItems.map((item) => {
                  const discountedPrice = getDiscountedPrice(item);
                  const hasAutoDiscount = discountedPrice !== null;
                  
                  return (
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
                      {/* Auto-apply campaign discount badge */}
                      {hasAutoDiscount && (
                        <div
                          className="position-absolute"
                          style={{ top: "10px", left: "10px" }}
                        >
                          <span className="badge bg-primary text-white px-3 py-2 rounded-pill shadow-lg">
                            <i className="bi bi-lightning-fill me-1"></i>
                            {t('menu.autoApplied', 'Auto Applied!')}
                          </span>
                        </div>
                      )}
                      {/* Existing discount badge */}
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
                            {hasAutoDiscount ? (
                              <>
                                <span className="h5 text-success mb-0">
                                  {discountedPrice.toFixed(2)} SEK
                                </span>
                                <small className="text-muted text-decoration-line-through">
                                  {formatPriceDisplay(item.price)}
                                </small>
                              </>
                            ) : (
                              <>
                                <span className="h5 text-primary mb-0">
                                  {formatPriceDisplay(item.price)}
                                </span>
                                {item.originalPrice &&
                                  item.originalPrice > item.price && (
                                    <small className="text-muted text-decoration-line-through">
                                      {item.originalPrice} SEK
                                    </small>
                                  )}
                              </>
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
              );
            })
            )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex justify-content-center align-items-center">
                    <nav aria-label="Menu pagination">
                      <div className="d-flex align-items-center">
                        {/* Previous button */}
                        <button
                          className="btn btn-outline-primary me-2"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i> {t('menu.pagination.previous')}
                        </button>
                        
                        {/* Page numbers */}
                        {renderPaginationButtons()}
                        
                        {/* Next button */}
                        <button
                          className="btn btn-outline-primary ms-2"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          {t('menu.pagination.next')} <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
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
