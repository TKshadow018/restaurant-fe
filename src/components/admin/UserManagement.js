import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslation } from 'react-i18next';
import Loading from '@/components/Loading';

const UserManagement = () => {
  const { users, loading, error, updateUserStatus, updateUserRole, deleteUser } = useAdmin();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteUser = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      try {
        await deleteUser(userId);
        alert('User deleted successfully');
      } catch (error) {
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      await updateUserStatus(userId, isActive);
    } catch (error) {
      alert('Failed to update user status: ' + error.message);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
    } catch (error) {
      alert('Failed to update user role: ' + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loading message="Loading users..." height="60vh" />;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error!</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">User Management</h1>
          <p className="text-muted">Total users: {users.length}</p>
        </div>
        <div className="d-flex gap-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
          <select
            className="form-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-muted">No users found</h5>
              <p className="text-muted">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {user.photoURL && (
                            <img
                              src={user.photoURL}
                              alt="Profile"
                              className="rounded-circle me-3"
                              width="40"
                              height="40"
                            />
                          )}
                          <div>
                            <div className="fw-semibold">
                              {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name'}
                            </div>
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${user.role === 'admin' ? 'text-warning fw-bold' : ''}`}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={user.isActive}
                            onChange={(e) => handleStatusChange(user.id, e.target.checked)}
                          />
                          <label className={`form-check-label ${user.isActive ? 'text-success' : 'text-danger'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </label>
                        </div>
                      </td>
                      <td>
                        <small>{formatDate(user.joinedAt)}</small>
                      </td>
                      <td>
                        <small>{formatDate(user.lastLogin)}</small>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={user.role === 'admin'} // Prevent deleting admin users
                        >
                          {user.role === 'admin' ? 'Protected' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="row">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Users</h5>
                <h2>{users.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Active Users</h5>
                <h2>{users.filter(u => u.isActive).length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Admins</h5>
                <h2>{users.filter(u => u.role === 'admin').length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Customers</h5>
                <h2>{users.filter(u => u.role === 'customer').length}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;