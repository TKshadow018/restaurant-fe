import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import useAdminData from '../../hooks/useAdminData';

const OrderManagement = () => {
  const { 
    orders, 
    users, 
    updateOrderStatus, 
    ordersLoading, 
    ordersError,
    loadAdminData 
  } = useAdminData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterServiceType, setFilterServiceType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedOrderAddress, setSelectedOrderAddress] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterDate, filterServiceType]);

  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    const serviceTypeMatch = filterServiceType === 'all' || order.serviceType === filterServiceType;
    
    let dateMatch = true;
    if (filterDate !== 'all') {
      // Handle ISO strings, Date objects, and Firebase Timestamps
      let orderDate;
      if (typeof order.createdAt === 'string') {
        orderDate = new Date(order.createdAt);
      } else if (order.createdAt instanceof Date) {
        orderDate = order.createdAt;
      } else if (order.createdAt?.toDate) {
        orderDate = order.createdAt.toDate();
      } else {
        orderDate = null;
      }
      
      const today = new Date();
      
      switch (filterDate) {
        case 'today':
          dateMatch = orderDate && orderDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          dateMatch = orderDate && orderDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateMatch = orderDate && orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateMatch = orderDate && orderDate >= monthAgo;
          break;
        default:
          dateMatch = true;
      }
    }
    
    return statusMatch && dateMatch && serviceTypeMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleShowAddress = (order) => {
    setSelectedOrderAddress(order.deliveryAddress);
    setShowAddressModal(true);
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setSelectedOrderAddress(null);
  };

  const getUserById = (userId) => {
    return users.find(user => user.id === userId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning text-dark';
      case 'preparing': return 'bg-info text-white';
      case 'ready': return 'bg-primary text-white';
      case 'completed': return 'bg-success text-white';
      case 'cancelled': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  };

  const getLocalizedText = (textObj, fallback = 'Unnamed Item') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj.english || textObj.swedish || fallback;
  };

  const getServiceTypeText = (serviceType) => {
    const serviceTypes = {
      dine_in: 'Dine In',
      takeout: 'Takeout',
      home_delivery: 'Home Delivery'
    };
    return serviceTypes[serviceType] || serviceType || 'N/A';
  };

  const getServiceTypeIcon = (serviceType) => {
    const serviceIcons = {
      dine_in: 'bi-shop',
      takeout: 'bi-bag',
      home_delivery: 'bi-truck'
    };
    return serviceIcons[serviceType] || 'bi-question-circle';
  };

  const getServiceTypeBadgeColor = (serviceType) => {
    const colors = {
      dine_in: 'bg-success',
      takeout: 'bg-warning text-dark',
      home_delivery: 'bg-info'
    };
    return colors[serviceType] || 'bg-secondary';
  };

  const formatPaymentMethod = (paymentMethod) => {
    if (!paymentMethod) return 'N/A';
    return paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTotalPrice = (order) => {
    // Try different possible field names for total price
    const total = order.finalTotal || order.totalPrice || order.total || order.grandTotal;
    
    if (total === null || total === undefined || total === '') {
      return 'N/A';
    }
    
    // Convert to number if it's a string
    const numericTotal = typeof total === 'string' ? parseFloat(total) : total;
    
    // Check if it's a valid number
    if (isNaN(numericTotal)) {
      return 'N/A';
    }
    
    return `${numericTotal.toFixed(2)} SEK`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    // Handle ISO strings, Date objects, and Firebase Timestamps
    let date;
    if (typeof dateTime === 'string') {
      date = new Date(dateTime);
    } else if (dateTime instanceof Date) {
      date = dateTime;
    } else if (dateTime.toDate) {
      date = dateTime.toDate();
    } else {
      return 'Invalid Date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatAddress = (deliveryAddress) => {
    if (!deliveryAddress) return 'No address available';

    if (deliveryAddress.useProfileAddress && deliveryAddress.userProfileAddress) {
      const addr = deliveryAddress.userProfileAddress;
      return `${addr.street} ${addr.houseNumber}, ${addr.postalCode} ${addr.city}${addr.region ? `, ${addr.region}` : ''}`;
    } else if (deliveryAddress.customAddress) {
      const addr = deliveryAddress.customAddress;
      if (typeof addr === 'string') {
        return addr;
      } else if (typeof addr === 'object') {
        return `${addr.street} ${addr.houseNumber}, ${addr.postalCode} ${addr.city}${addr.region ? `, ${addr.region}` : ''}`;
      }
    }

    return 'Address not available';
  };

  if (ordersLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error!</h4>
        <p>{ordersError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Order Management</h1>
        <div className="d-flex gap-3">
          <select
            className="form-select"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            style={{ width: '120px' }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <select
            className="form-select"
            value={filterServiceType}
            onChange={(e) => setFilterServiceType(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="all">All Service Types</option>
            <option value="dine_in">Dine In</option>
            <option value="takeout">Takeout</option>
            <option value="home_delivery">Home Delivery</option>
          </select>
          <select
            className="form-select"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
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
      </div>

      {filteredOrders.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
          </small>
          {totalPages > 1 && (
            <small className="text-muted">
              Page {currentPage} of {totalPages}
            </small>
          )}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Service Type</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map(order => {
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
                          <div className="d-flex flex-column gap-1">
                            <span className={`badge ${getServiceTypeBadgeColor(order.serviceType)}`}>
                              <i className={`${getServiceTypeIcon(order.serviceType)} me-1`}></i>
                              {getServiceTypeText(order.serviceType)}
                            </span>
                            {order.serviceType === 'home_delivery' && order.deliveryAddress && (
                              <button
                                className="btn btn-outline-info btn-sm"
                                onClick={() => handleShowAddress(order)}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                <i className="bi bi-geo-alt me-1"></i>
                                View Address
                              </button>
                            )}
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
                        <td className="fw-semibold">{formatTotalPrice(order)}</td>
                        <td>
                          <div className="fw-semibold">{formatPaymentMethod(order.paymentMethod)}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{formatDateTime(order.createdAt)}</div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(order.status)}`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={order.status || 'pending'}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div className="text-muted">
                        <i className="bi bi-inbox display-4 d-block mb-2"></i>
                        {filteredOrders.length === 0 
                          ? "No orders found matching the selected filters."
                          : "No orders to display on this page."
                        }
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav aria-label="Order pagination">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              
              {/* Page numbers */}
              {(() => {
                const pages = [];
                const showPages = 5; // Number of page buttons to show
                let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                let endPage = Math.min(totalPages, startPage + showPages - 1);
                
                // Adjust if we're near the end
                if (endPage - startPage + 1 < showPages) {
                  startPage = Math.max(1, endPage - showPages + 1);
                }
                
                // First page and ellipsis
                if (startPage > 1) {
                  pages.push(
                    <li key={1} className="page-item">
                      <button className="page-link" onClick={() => handlePageChange(1)}>
                        1
                      </button>
                    </li>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <li key="ellipsis1" className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                }
                
                // Main page numbers
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(i)}>
                        {i}
                      </button>
                    </li>
                  );
                }
                
                // Last page and ellipsis
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <li key="ellipsis2" className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  pages.push(
                    <li key={totalPages} className="page-item">
                      <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                      </button>
                    </li>
                  );
                }
                
                return pages;
              })()}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Address Modal */}
      <Modal show={showAddressModal} onHide={handleCloseAddressModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-geo-alt me-2"></i>
            Delivery Address
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrderAddress ? (
            <div>
              {selectedOrderAddress.useProfileAddress ? (
                <div>
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-person-check me-2"></i>
                    Customer's Profile Address
                  </h6>
                  {selectedOrderAddress.userProfileAddress ? (
                    <div className="border rounded p-3 bg-light">
                      <div className="row">
                        <div className="col-sm-3 fw-semibold">Street:</div>
                        <div className="col-sm-9">{selectedOrderAddress.userProfileAddress.street || 'N/A'}</div>
                      </div>
                      <div className="row">
                        <div className="col-sm-3 fw-semibold">House Number:</div>
                        <div className="col-sm-9">{selectedOrderAddress.userProfileAddress.houseNumber || 'N/A'}</div>
                      </div>
                      <div className="row">
                        <div className="col-sm-3 fw-semibold">Postal Code:</div>
                        <div className="col-sm-9">{selectedOrderAddress.userProfileAddress.postalCode || 'N/A'}</div>
                      </div>
                      <div className="row">
                        <div className="col-sm-3 fw-semibold">City:</div>
                        <div className="col-sm-9">{selectedOrderAddress.userProfileAddress.city || 'N/A'}</div>
                      </div>
                      {selectedOrderAddress.userProfileAddress.region && (
                        <div className="row">
                          <div className="col-sm-3 fw-semibold">Region:</div>
                          <div className="col-sm-9">{selectedOrderAddress.userProfileAddress.region}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      Profile address data not available
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h6 className="text-info mb-3">
                    <i className="bi bi-geo-alt me-2"></i>
                    Custom Delivery Address
                  </h6>
                  {selectedOrderAddress.customAddress ? (
                    <div className="border rounded p-3 bg-light">
                      {typeof selectedOrderAddress.customAddress === 'string' ? (
                        <p className="mb-0">{selectedOrderAddress.customAddress}</p>
                      ) : (
                        <div>
                          <div className="row">
                            <div className="col-sm-3 fw-semibold">Street:</div>
                            <div className="col-sm-9">{selectedOrderAddress.customAddress.street || 'N/A'}</div>
                          </div>
                          <div className="row">
                            <div className="col-sm-3 fw-semibold">House Number:</div>
                            <div className="col-sm-9">{selectedOrderAddress.customAddress.houseNumber || 'N/A'}</div>
                          </div>
                          <div className="row">
                            <div className="col-sm-3 fw-semibold">Postal Code:</div>
                            <div className="col-sm-9">{selectedOrderAddress.customAddress.postalCode || 'N/A'}</div>
                          </div>
                          <div className="row">
                            <div className="col-sm-3 fw-semibold">City:</div>
                            <div className="col-sm-9">{selectedOrderAddress.customAddress.city || 'N/A'}</div>
                          </div>
                          {selectedOrderAddress.customAddress.region && (
                            <div className="row">
                              <div className="col-sm-3 fw-semibold">Region:</div>
                              <div className="col-sm-9">{selectedOrderAddress.customAddress.region}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      Custom address data not available
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-3">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Complete formatted address: <strong>{formatAddress(selectedOrderAddress)}</strong>
                </small>
              </div>
            </div>
          ) : (
            <div className="alert alert-danger">
              No address information available for this order.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAddressModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderManagement;