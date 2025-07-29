// src/components/Jobs.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './Jobs.css'; // Import the new CSS file
import { uniqueJobDomains, jobStatusList, baseURL } from '../data'; // Import data for dropdowns and baseURL
import { addJob, updateJob, deleteJob, setJobs } from '../redux/slices/jobsSlice'; // Import job actions and setJobs

const Jobs = () => {
  const dispatch = useDispatch();
  const allJobs = useSelector((state) => state.jobs.allJobs || []); // Ensure allJobs is an array
  const searchTerm = useSelector((state) => state.search.searchTerm);

  const [formData, setFormData] = useState({
    title: '', // Corresponds to job_title
    description: '', // No direct equivalent, might combine other fields or remove from form
    domain: '', // No direct equivalent from new API, retaining for now
    status: 'Open', // Default status, not directly from API
    salaryRange: '', // No direct equivalent from new API, retaining for now
    closedDate: '', // No direct equivalent from new API, retaining for now
    companyName: '', // New field from API: company_name
    spocEmail: '', // New field from API: spoc_email
    hiringManagerEmail: '', // New field from API: hiring_manager_email
    currentTeamSizeInfo: '', // New field from API: current_team_size_info
    numberToHire: '', // New field from API: number_to_hire
    positionLevel: '', // New field from API: position_level
    workExperience: '', // New field: Work Experience
    // currentProcess: '', // REMOVED FROM UI
    techStackDetails: '', // New field from API: tech_stack_details
    // jdLink: '', // REMOVED FROM UI
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10); // Show 10 records per page, changed from 20

  // Function to fetch jobs from the API
  const fetchJobs = async () => {
    try {
      const response = await fetch(`${baseURL}/api/jobs/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Map API data to match existing structure or extend it
      const formattedJobs = data.map(job => ({
        id: job.id,
        title: job.job_title,
        companyName: job.company_name, // New field
        spocEmail: job.spoc_email, // New field
        hiringManagerEmail: job.hiring_manager_email, // New field
        currentTeamSizeInfo: job.current_team_size_info, // New field
        numberToHire: job.number_to_hire, // New field
        positionLevel: job.position_level, // New field
        workExperience: job.work_experience || '-', // Map new field
        currentProcess: job.current_process, // New field
        techStackDetails: job.tech_stack_details, // New field
        jdLink: job.jd_link, // New field
        postedDate: job.created_at ? job.created_at.slice(0, 10) : 'N/A', // Using created_at as postedDate
        status: 'Open', // Default status as API doesn't provide it directly
        description: '', // Placeholder, as API doesn't provide a direct 'description'
        domain: '', // Placeholder, as API doesn't provide a direct 'domain'
        salaryRange: '', // Placeholder
        closedDate: null, // Placeholder
      }));
      dispatch(setJobs(formattedJobs));
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setErrorMessage("Failed to load jobs.");
    }
  };

  useEffect(() => {
    fetchJobs(); // Initial fetch when component mounts
  }, [dispatch]);


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
      (job.salaryRange && job.salaryRange.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.companyName && job.companyName.toLowerCase().includes(lowerCaseSearchTerm)) || // Search by new fields
      (job.spocEmail && job.spocEmail.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.hiringManagerEmail && job.hiringManagerEmail.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.techStackDetails && job.techStackDetails.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.workExperience && job.workExperience.toLowerCase().includes(lowerCaseSearchTerm)) // Search by workExperience
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

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredJobs.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredJobs.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when search term or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortColumn, sortDirection]);

  // Effect to add/remove 'show' class for modal animations
  useEffect(() => {
    const deleteModalOverlay = document.querySelector('.delete-confirm-overlay');

    if (deleteModalOverlay) {
      if (showDeleteConfirm) {
        deleteModalOverlay.classList.add('show');
      } else {
        deleteModalOverlay.classList.remove('show');
      }
    }
  }, [showDeleteConfirm]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, companyName, spocEmail, hiringManagerEmail, numberToHire, positionLevel, techStackDetails, workExperience } = formData;
    
    // Validate only truly required fields
    if (!title || !companyName || !spocEmail || !hiringManagerEmail || !numberToHire || !positionLevel || !techStackDetails) {
      setErrorMessage('Please fill all required fields: Job Title, Company Name, SPOC Email, Hiring Manager Email, Number to Hire, Position Level, and Tech Stack Details.');
      setShowMessage(false);
      return;
    }
    setErrorMessage('');

    try {
      const response = await fetch(`${baseURL}/api/jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: title,
          company_name: companyName,
          spoc_email: spocEmail,
          hiring_manager_email: hiringManagerEmail,
          current_team_size_info: formData.currentTeamSizeInfo, // This field is already optional in API
          number_to_hire: parseInt(numberToHire, 10), // Convert to number
          position_level: positionLevel,
          work_experience: workExperience || null, // Include workExperience, send null if empty
          current_process: formData.currentProcess || null, // Make currentProcess optional, send null if empty
          tech_stack_details: techStackDetails,
          jd_link: formData.jdLink || null, // Make jdLink optional, send null if empty
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newJobData = await response.json();
      console.log('Job successfully added:', newJobData);

      // Re-fetch all jobs to update the table with the latest data from the API
      await fetchJobs();

      setShowMessage(true);
      // Clear form after successful submission
      setFormData({
        title: '',
        description: '',
        domain: '',
        status: 'Open',
        salaryRange: '',
        closedDate: '',
        companyName: '',
        spocEmail: '',
        hiringManagerEmail: '',
        currentTeamSizeInfo: '',
        numberToHire: '',
        positionLevel: '',
        workExperience: '', // Clear workExperience after submission
        currentProcess: '', // Keep in state for consistency with API structure, but it's not in UI
        techStackDetails: '',
        jdLink: '', // Keep in state for consistency with API structure, but it's not in UI
      });
      setTimeout(() => {
        setShowMessage(false);
      }, 2000);

    } catch (error) {
      console.error("Error adding job:", error);
      setErrorMessage("Failed to add job. Please try again.");
      setShowMessage(false); // Hide success message in case of error
    }
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
      // Add validation for edited fields if necessary
      setErrorMessage('');
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
                placeholder="e.g., Data Analyst"
                value={formData.title}
                onChange={handleChange}
                className="jobs-input"
              />

              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                placeholder="e.g., Insight Analytics"
                value={formData.companyName}
                onChange={handleChange}
                className="jobs-input"
              />

              <label htmlFor="spocEmail">SPOC Email</label>
              <input
                type="email"
                id="spocEmail"
                name="spocEmail"
                placeholder="e.g., hr@example.com"
                value={formData.spocEmail}
                onChange={handleChange}
                className="jobs-input"
              />

              <label htmlFor="hiringManagerEmail">Hiring Manager Email</label>
              <input
                type="email"
                id="hiringManagerEmail"
                name="hiringManagerEmail"
                placeholder="e.g., manager@example.com"
                value={formData.hiringManagerEmail}
                onChange={handleChange}
                className="jobs-input"
              />

              <label htmlFor="numberToHire">Number to Hire</label>
              <input
                type="number"
                id="numberToHire"
                name="numberToHire"
                placeholder="e.g., 2"
                value={formData.numberToHire}
                onChange={handleChange}
                className="jobs-input"
              />

              <label htmlFor="positionLevel">Position Level</label>
              <input
                type="text"
                id="positionLevel"
                name="positionLevel"
                placeholder="e.g., IC, Manager"
                value={formData.positionLevel}
                onChange={handleChange}
                className="jobs-input"
              />

              {/* New Work Experience Field */}
              <label htmlFor="workExperience">Work Experience</label>
              <input
                type="text"
                id="workExperience"
                name="workExperience"
                placeholder="e.g., 3+ years"
                value={formData.workExperience}
                onChange={handleChange}
                className="jobs-input"
              />

              {/* REMOVED: Current Process Field */}
              {/* REMOVED: JD Link Field */}

              <label htmlFor="techStackDetails">Tech Stack Details</label>
              <input
                type="text"
                id="techStackDetails"
                name="techStackDetails"
                placeholder="e.g., SQL, Power BI, Python"
                value={formData.techStackDetails}
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
                  <th onClick={() => handleSort('title')}>Job Title {getSortIndicator('title')}</th>
                  <th onClick={() => handleSort('companyName')}>Company {getSortIndicator('companyName')}</th>
                  <th onClick={() => handleSort('spocEmail')}>SPOC Email {getSortIndicator('spocEmail')}</th>
                  <th onClick={() => handleSort('hiringManagerEmail')}>Hiring Manager Email {getSortIndicator('hiringManagerEmail')}</th>
                  <th onClick={() => handleSort('numberToHire')}>No. to Hire {getSortIndicator('numberToHire')}</th>
                  <th onClick={() => handleSort('positionLevel')}>Level {getSortIndicator('positionLevel')}</th>
                  <th onClick={() => handleSort('workExperience')}>Work Experience {getSortIndicator('workExperience')}</th> {/* New Table Header */}
                  <th onClick={() => handleSort('techStackDetails')}>Tech Stack {getSortIndicator('techStackDetails')}</th>
                  <th onClick={() => handleSort('postedDate')}>Posted Date {getSortIndicator('postedDate')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ? (
                  <tr className="no-results-row">
                    <td colSpan="10"> {/* Updated colspan to account for new column */}
                      <div className="no-results-message">
                        {searchTerm ? "No jobs found matching your search." : "No jobs available. Create a new job to get started!"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((job) => (
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
                          <input
                            type="text"
                            value={editedJobData?.companyName || ''}
                            onChange={(e) => handleEditCellChange(e, 'companyName')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.companyName
                        )}
                      </td>
                      <td>
                        {editingJobId === job.id ? (
                          <input
                            type="email"
                            value={editedJobData?.spocEmail || ''}
                            onChange={(e) => handleEditCellChange(e, 'spocEmail')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.spocEmail
                        )}
                      </td>
                      <td>
                        {editingJobId === job.id ? (
                          <input
                            type="email"
                            value={editedJobData?.hiringManagerEmail || ''}
                            onChange={(e) => handleEditCellChange(e, 'hiringManagerEmail')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.hiringManagerEmail
                        )}
                      </td>
                      <td>
                        {editingJobId === job.id ? (
                          <input
                            type="number"
                            value={editedJobData?.numberToHire || ''}
                            onChange={(e) => handleEditCellChange(e, 'numberToHire')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.numberToHire
                        )}
                      </td>
                      <td>
                        {editingJobId === job.id ? (
                          <input
                            type="text"
                            value={editedJobData?.positionLevel || ''}
                            onChange={(e) => handleEditCellChange(e, 'positionLevel')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.positionLevel
                        )}
                      </td>
                      <td> {/* New Table Data Cell */}
                        {editingJobId === job.id ? (
                          <input
                            type="text"
                            value={editedJobData?.workExperience || ''}
                            onChange={(e) => handleEditCellChange(e, 'workExperience')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.workExperience
                        )}
                      </td>
                      <td>
                        {editingJobId === job.id ? (
                          <input
                            type="text"
                            value={editedJobData?.techStackDetails || ''}
                            onChange={(e) => handleEditCellChange(e, 'techStackDetails')}
                            className="jobs-input-inline"
                          />
                        ) : (
                          job.techStackDetails
                        )}
                      </td>
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
                            </button>
                            <button onClick={handleCancelClick} className="cancel-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons-group">
                            <button onClick={() => handleEditClick(job)} className="edit-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M18.5 2.5C18.8978 2.10217 19.4391 1.87868 20 1.87868C20.5609 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43913 22.1213 4C22.1213 4.56087 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            <button onClick={() => handleDeleteClick(job.id)} className="delete-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          {filteredJobs.length > recordsPerPage && (
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
            <div className={`delete-confirm-overlay ${showDeleteConfirm ? 'show' : ''}`}> {/* Added conditional 'show' class */}
              <div className="delete-confirm-modal">
                <p>Are you sure you want to delete this job?</p>
                <div className="delete-confirm-actions">
                  <button className="delete-btn" onClick={confirmDelete}>Delete</button> {/* Changed button class and text */}
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
