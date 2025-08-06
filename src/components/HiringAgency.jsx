// src/components/HiringAgencies.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './HiringAgency.css';
import { baseURL } from '../data';
import { fetchCompanies } from '../redux/slices/companiesSlice';
import { fetchHiringAgencies } from '../redux/slices/hiringAgenciesSlice';
import { fetchRecruiters } from '../redux/slices/recruitersSlice';
import { fetchAdmins } from '../redux/slices/adminSlice'; // Import the dummy fetch for admins

const HiringAgencies = () => {
  const dispatch = useDispatch();
  const searchTerm = useSelector((state) => state.search.searchTerm);
  const user = useSelector((state) => state.user.user); // Get the full user object
  const userRole = user?.role; // Access the user's role from the Redux store
  const userCompany = user?.company_name; // Get the logged-in user's company name

  // Data from Redux slices
  const companies = useSelector((state) => state.companies.companies);
  const hiringAgencies = useSelector((state) => state.hiringAgencies.hiringAgencies);
  const recruiters = useSelector((state) => state.recruiters.recruiters);
  const admins = useSelector((state) => state.admin.admins); // Get admin dummy data

  // Loading and error states (can be combined for a single loading indicator if preferred)
  const companiesStatus = useSelector((state) => state.companies.status);
  const hiringAgenciesStatus = useSelector((state) => state.hiringAgencies.status);
  const recruitersStatus = useSelector((state) => state.recruiters.status);
  const adminStatus = useSelector((state) => state.admin.status);

  const isLoading = companiesStatus === 'loading' || hiringAgenciesStatus === 'loading' || recruitersStatus === 'loading' || adminStatus === 'loading';

  const [activeTab, setActiveTab] = useState('Recruiter'); // Default to 'Recruiter' tab
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    company_name: userRole === 'COMPANY' ? userCompany : '', // Pre-fill if company user
    role: userRole === 'COMPANY' ? 'RECRUITER' : 'RECRUITER', // Default role for new users based on logged-in user
    password: '',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUserData, setEditedUserData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Define tabs based on user role
  const getAvailableTabs = (role) => {
    if (role === 'ADMIN') {
      return ['Recruiter', 'Hiring Agency', 'Company', 'Admin'];
    } else if (role === 'COMPANY') {
      return ['Recruiter', 'Hiring Agency'];
    }
    return []; // Hiring Agency and Recruiter roles won't see this page
  };

  const availableTabs = getAvailableTabs(userRole);

  // NEW: Define role options for the Add New User form based on user role
  const getRoleOptions = (role) => {
    if (role === 'ADMIN') {
      return [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'COMPANY', label: 'Company' },
        { value: 'HIRING_AGENCY', label: 'Hiring Agency' },
        { value: 'RECRUITER', label: 'Recruiter' },
      ];
    } else if (role === 'COMPANY') {
      return [
        { value: 'HIRING_AGENCY', label: 'Hiring Agency' },
        { value: 'RECRUITER', label: 'Recruiter' },
      ];
    }
    return []; // Should not reach here if the "Add New User" button is hidden
  };

  const roleOptions = getRoleOptions(userRole);

  // Set default tab based on available tabs
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [userRole, availableTabs, activeTab]);

  // Fetch data on component mount and when activeTab changes (if data isn't already loaded)
  useEffect(() => {
    // Log user details here
    if (user) {
      console.log("HiringAgencies - Logged-in user details:", user);
      console.log("HiringAgencies - User role:", userRole);
    } else {
      console.log("HiringAgencies - No user logged in.");
    }

    // Dispatch all fetch actions once
    if (companiesStatus === 'idle') {
      dispatch(fetchCompanies());
    }
    if (hiringAgenciesStatus === 'idle') {
      dispatch(fetchHiringAgencies());
    }
    if (recruitersStatus === 'idle') {
      dispatch(fetchRecruiters());
    }
    if (adminStatus === 'idle' && userRole === 'ADMIN') { // Only fetch admins if user is admin
      dispatch(fetchAdmins());
    }
  }, [dispatch, companiesStatus, hiringAgenciesStatus, recruitersStatus, adminStatus, user, userRole]);


  // Determine the data to display based on the active tab
  const getCurrentTableData = () => {
    switch (activeTab) {
      case 'Recruiter':
        return recruiters;
      case 'Hiring Agency':
        return hiringAgencies;
      case 'Company':
        return companies;
      case 'Admin':
        return admins;
      default:
        return [];
    }
  };

  const currentTableData = getCurrentTableData();

  // Filter and sort logic (remains similar, but now operates on fetched data)
  const filteredBySearch = currentTableData.filter(user => {
    // Apply search term filter
    const matchesSearchTerm = !searchTerm || (
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.status?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.userType?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply company name filter if logged-in user is a COMPANY
    const matchesCompany = userRole === 'COMPANY'
      ? user.company_name?.toLowerCase() === userCompany?.toLowerCase()
      : true; // No company filter for ADMIN or other roles

    return matchesSearchTerm && matchesCompany;
  });

  const sortedUsers = [...filteredBySearch].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedUsers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(sortedUsers.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1); // Reset pagination when search term or sort changes
  }, [searchTerm, sortColumn, sortDirection, activeTab]); // Also reset on tab change

  // Effect to add/remove 'show' class for modal animations
  useEffect(() => {
    const addModalOverlay = document.querySelector('.add-agency-modal-overlay');
    const deleteModalOverlay = document.querySelector('.delete-confirm-overlay');

    if (addModalOverlay) {
      if (showAddModal) {
        addModalOverlay.classList.add('show');
      } else {
        addModalOverlay.classList.remove('show');
      }
    }

    if (deleteModalOverlay) {
      if (showDeleteConfirm) {
        deleteModalOverlay.classList.add('show');
      } else {
        deleteModalOverlay.classList.remove('show');
      }
    }
  }, [showAddModal, showDeleteConfirm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setApiMessage(''); // Clear previous messages
    // Basic validation
    if (!formData.username || !formData.full_name || !formData.email || !formData.password || !formData.role) {
      setApiMessage('Error: All fields are required.');
      return;
    }

    // Determine the API endpoint based on the selected role
    let endpoint = '';
    let payload = {};

    endpoint = `${baseURL}/auth/register/`;
    payload = {
      username: formData.username,
      email: formData.email,
      full_name: formData.full_name,
      company_name: formData.company_name, // company_name might be optional for some roles
      role: formData.role.toUpperCase(),
      password: formData.password,
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user.');
      }

      const result = await response.json();
      setApiMessage(`User ${result.full_name} added successfully!`);
      setShowAddModal(false);
      setFormData({
        username: '',
        full_name: '',
        email: '',
        company_name: userRole === 'COMPANY' ? userCompany : '', // Reset company name based on user role
        role: userRole === 'COMPANY' ? 'RECRUITER' : 'RECRUITER', // Reset role based on user role
        password: '',
      });
      // Re-fetch data for the active tab to update the table
      if (activeTab === 'Recruiter') dispatch(fetchRecruiters());
      else if (activeTab === 'Hiring Agency') dispatch(fetchHiringAgencies());
      else if (activeTab === 'Company') dispatch(fetchCompanies());
      else if (activeTab === 'Admin') dispatch(fetchAdmins()); // Re-fetch dummy admins

    } catch (error) {
      console.error('Error adding user:', error);
      setApiMessage(`Error: ${error.message}`);
    } finally {
      setTimeout(() => setApiMessage(''), 5000); // Clear message after 5 seconds
    }
  };


  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setEditedUserData({ ...user });
  };

  const handleEditedInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveEdit = () => {
    // In a real application, you would send this update to your backend API
    if (editedUserData) {
      // Optimistically update UI
      let updatedList = [];
      switch (activeTab) {
        case 'Recruiter':
          updatedList = recruiters.map(user => user.id === editingUserId ? { ...editedUserData, lastUpdated: new Date().toISOString().slice(0, 10) } : user);
          // In a real app: dispatch(updateRecruiter(editedUserData));
          break;
        case 'Hiring Agency':
          updatedList = hiringAgencies.map(user => user.id === editingUserId ? { ...editedUserData, lastUpdated: new Date().toISOString().slice(0, 10) } : user);
          // In a real app: dispatch(updateHiringAgency(editedUserData));
          break;
        case 'Company':
          updatedList = companies.map(user => user.id === editingUserId ? { ...editedUserData, lastUpdated: new Date().toISOString().slice(0, 10) } : user);
          // In a real app: dispatch(updateCompany(editedUserData));
          break;
        case 'Admin':
          updatedList = admins.map(user => user.id === editingUserId ? { ...editedUserData, lastUpdated: new Date().toISOString().slice(0, 10) } : user);
          // In a real app: dispatch(updateAdmin(editedUserData));
          break;
        default:
          break;
      }
      // For now, we'll just re-fetch to simulate an update if the data is small
      // For larger datasets, you'd update the specific item in the Redux store directly
      if (activeTab === 'Recruiter') dispatch(fetchRecruiters());
      else if (activeTab === 'Hiring Agency') dispatch(fetchHiringAgencies());
      else if (activeTab === 'Company') dispatch(fetchCompanies());
      else if (activeTab === 'Admin') dispatch(fetchAdmins());

      setEditingUserId(null);
      setEditedUserData(null);
      setApiMessage('User updated successfully!');
      setTimeout(() => setApiMessage(''), 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditedUserData(null);
  };

  const handleDeleteClick = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    // In a real application, you would send a delete request to your backend API
    // For now, we'll just re-fetch to simulate a delete
    setApiMessage(`Deleting user ID: ${deleteUserId}...`);
    // Simulate API call
    setTimeout(() => {
      if (activeTab === 'Recruiter') dispatch(fetchRecruiters());
      else if (activeTab === 'Hiring Agency') dispatch(fetchHiringAgencies());
      else if (activeTab === 'Company') dispatch(fetchCompanies());
      else if (activeTab === 'Admin') dispatch(fetchAdmins()); // Re-fetch dummy admins

      setApiMessage('User deleted successfully!');
      setTimeout(() => setApiMessage(''), 5000);
    }, 500);

    setShowDeleteConfirm(false);
    setDeleteUserId(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteUserId(null);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
    };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-badge active';
      case 'inactive':
        return 'status-badge inactive';
      case 'on hold':
        return 'status-badge on-hold';
      default:
        return 'status-badge';
    }
  };

  // If user is not ADMIN or COMPANY, they should not see this page
  if (!['ADMIN', 'COMPANY'].includes(userRole)) {
    return (
      <div className="hiring-agencies-container">
        <div className="hiring-agencies-list-section card">
          <p className="no-results">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hiring-agencies-container">
      <div className="hiring-agencies-tabs-container">
        <div className="hiring-agency-tabs">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              className={`hiring-agency-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              disabled={isLoading}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* "Add New User" button visible only for ADMIN or COMPANY */}
        {['ADMIN', 'COMPANY'].includes(userRole) && (
          <button className="add-agency-btn" onClick={() => setShowAddModal(true)} disabled={isLoading}>
            Add New User
          </button>
        )}
      </div>

      <div className="hiring-agencies-list-section card">
        {isLoading ? (
          <p className="loading-message">Loading users...</p>
        ) : (
          <>
            {apiMessage && (
              <p className={`api-message ${apiMessage.startsWith('Error') ? 'error-message' : 'success-message'}`}>
                {apiMessage}
              </p>
            )}
            <div className="table-responsive">
              <table className="hiring-agencies-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>Name {getSortIndicator('name')}</th>
                    <th onClick={() => handleSort('contactPerson')}>Contact Person {getSortIndicator('contactPerson')}</th>
                    <th onClick={() => handleSort('email')}>Email {getSortIndicator('email')}</th>
                    <th onClick={() => handleSort('phone')}>Phone {getSortIndicator('phone')}</th>
                    <th onClick={() => handleSort('status')}>Status {getSortIndicator('status')}</th>
                    <th onClick={() => handleSort('userType')}>User Type {getSortIndicator('userType')}</th>
                    <th onClick={() => handleSort('lastUpdated')}>Last Updated {getSortIndicator('lastUpdated')}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-results">No {activeTab.toLowerCase()} users found.</td>
                    </tr>
                  ) : (
                    currentRecords.map((user) => (
                      <tr key={user.id}>
                        <td>
                          {editingUserId === user.id ? (
                            <input
                              type="text"
                              name="name"
                              value={editedUserData?.name || ''}
                              onChange={handleEditedInputChange}
                            />
                          ) : (
                            user.name
                          )}
                        </td>
                        <td>
                          {editingUserId === user.id ? (
                            <input
                              type="text"
                              name="contactPerson"
                              value={editedUserData?.contactPerson || ''}
                              onChange={handleEditedInputChange}
                            />
                          ) : (
                            user.contactPerson
                          )}
                        </td>
                        <td>
                          {editingUserId === user.id ? (
                            <input
                              type="email"
                              name="email"
                              value={editedUserData?.email || ''}
                              onChange={handleEditedInputChange}
                            />
                          ) : (
                            user.email
                          )}
                        </td>
                        <td>
                          {editingUserId === user.id ? (
                            <input
                              type="tel"
                              name="phone"
                              value={editedUserData?.phone || ''}
                              onChange={handleEditedInputChange}
                            />
                          ) : (
                            user.phone
                          )}
                        </td>
                        <td>
                          {editingUserId === user.id ? (
                            <select
                              name="status"
                              value={editedUserData?.status || ''}
                              onChange={handleEditedInputChange}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="On Hold">On Hold</option>
                            </select>
                          ) : (
                            <span className={getStatusBadgeClass(user.status)}>
                              {user.status}
                            </span>
                          )}
                        </td>
                        <td>
                          {editingUserId === user.id ? (
                            <select
                              name="userType"
                              value={editedUserData?.userType || ''}
                              onChange={handleEditedInputChange}
                            >
                              <option value="Hiring Agency">Hiring Agency</option>
                              <option value="Recruiter">Recruiter</option>
                              <option value="Company">Company</option>
                              <option value="Admin">Admin</option>
                            </select>
                          ) : (
                            user.userType
                          )}
                        </td>
                        <td>{user.lastUpdated}</td>
                        <td className="actions-column">
                          {editingUserId === user.id ? (
                            <div className="action-buttons">
                              <button onClick={handleSaveEdit} className="save-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button onClick={handleCancelEdit} className="cancel-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons">
                              <button onClick={() => handleEditClick(user)} className="edit-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 20H20.5M18 2L22 6L12 16L8 16L8 12L18 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button onClick={() => handleDeleteClick(user.id)} className="delete-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H21M5 6V20C5 20.5304 5.21071 21.0391 5.58579 21.4142C5.96086 21.7893 6.46957 22 7 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {sortedUsers.length > recordsPerPage && (
              <div className="pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => paginate(index + 1)}
                    className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
              <div className={`delete-confirm-overlay ${showDeleteConfirm ? 'show' : ''}`}>
                <div className="delete-confirm-modal">
                  <p>Are you sure you want to delete this user?</p>
                  <div className="delete-confirm-actions">
                    <button onClick={confirmDelete} className="delete-btn">Delete</button>
                    <button onClick={cancelDelete} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className={`add-agency-modal-overlay ${showAddModal ? 'show' : ''}`}>
          <div className="add-agency-modal-content card">
            <button className="modal-close-button" onClick={() => setShowAddModal(false)}>&times;</button>
            <h3 className="form-title">Add New User</h3>
            {/* Message for non-admin/company users */}
            {!['ADMIN', 'COMPANY'].includes(userRole) && (
              <p className="error-message">You are not allowed to create users.</p>
            )}
            {/* Form visible only if user is ADMIN or COMPANY */}
            {['ADMIN', 'COMPANY'].includes(userRole) && (
              <form onSubmit={handleAddUser} className="hiring-agencies-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="e.g., user5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="full_name">Full Name</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Bob Sharma"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="agencyEmail">Email</label>
                    <input
                      type="email"
                      id="agencyEmail"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g., contact@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company_name">Company Name</label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="e.g., TechCorp"
                      required={formData.role !== 'ADMIN'}
                      readOnly={userRole === 'COMPANY'} // Make read-only for company users
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password@123"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {apiMessage && (
                  <p className={`api-message ${apiMessage.startsWith('Error') ? 'error-message' : 'success-message'}`}>
                    {apiMessage}
                  </p>
                )}
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? 'Adding User...' : 'Add User'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HiringAgencies;
