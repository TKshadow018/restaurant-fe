import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useAdminData from '../hooks/useAdminData';
import UserManagement from '@/components/admin/UserManagement';
import FoodManagement from '@/components/admin/FoodManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import ContactManagement from '@/components/admin/ContactManagement';
import UserFeedbackManagement from '@/components/admin/UserFeedbackManagement';
import DashboardStats from '@/components/admin/DashboardStats';
import CampaignManagement from '@/components/admin/CampaignManagement';
import NewsManagement from '@/components/admin/NewsManagement';
import DeliveryToggle from '@/components/DeliveryToggle';
import Loading from '@/components/Loading';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [highlightOrderId, setHighlightOrderId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Changed to track open state instead of collapsed
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { 
    users, 
    orders, 
    foods, 
    isLoading,
    loadAdminData 
  } = useAdminData();

  // Handle navigation from notifications
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.highlightOrderId) {
      setHighlightOrderId(location.state.highlightOrderId);
      // Clear highlight after 5 seconds
      setTimeout(() => setHighlightOrderId(null), 5000);
    }
  }, [location.state]);

  // Load admin data when component mounts
  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'users':
        return <UserManagement />;
      case 'foods':
        return <FoodManagement />;
      case 'orders':
        return <OrderManagement highlightOrderId={highlightOrderId} />;
      case 'contacts':
        return <ContactManagement />;
      case 'feedback':
        return <UserFeedbackManagement />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'news':
        return <NewsManagement />;
        
      default:
        return <DashboardStats />;
    }
  };

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return <Loading message="Loading admin dashboard..." height="100vh" />;
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container-fluid">
          <button
            className="btn btn-outline-light d-md-none me-2"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
          <span className="navbar-brand fw-bold">🔧 Admin Dashboard</span>
          
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3 d-none d-sm-inline">
              Welcome, {currentUser?.displayName || currentUser?.email}
            </span>
            <div className="me-3">
              <DeliveryToggle />
            </div>
            <button className="btn btn-outline-light me-2" onClick={() => navigate('/dashboard')}>
              <i className="bi bi-house d-md-none"></i>
              <span className="d-none d-md-inline">User Dashboard</span>
            </button>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right d-md-none"></i>
              <span className="d-none d-md-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid p-0">
        <div className="row g-0">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div 
              className="d-md-none mobile-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <nav className={`bg-white admin-sidebar col-md-3 col-lg-2 ${
            sidebarOpen ? 'mobile-sidebar d-block' : 'd-none'
          } d-md-block`}>
            <div className="pt-3">
              <ul className="nav flex-column">
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => handleTabChange('dashboard')}
                  >
                    📊 Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => handleTabChange('users')}
                  >
                    👥 Users ({users?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'foods' ? 'active' : ''}`}
                    onClick={() => handleTabChange('foods')}
                  >
                    🍽️ Food Items ({foods?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => handleTabChange('orders')}
                  >
                    📦 Orders ({orders?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'contacts' ? 'active' : ''}`}
                    onClick={() => handleTabChange('contacts')}
                  >
                    📞 Contact Info
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => handleTabChange('feedback')}
                  >
                    💬 User Feedback
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'campaigns' ? 'active' : ''}`}
                    onClick={() => handleTabChange('campaigns')}
                  >
                    🏳️ Campaigns
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'news' ? 'active' : ''}`}
                    onClick={() => handleTabChange('news')}
                  >
                    📰 News & Notices
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="col-12 col-md-9 ms-md-auto col-lg-10 px-3 px-md-4">
            <div className="pt-3 pb-2 mb-3">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;