import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const UserManagement = () => {
  const { users, updateUserStatus, updateUserRole, deleteUser } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">User Management</h1>
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
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
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
                      <div>
                        <div className="fw-semibold">{user.displayName}</div>
                        <small className="text-muted">{user.email}</small>
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
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
                          onChange={(e) => updateUserStatus(user.id, e.target.checked)}
                        />
                        <label className="form-check-label">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </label>
                      </div>
                    </td>
                    <td>
                      <small>{user.joinedAt.toLocaleDateString()}</small>
                    </td>
                    <td>
                      <small>{user.lastLogin.toLocaleDateString()}</small>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;