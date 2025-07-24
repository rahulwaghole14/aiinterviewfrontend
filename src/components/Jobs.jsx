// src/components/Jobs.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './Jobs.css'; // Import the new CSS file
import { uniqueJobDomains, jobStatusList } from '../data'; // Import data for dropdowns
import { addJob, updateJob, deleteJob } from '../redux/slices/jobsSlice'; // Import job actions

const Jobs = () => {
  const dispatch = useDispatch();
  const allJobs = useSelector((state) => state.jobs.allJobs || []); // Ensure allJobs is an array
  const searchTerm = useSelector((state) => state.search.searchTerm);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    status: 'Open', // Default status
    salaryRange: '',
  });
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Row-wise editing
  const [editingJobId, setEditingJobId] = useState(null);
  const [editedJobData, setEditedJobData] = useState(null);

  // Popup state for deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState(null);

  // State for sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Filtered jobs based on search term
  const filteredJobs = allJobs.filter(job => {
    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (job.title && job.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.description && job.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.domain && job.domain.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.status && job.status.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.salaryRange && job.salaryRange.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }).sort((a, b) => { // Apply sorting after filtering
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { title, description, domain, status, salaryRange } = formData;
    if (!title || !description || !domain || !status || !salaryRange) {
      setErrorMessage('Please fill all fields.');
      setShowMessage(false);
      return;
    }
    setErrorMessage('');

    dispatch(addJob({
      id: (allJobs.length > 0) ? Math.max(...allJobs.map(j => j.id)) + 1 : 1, // Simple ID generation
      title,
      description,
      domain,
      status,
      salaryRange,
      postedDate: new Date().toISOString().slice(0, 10),
      applicants: 0, // New jobs start with 0 applicants
      hired: 0, // New jobs start with 0 hired
    }));

    setShowMessage(true);
    setFormData({
      title: '',
      description: '',
      domain: '',
      status: 'Open',
      salaryRange: '',
    });
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  const handleEditClick = (job) => {
    setEditingJobId(job.id);
    setEditedJobData({ ...job }); // Create a copy for editing
  };

  const handleEditCellChange = (e, field) => {
    const newValue = e.target.value;
    setEditedJobData((prev) => ({ ...prev, [field]: newValue }));
  };

  const handleSaveClick = () => {
    if (editedJobData) {
      dispatch(updateJob({ id: editedJobData.id, updatedData: editedJobData }));
      setEditingJobId(null);
      setEditedJobData(null);
    }
  };

  const handleCancelClick = () => {
    setEditingJobId(null);
    setEditedJobData(null);
  };

  const handleDeleteClick = (id) => {
    setDeleteJobId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteJobId !== null) {
      dispatch(deleteJob(deleteJobId));
      setShowDeleteConfirm(false);
      setDeleteJobId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteJobId(null);
  };

  // Handle sorting logic
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
    <div className="jobs-container">
      {/* Top Section: Header Cards - now rendered as button-like status cards */}
      <div className="candidate-status-cards-container"> {/* Reusing class from Candidates.css */}
        <div className="status-card"> {/* Reusing class from Candidates.css */}
          <span className="status-card-count">{allJobs.length}</span>
          <span className="status-card-label">Total Jobs</span>
        </div>
        <div className="status-card"> {/* Reusing class from Candidates.css */}
          <span className="status-card-count">{allJobs.filter(job => job.status === 'Open').length}</span>
          <span className="status-card-label">Open Positions</span>
        </div>
        <div className="status-card"> {/* Reusing class from Candidates.css */}
          <span className="status-card-count">{allJobs.filter(job => job.status === 'Closed').length}</span>
          <span className="status-card-label">Closed Positions</span>
        </div>
      </div>

      {/* Main Content Area - Form and Table side-by-side */}
      <div className="jobs-main-content fixed-grid">
        {/* Left Column: Create New Job Form */}
        <div className="jobs-form card">
          <h2 className="form-title">Create New Job</h2>
          <form id="jobForm" onSubmit={handleSubmit}>
            <div className="form-box">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                name="title"
                placeholder="e.g., Software Engineer"
                value={formData.title}
                onChange={handleChange}
                className="jobs-input"
              />

              <label htmlFor="jobDescription">Description</label>
              <textarea
                id="jobDescription"
                name="description"
                placeholder="Detailed job description"
                value={formData.description}
                onChange={handleChange}
                className="jobs-textarea"
                rows="4"
              ></textarea>

              <label htmlFor="jobDomain">Domain</label>
              <select id="jobDomain" name="domain" value={formData.domain} onChange={handleChange} className="jobs-select">
                <option value="">Select Domain</option>
                {uniqueJobDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>

              <label htmlFor="jobStatus">Status</label>
              <select id="jobStatus" name="status" value={formData.status} onChange={handleChange} className="jobs-select">
                {jobStatusList.filter(s => s !== "All").map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <label htmlFor="salaryRange">Salary Range</label>
              <input
                type="text"
                id="salaryRange"
                name="salaryRange"
                placeholder="e.g., $80,000 - $120,000"
                value={formData.salaryRange}
                onChange={handleChange}
                className="jobs-input"
              />

              {errorMessage && <div className="error-msg">⚠️ {errorMessage}</div>}
              {showMessage && <div className="success-msg">✅ Job successfully added!</div>}
            </div>
            <div className="form-actions">
              <button className="submit-btn" type="submit">
                Create Job
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Job Listings Table */}
        <div className="job-listings-section card">
          <h2 className="table-title">Job Listings</h2>
          <div className="table-box">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')}>Title {getSortIndicator('title')}</th>
                  <th onClick={() => handleSort('domain')}>Domain {getSortIndicator('domain')}</th>
                  <th onClick={() => handleSort('status')}>Status {getSortIndicator('status')}</th>
                  <th onClick={() => handleSort('applicants')}>Applicants {getSortIndicator('applicants')}</th>
                  <th onClick={() => handleSort('postedDate')}>Posted Date {getSortIndicator('postedDate')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr className="no-results-row">
                    <td colSpan="6">
                      <div className="no-results-message">
                        {searchTerm ? "No jobs found matching your search." : "No jobs available. Create a new job to get started!"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        {editingJobId === job.id ? (
                          <input
                            type="text"
                            value={editedJobData?.title || ''}
                            onChange={(e) => handleEditCellChange(e, 'title')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.title
                        )}
                      </td>
                      <td>
                        {editingJobId === job.id ? (
                          <select
                            value={editedJobData?.domain || ''}
                            onChange={(e) => handleEditCellChange(e, 'domain')}
                            className="jobs-select-inline"
                          >
                            {uniqueJobDomains.map((domain) => (
                              <option key={domain} value={domain}>
                                {domain}
                              </option>
                            ))}
                          </select>
                        ) : (
                          job.domain
                        )}
                      </td>
                      <td>
                        {editingJobId === job.id ? (
                          <select
                            value={editedJobData?.status || ''}
                            onChange={(e) => handleEditCellChange(e, 'status')}
                            className="jobs-select-inline"
                          >
                            {jobStatusList.filter(s => s !== "All").map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`status-badge status-badge-${job.status.toLowerCase().replace(/\s/g, '-')}`}>
                            {job.status}
                          </span>
                        )}
                      </td>
                      <td>{job.applicants}</td>
                      <td>{job.postedDate}</td>
                      <td className="actions-cell">
                        {editingJobId === job.id ? (
                          <div className="action-buttons-group">
                            <button onClick={handleSaveClick} className="save-btn">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12L21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M17 21V13H7V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M7 3V8H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Save
                            </button>
                            <button onClick={handleCancelClick} className="cancel-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons-group">
                            <button onClick={() => handleEditClick(job)} className="edit-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M18.5 2.5C18.8978 2.10217 19.4391 1.87868 20 1.87868C20.5609 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43913 22.1213 4C22.1213 4.56087 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteClick(job.id)} className="delete-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          {/* Delete Confirmation Popup */}
          {showDeleteConfirm && (
            <div className="delete-confirm-overlay">
              <div className="delete-confirm-modal">
                <p>Are you sure you want to delete this job?</p>
                <div className="delete-confirm-actions">
                  <button className="confirm-btn" onClick={confirmDelete}>Yes, Delete</button>
                  <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
