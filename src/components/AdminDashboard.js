import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useFood } from '@/contexts/FoodContext';
import UserManagement from '@/components/admin/UserManagement';
import FoodManagement from '@/components/admin/FoodManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import ContactManagement from '@/components/admin/ContactManagement';
import UserFeedbackManagement from '@/components/admin/UserFeedbackManagement';
import DashboardStats from '@/components/admin/DashboardStats';
import CampaignManagement from '@/components/admin/CampaignManagement';
import Loading from '@/components/Loading';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { users = [], orders = [], loading: adminLoading } = useAdmin();
  const { foods = [], loading: foodLoading } = useFood();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats users={users} foods={foods} orders={orders} />;
      case 'users':
        return <UserManagement />;
      case 'foods':
        return <FoodManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'contacts':
        return <ContactManagement />;
      case 'feedback':
        return <UserFeedbackManagement />;
      case 'campaigns':
        return <CampaignManagement />;
        
      default:
        return <DashboardStats users={users} foods={foods} orders={orders} />;
    }
  };

  // Show loading spinner while data is being fetched
  if (adminLoading || foodLoading) {
    return <Loading message="Loading admin dashboard..." height="100vh" />;
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold">🔧 Admin Dashboard</span>
          
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Welcome, {currentUser?.displayName || currentUser?.email}
            </span>
            <button className="btn btn-outline-light me-2" onClick={() => navigate('/dashboard')}>
              User Dashboard
            </button>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <nav className="col-md-3 col-lg-2 d-md-block bg-white sidebar collapse">
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    📊 Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    👥 Users ({users?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'foods' ? 'active' : ''}`}
                    onClick={() => setActiveTab('foods')}
                  >
                    🍽️ Food Items ({foods?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    📦 Orders ({orders?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'contacts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contacts')}
                  >
                    📞 Contact Info
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                  >
                    💬 User Feedback
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-start w-100 ${activeTab === 'campaigns' ? 'active' : ''}`}
                    onClick={() => setActiveTab('campaigns')}
                  >
                    🏳️ Campaigns
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
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