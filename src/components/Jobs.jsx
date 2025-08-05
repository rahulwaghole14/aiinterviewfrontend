// src/components/Jobs.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './Jobs.css'; // Import the new CSS file
import { baseURL } from '../data'; // Import baseURL

const Jobs = () => {
  const dispatch = useDispatch();
  const allJobs = useSelector((state) => state.jobs.allJobs || []); // Ensure allJobs is an array
  const searchTerm = useSelector((state) => state.search.searchTerm);

  // Log jobs data from the slice on every render
  useEffect(() => {
    console.log('Current jobs in Redux slice:', allJobs);
  }, [allJobs]);

  const [formData, setFormData] = useState({
    job_title: '', // Job title for API
    company_name: '', // Company name for API
    domain: '', // Domain ID for API (will be sent as domain)
    spoc_email: '', // SPOC email for API
    hiring_manager_email: '', // Hiring manager email for API
    current_team_size_info: '', // Current team size info for API
    number_to_hire: '', // Number to hire for API
    position_level: '', // Position level for API
    current_process: '', // Current process for API
    tech_stack_details: '', // Tech stack details for API
    jd_file: null, // JD file for API
    jd_link: '', // JD link for API
  });
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Loading states for various operations
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null); // Stores ID of job being deleted
  const [updatingJobId, setUpdatingJobId] = useState(null); // Stores ID of job being updated

  const [isCreatingDomain, setIsCreatingDomain] = useState(false);
  const [updatingDomainId, setUpdatingDomainId] = useState(null); // Stores ID of domain being updated
  const [deletingDomainId, setDeletingDomainId] = useState(null); // Stores ID of domain being deleted


  // Row-wise editing
  const [editingJobId, setEditingJobId] = useState(null);
  const [editedJobData, setEditedJobData] = useState(null);

  // Popup state for deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState(null); // Stores ID of job confirmed for deletion

  // State for sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10); // Show 10 records per page, changed from 20

  // Domain management states
  const [domains, setDomains] = useState([]);
  const [showCreateDomainModal, setShowCreateDomainModal] = useState(false);
  const [showViewDomainsModal, setShowViewDomainsModal] = useState(false);
  const [domainFormData, setDomainFormData] = useState({
    name: '',
    description: ''
  });
  const [editingDomain, setEditingDomain] = useState(null);
  const [domainMessage, setDomainMessage] = useState('');
  const [domainError, setDomainError] = useState('');

  // Function to fetch jobs from the API (with auth token, only if not initialized)
  const fetchJobs = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    try {
      const response = await fetch(`${baseURL}/api/jobs/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Map API data to match existing structure or extend it
      const formattedJobs = data.map(job => ({
        id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        domain: job.domain,
        spoc_email: job.spoc_email,
        hiring_manager_email: job.hiring_manager_email,
        current_team_size_info: job.current_team_size_info,
        number_to_hire: job.number_to_hire,
        position_level: job.position_level,
        current_process: job.current_process,
        tech_stack_details: job.tech_stack_details,
        jd_file: job.jd_file,
        jd_link: job.jd_link,
        created_at: job.created_at,
      }));
      dispatch({ type: 'jobs/setJobs', payload: formattedJobs }); // Use dispatch with action type
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setErrorMessage("Failed to load jobs.");
    }
  };

  useEffect(() => {
    if (!allJobs || allJobs.length === 0) {
      fetchJobs();
    }
    fetchDomains(); // Fetch domains on component mount
  }, [dispatch, allJobs]); // Added allJobs to dependency array to re-fetch if it becomes empty

  // Function to fetch domains from the API
  const fetchDomains = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    try {
      const response = await fetch(`${baseURL}/api/jobs/domains/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDomains(data);
    } catch (error) {
      console.error("Error fetching domains:", error);
      setDomainError("Failed to load domains.");
    }
  };

  // Function to create a new domain
  const createDomain = async (e) => {
    e.preventDefault();
    setIsCreatingDomain(true); // Set loading state
    setDomainMessage(''); // Clear previous messages
    setDomainError(''); // Clear previous errors
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setIsCreatingDomain(false);
      return;
    }
    
    try {
      const response = await fetch(`${baseURL}/api/jobs/domains/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(domainFormData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newDomain = await response.json();
      setDomains([...domains, newDomain]);
      setDomainFormData({ name: '', description: '' });
      setDomainMessage('Domain created successfully!');
      setTimeout(() => setDomainMessage(''), 3000);
      // setShowCreateDomainModal(false); // Keep modal open to show message
    } catch (error) {
      console.error("Error creating domain:", error);
      setDomainError("Failed to create domain.");
      setTimeout(() => setDomainError(''), 3000);
    } finally {
      setIsCreatingDomain(false); // Reset loading state
    }
  };

  // Function to update a domain
  const updateDomain = async (domainId, updatedData) => {
    setUpdatingDomainId(domainId); // Set loading state with domain ID
    setDomainMessage(''); // Clear previous messages
    setDomainError(''); // Clear previous errors
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setUpdatingDomainId(null);
      return;
    }
    
    try {
      const response = await fetch(`${baseURL}/api/jobs/domains/${domainId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedDomain = await response.json();
      setDomains(domains.map(domain => 
        domain.id === domainId ? updatedDomain : domain
      ));
      setEditingDomain(null);
      setDomainMessage('Domain updated successfully!');
      setTimeout(() => setDomainMessage(''), 3000);
    } catch (error) {
      console.error("Error updating domain:", error);
      setDomainError("Failed to update domain.");
      setTimeout(() => setDomainError(''), 3000);
    } finally {
      setUpdatingDomainId(null); // Reset loading state
    }
  };

  // Function to delete a domain
  const deleteDomain = async (domainId) => {
    setDeletingDomainId(domainId); // Set loading state with domain ID
    setDomainMessage(''); // Clear previous messages
    setDomainError(''); // Clear previous errors
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setDeletingDomainId(null);
      return;
    }
    
    try {
      const response = await fetch(`${baseURL}/api/jobs/domains/${domainId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setDomains(domains.filter(domain => domain.id !== domainId));
      setDomainMessage('Domain deleted successfully!');
      setTimeout(() => setDomainMessage(''), 3000);
    } catch (error) {
      console.error("Error deleting domain:", error);
      setDomainError("Failed to delete domain.");
      setTimeout(() => setDomainError(''), 3000);
    } finally {
      setDeletingDomainId(null); // Reset loading state
    }
  };

  // Handle domain form changes
  const handleDomainChange = (e) => {
    const { name, value } = e.target;
    setDomainFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filtered jobs based on search term
  const filteredJobs = allJobs.filter(job => {
    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (job.job_title && job.job_title.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.company_name && job.company_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.domain && getDomainName(job.domain).toLowerCase().includes(lowerCaseSearchTerm)) || // Use getDomainName for searching
      (job.spoc_email && job.spoc_email.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.hiring_manager_email && job.hiring_manager_email.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.current_team_size_info && job.current_team_size_info.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.number_to_hire && String(job.number_to_hire).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.position_level && job.position_level.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.current_process && job.current_process.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.tech_stack_details && job.tech_stack_details.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.jd_link && job.jd_link.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.jd_file && job.jd_file.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (job.created_at && job.created_at.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }).sort((a, b) => { // Apply sorting after filtering
    if (!sortColumn) return 0;

    const aValue = sortColumn === 'domain' ? getDomainName(a[sortColumn]) : a[sortColumn];
    const bValue = sortColumn === 'domain' ? getDomainName(b[sortColumn]) : b[sortColumn];


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

  // Effect for Create Domain Modal animation
  useEffect(() => {
    const createDomainModalOverlay = document.getElementById('create-domain-modal-overlay');
    if (createDomainModalOverlay) {
      if (showCreateDomainModal) {
        createDomainModalOverlay.classList.remove('hidden');
      } else {
        createDomainModalOverlay.classList.add('hidden');
        // Clear messages when modal closes
        setDomainMessage('');
        setDomainError('');
      }
    }
  }, [showCreateDomainModal]);

  // Effect for View Domains Modal animation
  useEffect(() => {
    const viewDomainsModalOverlay = document.getElementById('view-domains-modal-overlay');
    if (viewDomainsModalOverlay) {
      if (showViewDomainsModal) {
        viewDomainsModalOverlay.classList.remove('hidden');
      } else {
        viewDomainsModalOverlay.classList.add('hidden');
        // Clear messages when modal closes
        setDomainMessage('');
        setDomainError('');
      }
    }
  }, [showViewDomainsModal]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingJob(true); // Set loading state
    const { job_title, company_name, domain, spoc_email, hiring_manager_email, current_team_size_info, number_to_hire, position_level, current_process, tech_stack_details, jd_file, jd_link } = formData;
    
    // Validate required fields based on API
    if (!job_title || !company_name || !domain || !spoc_email || !hiring_manager_email || !number_to_hire || !position_level || !tech_stack_details) {
      setErrorMessage('Please fill all required fields: Job Title, Company Name, Domain, SPOC Email, Hiring Manager Email, Number to Hire, Position Level, and Tech Stack Details.');
      setShowMessage(false);
      setIsCreatingJob(false); // Reset loading state on validation error
      return;
    }
    setErrorMessage('');

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/api/jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({
          job_title,
          company_name,
          domain: parseInt(domain, 10),
          spoc_email,
          hiring_manager_email,
          current_team_size_info: current_team_size_info || '',
          number_to_hire: parseInt(number_to_hire, 10),
          position_level,
          current_process: current_process || '',
          tech_stack_details,
          jd_file: jd_file || null,
          jd_link: jd_link || null,
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
        job_title: '',
        company_name: '',
        domain: '',
        spoc_email: '',
        hiring_manager_email: '',
        current_team_size_info: '',
        number_to_hire: '',
        position_level: '',
        current_process: '',
        tech_stack_details: '',
        jd_file: null,
        jd_link: '',
      });
      setTimeout(() => {
        setShowMessage(false);
      }, 2000);

    } catch (error) {
      console.error("Error adding job:", error);
      setErrorMessage("Failed to add job. Please try again.");
      setShowMessage(false); // Hide success message in case of error
    } finally {
      setIsCreatingJob(false); // Reset loading state
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

  const handleSaveClick = async () => {
    if (editedJobData) {
      setUpdatingJobId(editedJobData.id); // Set loading state for job update with specific ID
      setErrorMessage('');
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setErrorMessage("Authentication token not found. Please log in again.");
        setUpdatingJobId(null);
        return;
      }
       // Validate required fields before saving
      const { job_title, company_name, domain, spoc_email, hiring_manager_email, number_to_hire, position_level, tech_stack_details } = editedJobData;
      if (!job_title || !company_name || !domain || !spoc_email || !hiring_manager_email || !number_to_hire || !position_level || !tech_stack_details) {
        setErrorMessage('Please fill all required fields before saving.');
        setUpdatingJobId(null); // Reset loading state on validation error
        return;
      }

      try {
        const response = await fetch(`${baseURL}/api/jobs/${editedJobData.id}/`, {
          method: 'PUT', // Use PUT for full update
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${authToken}`,
          },
          body: JSON.stringify({
            job_title: editedJobData.job_title,
            company_name: editedJobData.company_name,
            domain: parseInt(editedJobData.domain, 10), // Ensure domain is an integer
            spoc_email: editedJobData.spoc_email,
            hiring_manager_email: editedJobData.hiring_manager_email,
            current_team_size_info: editedJobData.current_team_size_info,
            number_to_hire: parseInt(editedJobData.number_to_hire, 10), // Ensure number
            position_level: editedJobData.position_level,
            current_process: editedJobData.current_process,
            tech_stack_details: editedJobData.tech_stack_details,
            jd_file: editedJobData.jd_file,
            jd_link: editedJobData.jd_link,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedJob = await response.json();
        console.log('Job successfully updated:', updatedJob);
        
        // Re-fetch all jobs to update the table with the latest data from the API
        await fetchJobs();

        setEditingJobId(null);
        setEditedJobData(null);
      } catch (error) {
        console.error("Error updating job:", error);
        setErrorMessage("Failed to update job. Please try again.");
      } finally {
        setUpdatingJobId(null); // Reset loading state
      }
    }
  };


  const handleCancelClick = () => {
    setEditingJobId(null);
    setEditedJobData(null);
  };

  const handleDeleteClick = (id) => {
    setJobIdToDelete(id); // Set the ID of the job to be deleted
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (jobIdToDelete !== null) {
      setDeletingJobId(jobIdToDelete); // Set loading state with specific job ID
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setErrorMessage("Authentication token not found. Please log in again.");
        setShowDeleteConfirm(false);
        setDeletingJobId(null); // Reset loading state
        setJobIdToDelete(null);
        return;
      }

      try {
        const response = await fetch(`${baseURL}/api/jobs/${jobIdToDelete}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Job successfully deleted:', jobIdToDelete);
        // Re-fetch all jobs to update the table with the latest data from the API
        await fetchJobs();

        setShowDeleteConfirm(false);
        setJobIdToDelete(null);
      } catch (error) {
        console.error("Error deleting job:", error);
        setErrorMessage("Failed to delete job. Please try again.");
        setShowDeleteConfirm(false);
        setJobIdToDelete(null);
      } finally {
        setDeletingJobId(null); // Reset loading state
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setJobIdToDelete(null);
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

  // Utility function to trim text and show tooltip
  const trimWithTooltip = (text, maxLength = 20) => {
    if (text === null || text === undefined || text === '') return '-'; // Handle null, undefined, empty string
    const str = String(text);
    return str.length > maxLength
      ? <span title={str}>{str.slice(0, maxLength) + '...'}</span>
      : <span title={str}>{str}</span>;
  };

  // Helper function to get domain name by ID
  const getDomainName = (domainId) => {
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.name : `Domain ${domainId}`;
  };

  // Determine if any job operation is in progress (for disabling other buttons)
  const isAnyJobOperationInProgress = isCreatingJob || updatingJobId !== null || deletingJobId !== null;
  // Determine if any domain operation is in progress (for disabling other buttons)
  const isAnyDomainOperationInProgress = isCreatingDomain || updatingDomainId !== null || deletingDomainId !== null;


  return (
    <>
    <div className="jobs-container">
      {/* Domain Management Buttons */}
      <div className="domain-management-section">
        <button 
          type="button" 
          className="domain-btn create-domain-btn"
          onClick={() => {
            setDomainFormData({ name: '', description: '' }); // Reset form data when opening
            setShowCreateDomainModal(true);
          }}
          disabled={isAnyDomainOperationInProgress} // Disable if any domain operation is in progress
        >
          {isCreatingDomain ? 'Adding Domain...' : '+ Add New Domain'}
        </button>
        <button 
          type="button" 
          className="domain-btn view-domains-btn"
          onClick={() => setShowViewDomainsModal(true)}
          disabled={isAnyDomainOperationInProgress} // Disable if any domain operation is in progress
        >
          View All Domains
        </button>
      </div>

      {/* Main page error/success messages (only for job creation) */}
      {errorMessage && !isAnyDomainOperationInProgress && <div className="error-msg">⚠️ {errorMessage}</div>}
      {showMessage && !isAnyDomainOperationInProgress && <div className="success-msg">✅ Job successfully added!</div>}


      {/* Top Section: Header Cards - now rendered as button-like status cards */}
      <div className="candidate-status-cards-container"> {/* Reusing class from Candidates.css */}
        <div className="status-card"> {/* Reusing class from Candidates.css */}
          <span className="status-card-count">{allJobs.length}</span>
          <span className="status-card-label">Total Jobs</span>
        </div>
        {/* Removed "Open Positions" and "Closed Positions" as status is not directly available in the API response */}
      </div>

      {/* Main Content Area - Form and Table side-by-side */}
      <div className="jobs-main-content fixed-grid">
        {/* Left Column: Create New Job Form */}
        <div className="jobs-form card">
          <h2 className="form-title">Create New Job</h2>
          <form id="jobForm" onSubmit={handleSubmit}>
            <div className="form-box">
              <label htmlFor="job_title">Job Title</label>
              <input
                type="text"
                id="job_title"
                name="job_title"
                placeholder="e.g., Data Analyst"
                value={formData.job_title}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              />

              <label htmlFor="company_name">Company Name</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                placeholder="e.g., Insight Analytics"
                value={formData.company_name}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              />

              <label htmlFor="domain">Domain</label>
              <select
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              >
                <option value="">Select a domain</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>

              <label htmlFor="spoc_email">SPOC Email</label>
              <input
                type="email"
                id="spoc_email"
                name="spoc_email"
                placeholder="e.g., hr@insight.com"
                value={formData.spoc_email}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              />

              <label htmlFor="hiring_manager_email">Hiring Manager Email</label>
              <input
                type="email"
                id="hiring_manager_email"
                name="hiring_manager_email"
                placeholder="e.g., lead@insight.com"
                value={formData.hiring_manager_email}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              />

              <label htmlFor="current_team_size_info">Current Team Size Info</label>
              <input
                type="text"
                id="current_team_size_info"
                name="current_team_size_info"
                placeholder="e.g., 5-10"
                value={formData.current_team_size_info}
                onChange={handleChange}
                className="jobs-input"
                disabled={isCreatingJob}
              />

              <label htmlFor="number_to_hire">Number to Hire</label>
              <input
                type="number"
                id="number_to_hire"
                name="number_to_hire"
                placeholder="e.g., 2"
                value={formData.number_to_hire}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              />

              <label htmlFor="position_level">Position Level</label>
              <input
                type="text"
                id="position_level"
                name="position_level"
                placeholder="e.g., IC"
                value={formData.position_level}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              />

              <label htmlFor="current_process">Current Process</label>
              <input
                type="text"
                id="current_process"
                name="current_process"
                placeholder="e.g., Screening, Interview (optional)"
                value={formData.current_process}
                onChange={handleChange}
                className="jobs-input"
                disabled={isCreatingJob}
              />

              <label htmlFor="tech_stack_details">Tech Stack Details</label>
              <input
                type="text"
                id="tech_stack_details"
                name="tech_stack_details"
                placeholder="e.g., SQL, Python, Power BI"
                value={formData.tech_stack_details}
                onChange={handleChange}
                className="jobs-input"
                required
                disabled={isCreatingJob}
              />

              <label htmlFor="jd_file">JD File (URL)</label>
              <input
                type="text"
                id="jd_file"
                name="jd_file"
                placeholder="e.g., https://example.com/jd.pdf (optional)"
                value={formData.jd_file || ''}
                onChange={handleChange}
                className="jobs-input"
                disabled={isCreatingJob}
              />

              <label htmlFor="jd_link">JD Link</label>
              <input
                type="text"
                id="jd_link"
                name="jd_link"
                placeholder="e.g., https://linkedin.com/jobs/123 (optional)"
                value={formData.jd_link}
                onChange={handleChange}
                className="jobs-input"
                disabled={isCreatingJob}
              />

            </div>
            <div className="form-actions">
              <button className="submit-btn" type="submit" disabled={isCreatingJob}>
                {isCreatingJob ? 'Creating Job...' : 'Create Job'}
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
                  <th onClick={() => handleSort('job_title')}>Title{getSortIndicator('job_title')}</th>
                  <th onClick={() => handleSort('company_name')}>Company Name{getSortIndicator('company_name')}</th>
                  <th onClick={() => handleSort('domain')}>Domain Name{getSortIndicator('domain')}</th>
                  <th onClick={() => handleSort('spoc_email')}>SPOC Email{getSortIndicator('spoc_email')}</th>
                  <th onClick={() => handleSort('hiring_manager_email')}>Hiring Manager Email{getSortIndicator('hiring_manager_email')}</th>
                  <th onClick={() => handleSort('current_team_size_info')}>Team Size{getSortIndicator('current_team_size_info')}</th>
                  <th onClick={() => handleSort('number_to_hire')}>No. to Hire{getSortIndicator('number_to_hire')}</th>
                  <th onClick={() => handleSort('position_level')}>Position Level{getSortIndicator('position_level')}</th>
                  <th onClick={() => handleSort('current_process')}>Current Process{getSortIndicator('current_process')}</th>
                  <th onClick={() => handleSort('tech_stack_details')}>Tech Stack{getSortIndicator('tech_stack_details')}</th>
                  <th onClick={() => handleSort('jd_file')}>JD File{getSortIndicator('jd_file')}</th>
                  <th onClick={() => handleSort('jd_link')}>JD Link{getSortIndicator('jd_link')}</th>
                  <th onClick={() => handleSort('created_at')}>Created At{getSortIndicator('created_at')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ? (
                  <tr className="no-results-row">
                    <td colSpan="15">
                      <div className="no-results-message">
                        {searchTerm ? "No jobs found matching your search." : "No jobs available. Create a new job to get started!"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((job) => (
                    <tr key={job.id}>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.job_title} onChange={(e) => handleEditCellChange(e, 'job_title')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.job_title)}</td>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.company_name} onChange={(e) => handleEditCellChange(e, 'company_name')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.company_name)}</td>
                      <td>
                        {editingJobId === job.id ? (
                          <select
                            value={editedJobData.domain}
                            onChange={(e) => handleEditCellChange(e, 'domain')}
                            className="jobs-input"
                            disabled={updatingJobId === job.id}
                          >
                            <option value="">Select a domain</option>
                            {domains.map(domain => (
                              <option key={domain.id} value={domain.id}>
                                {domain.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          trimWithTooltip(getDomainName(job.domain))
                        )}
                      </td>
                      <td>{editingJobId === job.id ? <input type="email" value={editedJobData.spoc_email} onChange={(e) => handleEditCellChange(e, 'spoc_email')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.spoc_email)}</td>
                      <td>{editingJobId === job.id ? <input type="email" value={editedJobData.hiring_manager_email} onChange={(e) => handleEditCellChange(e, 'hiring_manager_email')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.hiring_manager_email)}</td>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.current_team_size_info} onChange={(e) => handleEditCellChange(e, 'current_team_size_info')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.current_team_size_info)}</td>
                      <td>{editingJobId === job.id ? <input type="number" value={editedJobData.number_to_hire} onChange={(e) => handleEditCellChange(e, 'number_to_hire')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.number_to_hire)}</td>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.position_level} onChange={(e) => handleEditCellChange(e, 'position_level')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.position_level)}</td>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.current_process} onChange={(e) => handleEditCellChange(e, 'current_process')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.current_process)}</td>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.tech_stack_details} onChange={(e) => handleEditCellChange(e, 'tech_stack_details')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.tech_stack_details)}</td>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.jd_file} onChange={(e) => handleEditCellChange(e, 'jd_file')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.jd_file)}</td>
                      <td>{editingJobId === job.id ? <input type="text" value={editedJobData.jd_link} onChange={(e) => handleEditCellChange(e, 'jd_link')} className="jobs-input" disabled={updatingJobId === job.id} /> : trimWithTooltip(job.jd_link)}</td>
                      <td>{trimWithTooltip(new Date(job.created_at).toLocaleString())}</td>
                      <td className="actions-cell">
                        {editingJobId === job.id ? (
                          <div className="action-buttons-group">
                            <button onClick={handleSaveClick} className="save-btn" disabled={updatingJobId === job.id}>
                              {updatingJobId === job.id ? 'Saving...' : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12L21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M17 21V13H7V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M7 3V8H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            <button onClick={handleCancelClick} className="cancel-btn" disabled={updatingJobId === job.id}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons-group">
                            <button onClick={() => handleEditClick(job)} className="edit-btn" disabled={isAnyJobOperationInProgress}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M18.5 2.5C18.8978 2.10217 19.4391 1.87868 20 1.87868C20.5609 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43913 22.1213 4C22.1213 4.56087 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            <button onClick={() => handleDeleteClick(job.id)} className="delete-btn" disabled={isAnyJobOperationInProgress}>
                                {deletingJobId === job.id ? 'Deleting...' : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M10 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                )}
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
                disabled={currentPage === 1 || isAnyJobOperationInProgress}
                className="pagination-btn"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                  disabled={isAnyJobOperationInProgress}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages || isAnyJobOperationInProgress}
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
                <p>Are you sure you want to delete this job?</p>
                <div className="delete-confirm-actions">
                  <button className="delete-btn" onClick={confirmDelete} disabled={deletingJobId !== null}>
                    {deletingJobId !== null ? 'Deleting...' : 'Delete'}
                  </button>
                  <button className="cancel-btn" onClick={cancelDelete} disabled={deletingJobId !== null}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>

    {/* Create Domain Modal - Moved outside main container */}
    {showCreateDomainModal && (
      <div id="create-domain-modal-overlay" className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Create New Domain</h3>
            <button 
              className="modal-close-btn"
              onClick={() => setShowCreateDomainModal(false)}
              disabled={isCreatingDomain}
            >
              ×
            </button>
          </div>
          <form onSubmit={createDomain}>
            <div className="modal-body">
              {domainMessage && (
                <div className="success-message">
                  {domainMessage}
                </div>
              )}
              {domainError && (
                <div className="error-message">
                  {domainError}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="domain-name">Domain Name</label>
                <input
                  type="text"
                  id="domain-name"
                  name="name"
                  value={domainFormData.name}
                  onChange={handleDomainChange}
                  placeholder="e.g., Data Science"
                  required
                  className="modal-input"
                  disabled={isCreatingDomain}
                />
              </div>
              <div className="form-group">
                <label htmlFor="domain-description">Description</label>
                <textarea
                  id="domain-description"
                  name="description"
                  value={domainFormData.description}
                  onChange={handleDomainChange}
                  placeholder="e.g., Data Science and Analytics domain"
                  rows="3"
                  required
                  className="modal-input"
                  disabled={isCreatingDomain}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="domain-cancel-btn" onClick={() => setShowCreateDomainModal(false)} disabled={isCreatingDomain}>
                Cancel
              </button>
              <button type="submit" className="domain-submit-btn" disabled={isCreatingDomain}>
                {isCreatingDomain ? 'Creating...' : 'Create Domain'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* View Domains Modal - Moved outside main container */}
    {showViewDomainsModal && (
      <div id="view-domains-modal-overlay" className="modal-overlay">
        <div className="modal-content large-modal">
          <div className="modal-header">
            <h3>All Domains</h3>
            <button 
              className="modal-close-btn"
              onClick={() => setShowViewDomainsModal(false)}
              disabled={isAnyDomainOperationInProgress}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            {domainMessage && (
                <div className="success-message">
                  {domainMessage}
                </div>
              )}
              {domainError && (
                <div className="error-message">
                  {domainError}
                </div>
              )}
            {domains.length === 0 ? (
              <p>No domains found. Create your first domain!</p>
            ) : (
              <div className="domains-list">
                {domains.map(domain => (
                  <div key={domain.id} className="domain-item">
                    {editingDomain === domain.id ? (
                      <div className="domain-edit-form">
                        <label htmlFor={`edit-domain-name-${domain.id}`}>Domain Name</label>
                        <input
                          type="text"
                          id={`edit-domain-name-${domain.id}`}
                          value={domainFormData.name}
                          onChange={handleDomainChange}
                          name="name"
                          className="domain-edit-input"
                          disabled={updatingDomainId === domain.id}
                        />
                        <label htmlFor={`edit-domain-description-${domain.id}`}>Description</label>
                        <textarea
                          id={`edit-domain-description-${domain.id}`}
                          value={domainFormData.description}
                          onChange={handleDomainChange}
                          name="description"
                          className="domain-edit-input"
                          rows="2"
                          disabled={updatingDomainId === domain.id}
                        />
                        <div className="domain-edit-actions">
                          <button 
                            className="save-btn"
                            onClick={() => updateDomain(domain.id, {
                              name: domainFormData.name,
                              description: domainFormData.description,
                              is_active: domain.is_active
                            })}
                            disabled={updatingDomainId === domain.id}
                          >
                            {updatingDomainId === domain.id ? 'Saving...' : 'Save'}
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => setEditingDomain(null)}
                            disabled={updatingDomainId === domain.id}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="domain-info">
                        <div className="domain-details">
                          <h4>{domain.name}</h4>
                          <p>{trimWithTooltip(domain.description, 50)}</p> {/* Trim description for display */}
                          <span className={`domain-status ${domain.is_active ? 'active' : 'inactive'}`}>
                            {domain.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="domain-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => {
                              setEditingDomain(domain.id);
                              setDomainFormData({
                                name: domain.name,
                                description: domain.description
                              });
                            }}
                            disabled={isAnyDomainOperationInProgress}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => deleteDomain(domain.id)}
                            disabled={isAnyDomainOperationInProgress}
                          >
                            {deletingDomainId === domain.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="cancel-btn" onClick={() => setShowViewDomainsModal(false)} disabled={isAnyDomainOperationInProgress}>
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Jobs;
