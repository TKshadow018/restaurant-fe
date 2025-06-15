import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '@/styles/theme.css';

const Navbar = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      if (onNavigate) onNavigate('home');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleNavigation = (key) => {
    if (onNavigate) onNavigate(key);
    // Close navbar collapse on mobile
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show');
    } else if (onNavigate && key === 'admin') {
      navigate(`/${key}`);
    }
  };

  // Check if user is admin
  const isAdmin = currentUser?.email === process.env.REACT_APP_ADMIN_EMAIL;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="px-5 container-fluid">
        <span className="navbar-brand fw-bold">🍽️ {process.env.REACT_APP_APP_TITLE}</span>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0"
                onClick={() => handleNavigation('home')}
              >
                Home
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0"
                onClick={() => handleNavigation('menu')}
              >
                Menu
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0"
                onClick={() => handleNavigation('campaign')}
              >
                Campaign
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0"
                onClick={() => handleNavigation('about')}
              >
                About Us
              </button>
            </li>
          </ul>
          
          <div className="navbar-nav ms-auto d-flex align-items-center">
            {currentUser ? (
              <>
                <span className="navbar-text text-white me-3">
                  Welcome, {currentUser?.displayName || currentUser?.email}
                </span>
                {isAdmin && (
                  <button
                    className="btn btn-warning me-2"
                    onClick={() => handleNavigation('admin')}
                  >
                    Admin Panel
                  </button>
                )}
                <button className="btn btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button 
                className="btn btn-success" 
                onClick={() => handleNavigation('login')}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;