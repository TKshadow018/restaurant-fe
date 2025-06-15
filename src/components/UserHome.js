import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserHome = ({ isAdmin }) => {
  const navigate = useNavigate();

  return (
    <main className="container my-5">
      <div className="row g-4">
        <div className="col-md-6 col-lg-3">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="display-6 text-primary mb-3">📦</div>
              <h5 className="card-title">Orders</h5>
              <p className="card-text text-muted">Manage your restaurant orders</p>
              <div className="mt-3">
                <span className="display-6 fw-bold text-primary">24</span>
                <div className="small text-muted">Active Orders</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="display-6 text-success mb-3">📋</div>
              <h5 className="card-title">Menu</h5>
              <p className="card-text text-muted">Update your restaurant menu</p>
              <div className="mt-3">
                <span className="display-6 fw-bold text-success">45</span>
                <div className="small text-muted">Menu Items</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="display-6 text-info mb-3">👥</div>
              <h5 className="card-title">Customers</h5>
              <p className="card-text text-muted">View customer information</p>
              <div className="mt-3">
                <span className="display-6 fw-bold text-info">312</span>
                <div className="small text-muted">Total Customers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="display-6 text-warning mb-3">💰</div>
              <h5 className="card-title">Revenue</h5>
              <p className="card-text text-muted">Track your earnings</p>
              <div className="mt-3">
                <span className="display-6 fw-bold text-warning">$2,450</span>
                <div className="small text-muted">This Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="alert alert-info">
              <h5>👨‍💼 Admin Access</h5>
              <p className="mb-2">
                You have admin privileges. Access the admin dashboard to manage users, food items, and orders.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                Go to Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserHome;