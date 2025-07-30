import React from 'react';

const DashboardStats = ({ users, foods, orders }) => {
  const activeUsers = users.filter(user => user.isActive).length;
  const availableFoods = foods.filter(food => food.available).length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  return (
    <div>
      <h1 className="h2 mb-4">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">👥</div>
              <h5 className="card-title">Active Users</h5>
              <p className="display-6 fw-bold text-primary mb-0">{activeUsers}</p>
              <small className="text-muted">Total: {users.length}</small>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-success mb-3">🍽️</div>
              <h5 className="card-title">Available Foods</h5>
              <p className="display-6 fw-bold text-success mb-0">{availableFoods}</p>
              <small className="text-muted">Total: {foods.length}</small>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-warning mb-3">📦</div>
              <h5 className="card-title">Pending Orders</h5>
              <p className="display-6 fw-bold text-warning mb-0">{pendingOrders}</p>
              <small className="text-muted">Total: {orders.length}</small>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-info mb-3">💰</div>
              <h5 className="card-title">Total Revenue</h5>
              {/* <p className="display-6 fw-bold text-info mb-0">${totalRevenue.toFixed(2)}</p> */}
              <small className="text-muted">All time</small>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Users</h5>
            </div>
            <div className="card-body">
              {users.slice(0, 5).map(user => (
                <div key={user.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold">{user.displayName}</div>
                    <small className="text-muted">{user.email}</small>
                  </div>
                  <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Orders</h5>
            </div>
            <div className="card-body">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold">Order #{order.id}</div>
                    <small className="text-muted">{order.totalPrice} SEK</small>
                    <br />
                    <small className="text-muted">{order.userEmail}</small>
                  </div>
                  <span className={`badge ${
                    order.status === 'completed' ? 'bg-success' : 
                    order.status === 'pending' ? 'bg-warning' : 'bg-danger'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;