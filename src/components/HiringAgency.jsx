// src/components/HiringAgencies.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux'; // Assuming search term might be used
import './HiringAgency.css'; // Changed CSS file name

// Dummy data for hiring agencies (replace with Redux/API in a real app)
const initialHiringAgencies = [
  { id: '1', name: 'Global Recruiters Inc.', contactPerson: 'Alice Brown', email: 'alice@globalrecruit.com', phone: '111-222-3333', status: 'Active', userType: 'Hiring Agency', lastUpdated: '2023-01-15' },
  { id: '2', name: 'Bob White', contactPerson: 'Recruiting Manager', email: 'bob@company.com', phone: '444-555-6666', status: 'Active', userType: 'Staff', lastUpdated: '2023-02-20' },
  { id: '3', name: 'TalentLink Agency', contactPerson: 'Charlie Green', email: 'charlie@talentlink.com', phone: '777-888-9999', status: 'Inactive', userType: 'Hiring Agency', lastUpdated: '2023-03-10' },
  { id: '4', name: 'Diana Prince', contactPerson: 'HR Coordinator', email: 'diana@corp.com', phone: '123-456-7890', status: 'Active', userType: 'Staff', lastUpdated: '2023-04-05' },
  { id: '5', name: 'Innovate Staffing', contactPerson: 'Eve Adams', email: 'eve@innovatestaff.com', phone: '222-333-4444', status: 'Active', userType: 'Hiring Agency', lastUpdated: '2023-05-01' },
  { id: '6', name: 'Frank Miller', contactPerson: 'Senior Recruiter', email: 'frank@company.com', phone: '555-666-7777', status: 'Active', userType: 'Staff', lastUpdated: '2023-05-15' },
  { id: '7', name: 'Peak Talent Group', contactPerson: 'Grace Lee', email: 'grace@peaktalent.com', phone: '888-999-0000', status: 'On Hold', userType: 'Hiring Agency', lastUpdated: '2023-06-01' },
  { id: '8', name: 'Hannah Scott', contactPerson: 'Recruiting Assistant', email: 'hannah@company.com', phone: '111-000-9999', status: 'Active', userType: 'Staff', lastUpdated: '2023-06-10' },
  { id: '9', name: 'Synergy Solutions', contactPerson: 'Ivan Petrov', email: 'ivan@synergysolutions.com', phone: '333-444-5555', status: 'Active', userType: 'Hiring Agency', lastUpdated: '2023-07-01' },
  { id: '10', name: 'Jessica Chen', contactPerson: 'HR Manager', email: 'jessica@company.com', phone: '666-777-8888', status: 'Active', userType: 'Staff', lastUpdated: '2023-07-15' },
  { id: '11', name: 'Global Connect', contactPerson: 'Kevin Wong', email: 'kevin@globalconnect.com', phone: '999-888-7777', status: 'Active', userType: 'Hiring Agency', lastUpdated: '2023-08-01' },
  { id: '12', name: 'Liam Davies', contactPerson: 'Talent Acquisition', email: 'liam@company.com', phone: '000-111-2222', status: 'Inactive', userType: 'Staff', lastUpdated: '2023-08-10' },
  { id: '13', name: 'Bright Future Agency', contactPerson: 'Mia Clark', email: 'mia@brightfuture.com', phone: '444-333-2222', status: 'Active', userType: 'Hiring Agency', lastUpdated: '2023-09-01' },
  { id: '14', name: 'Noah Evans', contactPerson: 'Recruitment Lead', email: 'noah@company.com', phone: '777-666-5555', status: 'Active', userType: 'Staff', lastUpdated: '2023-09-15' },
  { id: '15', name: 'OptiStaff', contactPerson: 'Olivia White', email: 'olivia@optistaff.com', phone: '123-987-6543', status: 'On Hold', userType: 'Hiring Agency', lastUpdated: '2023-10-01' },
];

