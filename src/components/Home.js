import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by auth state change
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="min-vh-100">
      <main>
        <section className="bg-primary bg-gradient text-white py-5">
          <div className="container text-center">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <h1 className="display-4 fw-bold mb-4">Welcome to Our Restaurant</h1>
                <p className="lead mb-4">Experience the finest dining with our carefully crafted menu and exceptional service.</p>
                {!currentUser && (
                  <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                    <button className="btn btn-light btn-lg px-4" onClick={handleRegister}>
                      Get Started
                    </button>
                    <button className="btn btn-outline-light btn-lg px-4" onClick={handleLogin}>
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-5">
          <div className="container">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="card h-100 text-center border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="display-6 mb-3">🍽️</div>
                    <h3 className="card-title">Exquisite Menu</h3>
                    <p className="card-text">Discover our carefully curated selection of dishes made with the finest ingredients.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 text-center border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="display-6 mb-3">👨‍🍳</div>
                    <h3 className="card-title">Expert Chefs</h3>
                    <p className="card-text">Our world-class chefs bring years of experience and passion to every dish.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 text-center border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="display-6 mb-3">🏠</div>
                    <h3 className="card-title">Cozy Atmosphere</h3>
                    <p className="card-text">Enjoy your meal in our warm, welcoming environment perfect for any occasion.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;