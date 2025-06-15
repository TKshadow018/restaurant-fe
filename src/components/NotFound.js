import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="mb-4">Page Not Found</h2>
        <p className="lead mb-4">The page you are looking for doesn't exist.</p>
        <button className="btn btn-primary btn-lg" onClick={handleBackHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;