const HiringAgencies = () => {
  const searchTerm = useSelector((state) => state.search.searchTerm); // Get search term from Redux

  const [allAgencies, setAllAgencies] = useState(initialHiringAgencies);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Active', // Default status
    userType: 'Hiring Agency', // Default user type
  });
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false); // New state for modal visibility

  const [editingAgencyId, setEditingAgencyId] = useState(null);
  const [editedAgencyData, setEditedAgencyData] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAgencyId, setDeleteAgencyId] = useState(null);

  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10); // Show 10 records per page

  // Filtered agencies based on search term
  const filteredAgencies = allAgencies.filter(agency => {
    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      agency.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      agency.contactPerson.toLowerCase().includes(lowerCaseSearchTerm) ||
      agency.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      agency.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
      agency.status.toLowerCase().includes(lowerCaseSearchTerm) ||
      agency.userType.toLowerCase().includes(lowerCaseSearchTerm) // Include userType in search
    );
  });

  // Sorting logic
  const sortedAgencies = [...filteredAgencies].sort((a, b) => {
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

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedAgencies.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(sortedAgencies.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when search term or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortColumn, sortDirection]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddAgency = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contactPerson || !formData.email || !formData.phone) {
      setErrorMessage('Please fill in all required fields.');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const newAgency = {
      id: Date.now().toString(), // Simple unique ID
      ...formData,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    setAllAgencies((prevAgencies) => [...prevAgencies, newAgency]);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      status: 'Active',
      userType: 'Hiring Agency',
    });
    setErrorMessage('');
    setShowMessage(false);
    setShowAddModal(false); // Close modal on successful add
  };

  const handleEditClick = (agency) => {
    setEditingAgencyId(agency.id);
    setEditedAgencyData({ ...agency }); // Create a copy for editing
  };

  const handleEditedInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAgencyData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveEdit = () => {
    if (editedAgencyData) {
      setAllAgencies((prevAgencies) =>
        prevAgencies.map((agency) =>
          agency.id === editingAgencyId ? { ...editedAgencyData, lastUpdated: new Date().toISOString().slice(0, 10) } : agency
        )
      );
      setEditingAgencyId(null);
      setEditedAgencyData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingAgencyId(null);
    setEditedAgencyData(null);
  };

  const handleDeleteClick = (agencyId) => {
    setDeleteAgencyId(agencyId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setAllAgencies((prevAgencies) => prevAgencies.filter((agency) => agency.id !== deleteAgencyId));
    setShowDeleteConfirm(false);
    setDeleteAgencyId(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteAgencyId(null);
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

  return (
    <div className="hiring-agencies-container">
      <div className="hiring-agencies-header">
        <h3 className="table-title">Users</h3> {/* Changed title here */}
        <button className="add-agency-btn" onClick={() => setShowAddModal(true)}>
          Add New User {/* Changed button text here */}
        </button>
      </div>

      <div className="hiring-agencies-list-section card">
        <div className="table-responsive">
          <table className="hiring-agencies-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>Name {getSortIndicator('name')}</th>
                <th onClick={() => handleSort('contactPerson')}>Contact Person {getSortIndicator('contactPerson')}</th>
                <th onClick={() => handleSort('email')}>Email {getSortIndicator('email')}</th>
                <th onClick={() => handleSort('phone')}>Phone {getSortIndicator('phone')}</th>
                <th onClick={() => handleSort('status')}>Status {getSortIndicator('status')}</th>
                <th onClick={() => handleSort('userType')}>User Type {getSortIndicator('userType')}</th> {/* New column */}
                <th onClick={() => handleSort('lastUpdated')}>Last Updated {getSortIndicator('lastUpdated')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-results">No users found.</td> {/* Adjusted colspan */}
                </tr>
              ) : (
                currentRecords.map((agency) => (
                  <tr key={agency.id}>
                    <td>
                      {editingAgencyId === agency.id ? (
                        <input
                          type="text"
                          name="name"
                          value={editedAgencyData?.name || ''}
                          onChange={handleEditedInputChange}
                        />
                      ) : (
                        agency.name
                      )}
                    </td>
                    <td>
                      {editingAgencyId === agency.id ? (
                        <input
                          type="text"
                          name="contactPerson"
                          value={editedAgencyData?.contactPerson || ''}
                          onChange={handleEditedInputChange}
                        />
                      ) : (
                        agency.contactPerson
                      )}
                    </td>
                    <td>
                      {editingAgencyId === agency.id ? (
                        <input
                          type="email"
                          name="email"
                          value={editedAgencyData?.email || ''}
                          onChange={handleEditedInputChange}
                        />
                      ) : (
                        agency.email
                      )}
                    </td>
                    <td>
                      {editingAgencyId === agency.id ? (
                        <input
                          type="tel"
                          name="phone"
                          value={editedAgencyData?.phone || ''}
                          onChange={handleEditedInputChange}
                        />
                      ) : (
                        agency.phone
                      )}
                    </td>
                    <td>
                      {editingAgencyId === agency.id ? (
                        <select
                          name="status"
                          value={editedAgencyData?.status || ''}
                          onChange={handleEditedInputChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${agency.status.toLowerCase().replace(/\s/g, '-')}`}>
                          {agency.status}
                        </span>
                      )}
                    </td>
                    <td> {/* New column for userType */}
                      {editingAgencyId === agency.id ? (
                        <select
                          name="userType"
                          value={editedAgencyData?.userType || ''}
                          onChange={handleEditedInputChange}
                        >
                          <option value="Hiring Agency">Hiring Agency</option>
                          <option value="Staff">Staff</option>
                        </select>
                      ) : (
                        agency.userType
                      )}
                    </td>
                    <td>{agency.lastUpdated}</td>
                    <td className="actions-column">
                      {editingAgencyId === agency.id ? (
                        <div className="action-buttons">
                          <button onClick={handleSaveEdit} className="save-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Save
                          </button>
                          <button onClick={handleCancelEdit} className="cancel-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button onClick={() => handleEditClick(agency)} className="edit-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 20H20.5M18 2L22 6L12 16L8 16L8 12L18 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteClick(agency.id)} className="delete-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6H21M5 6V20C5 20.5304 5.21071 21.0391 5.58579 21.4142C5.96086 21.7893 6.46957 22 7 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Delete
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
        {sortedAgencies.length > recordsPerPage && (
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
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-modal">
              <p>Are you sure you want to delete this user?</p> {/* Changed text here */}
              <div className="delete-confirm-actions">
                <button onClick={confirmDelete} className="delete-btn">Delete</button>
                <button onClick={cancelDelete} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add New Agency Modal */}
      {showAddModal && (
        <div className="add-agency-modal-overlay">
          <div className="add-agency-modal-content card">
            <button className="modal-close-button" onClick={() => setShowAddModal(false)}>&times;</button>
            <h3 className="form-title">Add New User</h3> {/* Changed title here */}
            <form onSubmit={handleAddAgency} className="hiring-agencies-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="agencyName">Name</label> {/* Changed label here */}
                  <input
                    type="text"
                    id="agencyName"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe or Tech Talent Agency"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="e.g., Jane Doe"
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
                  <label htmlFor="agencyPhone">Phone</label>
                  <input
                    type="tel"
                    id="agencyPhone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +1 (123) 456-7890"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="agencyStatus">Status</label>
                  <select
                    id="agencyStatus"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="userType">User Type</label> {/* New field */}
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                  >
                    <option value="Hiring Agency">Hiring Agency</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>
              {showMessage && errorMessage && (
                <p className="error-message">{errorMessage}</p>
              )}
              <button type="submit" className="submit-btn">
                Add User {/* Changed button text here */}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiringAgencies;
