import React, { useState, useEffect } from "react";
import Banner from "../Banner";
import CampaignModal from "./CampaignModal";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useSelector } from "react-redux";

const CampaignManagement = () => {
  // Get food list from Redux
  const foods = useSelector((state) => state.menu.menuItems);

  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  // Fetch banners from Firestore in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "campaigns"), 
      (snapshot) => {
        setBanners(
          snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error('Error in real-time listener:', err);
        setError('Failed to sync campaigns');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Function to generate multilingual duration from campaign dates
  const generateDuration = (startDate, endDate) => {
    if (!startDate && !endDate) {
      return {
        swedish: "",
        english: ""
      };
    }

    const formatDate = (dateString, language) => {
      if (!dateString) return "";
      
      const date = new Date(dateString);
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      if (language === 'swedish') {
        return date.toLocaleDateString('sv-SE', options);
      } else {
        return date.toLocaleDateString('en-US', options);
      }
    };

    if (startDate && endDate) {
      return {
        swedish: `${formatDate(startDate, 'swedish')} - ${formatDate(endDate, 'swedish')}`,
        english: `${formatDate(startDate, 'english')} - ${formatDate(endDate, 'english')}`
      };
    } else if (startDate) {
      return {
        swedish: `Från ${formatDate(startDate, 'swedish')}`,
        english: `From ${formatDate(startDate, 'english')}`
      };
    } else if (endDate) {
      return {
        swedish: `Till ${formatDate(endDate, 'swedish')}`,
        english: `Until ${formatDate(endDate, 'english')}`
      };
    }
  };

  // Filter campaigns based on search and status
  const filteredBanners = banners.filter(banner => {
    // Handle multilingual title search
    const titleText = typeof banner.title === 'string' 
      ? banner.title 
      : `${banner.title?.swedish || ''} ${banner.title?.english || ''}`;
    
    const matchesSearch = titleText.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by active status based on dates
    let matchesFilter = true;
    if (filterActive !== 'all') {
      const now = new Date();
      const startDate = banner.campainStartDate ? new Date(banner.campainStartDate) : null;
      const endDate = banner.campainEndDate ? new Date(banner.campainEndDate) : null;
      
      if (filterActive === 'active') {
        matchesFilter = (!startDate || startDate <= now) && (!endDate || endDate >= now);
      } else if (filterActive === 'upcoming') {
        matchesFilter = startDate && startDate > now;
      } else if (filterActive === 'expired') {
        matchesFilter = endDate && endDate < now;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleEdit = (banner) => {
    setEditingCampaign(banner);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteDoc(doc(db, "campaigns", id));
        setError(null);
      } catch (err) {
        console.error('Error deleting campaign:', err);
        setError('Failed to delete campaign');
      }
    }
  };

  const handleAddNew = () => {
    setEditingCampaign(null);
    setShowModal(true);
  };

  const handleSaveCampaign = async (campaignData) => {
    try {
      if (editingCampaign) {
        // Update existing campaign
        await updateDoc(doc(db, "campaigns", editingCampaign.id), campaignData);
      } else {
        // Add new campaign
        await addDoc(collection(db, "campaigns"), campaignData);
      }
      
      setShowModal(false);
      setEditingCampaign(null);
      setError(null);
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError('Failed to save campaign');
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
        <h1 className="h2">Campaign Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={handleAddNew}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg me-2" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
          </svg>
          Add New Campaign
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
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
          >
            <option value="all">All Campaigns</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="row g-4">
        {filteredBanners.length === 0 ? (
          <div className="col-12">
            <div className="text-center py-5">
              <h5 className="text-muted">No campaigns found</h5>
              <p className="text-muted">Try adjusting your search or add a new campaign.</p>
            </div>
          </div>
        ) : (
          filteredBanners.map(banner => {
            // Helper function to get display title
            const getDisplayTitle = (title) => {
              if (typeof title === 'string') return title;
              return title?.english || title?.swedish || 'Untitled Campaign';
            };

            // Helper function to get display subtitle
            const getDisplaySubtitle = (subtitle) => {
              if (typeof subtitle === 'string') return subtitle;
              return subtitle?.english || subtitle?.swedish || '';
            };

            // Helper function to determine campaign status
            const getCampaignStatus = () => {
              const now = new Date();
              const startDate = banner.campainStartDate ? new Date(banner.campainStartDate) : null;
              const endDate = banner.campainEndDate ? new Date(banner.campainEndDate) : null;
              
              if (startDate && startDate > now) return { text: 'Upcoming', class: 'bg-info' };
              if (endDate && endDate < now) return { text: 'Expired', class: 'bg-secondary' };
              return { text: 'Active', class: 'bg-success' };
            };

            const status = getCampaignStatus();

            return (
              <div key={banner.id} className="col-lg-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="position-relative">
                    <img 
                      src={banner.image} 
                      className="card-img-top" 
                      alt={getDisplayTitle(banner.title)}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 end-0 m-2">
                      <span className={`badge ${status.class}`}>
                        {status.text}
                      </span>
                      {banner.isMain && (
                        <span className="badge bg-warning text-dark ms-1">
                          Main
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{getDisplayTitle(banner.title)}</h5>
                    {getDisplaySubtitle(banner.subtitle) && (
                      <h6 className="card-subtitle text-muted mb-2">{getDisplaySubtitle(banner.subtitle)}</h6>
                    )}
                    
                    <div className="mb-2">
                      {banner.campainStartDate && (
                        <small className="text-muted d-block">
                          <strong>Start:</strong> {new Date(banner.campainStartDate).toLocaleDateString()}
                        </small>
                      )}
                      {banner.campainEndDate && (
                        <small className="text-muted d-block">
                          <strong>End:</strong> {new Date(banner.campainEndDate).toLocaleDateString()}
                        </small>
                      )}
                      {banner.couponCode && (
                        <small className="text-muted d-block">
                          <strong>Coupon:</strong> <span className="badge bg-success">{banner.couponCode}</span>
                        </small>
                      )}
                      {banner.discountType && banner.couponCode && (
                        <small className="text-muted d-block">
                          <strong>Discount:</strong> {
                            banner.discountType === 'percentage' 
                              ? `${banner.discountPercentage || 0}%`
                              : `${banner.discountFixedAmount || 0} SEK`
                          }
                        </small>
                      )}
                      {banner.minimumOrderAmount > 0 && (
                        <small className="text-muted d-block">
                          <strong>Min Order:</strong> {banner.minimumOrderAmount} SEK
                        </small>
                      )}
                      {banner.maxUsagesPerUser && (
                        <small className="text-muted d-block">
                          <strong>Max Uses:</strong> {banner.maxUsagesPerUser} per user
                        </small>
                      )}
                    </div>

                    <div className="mt-auto">
                      <div className="btn-group w-100" role="group">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEdit(banner)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(banner.id)}
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

      {/* Campaign Modal */}
      <CampaignModal
        show={showModal}
        onHide={() => setShowModal(false)}
        campaign={editingCampaign}
        onSave={handleSaveCampaign}
      />
    </div>
  );
};

export default CampaignManagement;