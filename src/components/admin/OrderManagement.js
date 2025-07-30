import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

const OrderManagement = () => {
  const { orders, updateOrderStatus, users } = useAdmin();
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredOrders = orders.filter(order => {
    return filterStatus === 'all' || order.status === filterStatus;
  });

  const getUserById = (userId) => {
    return users.find(user => user.id === userId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getLocalizedText = (textObj, fallback = 'Unnamed Item') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj.english || textObj.swedish || fallback;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Order Management</h1>
        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const user = getUserById(order.userId);
                  return (
                    <tr key={order.id}>
                      <td className="fw-semibold">#{order.id}</td>
                      <td>
                        <div>
                          <div className="fw-semibold">{user?.displayName || order.userEmail || 'Unknown'}</div>
                          <small className="text-muted">{order.userEmail || user?.email}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          {order.items.map((item, index) => (
                            <div key={index} className="small">
                              {item.quantity}x {getLocalizedText(item.name)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="fw-semibold">{order.totalPrice} SEK</td>
                      <td>
                        <small>
                          {order.createdAt?.toDate
                            ? order.createdAt.toDate().toLocaleDateString()
                            : ''}
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;