import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import "./AddCandidates.css";
import { baseURL } from "../data";
import { FaTrash, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { fetchJobs, fetchDomains } from '../redux/slices/jobsSlice';
import Modal, { ConfirmModal } from './common/Modal';
import { useNotification } from '../hooks/useNotification';

const AddCandidates = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notify = useNotification();
  const searchTerm = useSelector((state) => state.search.searchTerm);
  const loggedInUser = useSelector((state) => state.user.user);
  const userRole = loggedInUser?.role;
  const userEmail = loggedInUser?.email;
  const userCompany = loggedInUser?.company_name;

  // Get jobs and domains from Redux store
  const allJobs = useSelector((state) => state.jobs.allJobs || []);
  const domains = useSelector((state) => state.jobs.domains || []);
  const jobsStatus = useSelector((state) => state.jobs.jobsStatus);
  const domainsStatus = useSelector((state) => state.jobs.domainsStatus);

  // Fetch jobs and domains on component mount if not already loaded
  useEffect(() => {
    if (jobsStatus === 'idle') {
      dispatch(fetchJobs());
    }
    if (domainsStatus === 'idle') {
      dispatch(fetchDomains());
    }
  }, [jobsStatus, domainsStatus, dispatch]);

  const [formData, setFormData] = useState({
    domain: "", // This will be the domain ID from the dropdown
    job_title: "", // This will be the job ID from the dropdown
    poc_email: userRole === 'RECRUITER' || userRole === 'HIRING_AGENCY' ? userEmail : "",
    resumes: [],
  });

  const fileInputRef = useRef(null);

  // State for parsed resume data from the 'extract' step
  const [parsedResumeData, setParsedResumeData] = useState([]);
  const [isUploading, setIsUploading] = useState(false); // For the 'extract' step
  const [isSubmittingCandidates, setIsSubmittingCandidates] = useState(false); // For the 'submit' step

  // Use a temporary ID for client-side editing of parsed data
  const [editingCandidateTempId, setEditingCandidateTempId] = useState(null);
  const [editedCandidateData, setEditedCandidateData] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTempId, setDeleteTempId] = useState(null); // Use temp ID for delete
  const [showDeleteModalOverlay, setShowDeleteModalOverlay] = useState(false);

  // New state for extraction summary cards
  const [extractionSummary, setExtractionSummary] = useState({
    total_files: 0,
    successful_extractions: 0,
    failed_extractions: 0,
  });

  // NEW: State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // State for mobile view and expand functionality
  const [isMobileView, setIsMobileView] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null); // null, 'files', 'successful', 'failed', 'add'

  // State for filtered jobs based on selected domain
  const [filteredJobsByDomain, setFilteredJobsByDomain] = useState([]);

  // Effect to detect mobile screen size
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Effect to update filteredJobsByDomain when domain or allJobs changes
  useEffect(() => {
    if (formData.domain && allJobs.length > 0) {
      const selectedDomainId = parseInt(formData.domain, 10);
      const jobsInSelectedDomain = allJobs.filter(job => job.domain === selectedDomainId);
      setFilteredJobsByDomain(jobsInSelectedDomain);
    } else {
      setFilteredJobsByDomain([]);
    }
    // Reset job title when domain changes
    setFormData(prev => ({ ...prev, job_title: "" }));
  }, [formData.domain, allJobs]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10); // Changed to 10 files max
    setFormData((prev) => ({ ...prev, resumes: files }));
  };

  const validateForm = () => {
    if (!formData.domain) {
      notify.error("Domain is required");
      return false;
    }
    // New validation: Check if selected domain ID exists in the domains list
    const selectedDomainExists = domains.some(d => d.id === parseInt(formData.domain, 10));
    if (!selectedDomainExists) {
      notify.error("Selected domain is invalid or no longer exists.");
      return false;
    }

    if (!formData.job_title) {
      notify.error("Job title is required");
      return false;
    }
    // New validation: Check if selected job title ID exists in the filteredJobsByDomain list
    const selectedJobExists = filteredJobsByDomain.some(job => job.id === parseInt(formData.job_title, 10));
    if (!selectedJobExists) {
      notify.error("Selected job title is invalid or no longer exists for the chosen domain.");
      return false;
    }

    if (!formData.poc_email) {
      notify.error("POC email is required");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.poc_email)) {
      notify.error("Please enter a valid POC email");
      return false;
    }
    if (formData.resumes.length === 0) {
      notify.error("At least one resume is required");
      return false;
    }
    return true;
  };

  // Function to handle bulk resume upload and extraction
  const handleBulkResumeUpload = async (e) => {
    e.preventDefault();
    setShowSuccessModal(false); // Clear any previous success modal

    if (!validateForm()) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      notify.error("Please log in to upload resumes.");
      navigate('/login');
      return;
    }

    setIsUploading(true);

    const uploadPayload = new FormData();
    // Get domain name from ID
    const selectedDomainName = domains.find(d => d.id === parseInt(formData.domain, 10))?.name;
    // Get job title from ID
    const selectedJobTitle = allJobs.find(job => job.id === parseInt(formData.job_title, 10))?.job_title;

    uploadPayload.append("domain", selectedDomainName); // Send domain name
    uploadPayload.append("role", selectedJobTitle); // Send job title (role)

    formData.resumes.forEach((file) => {
      uploadPayload.append("resume_files", file);
    });

    try {
      const response = await axios.post(
        `${baseURL}/api/candidates/bulk-create/?step=extract`, // New API endpoint
        uploadPayload,
        {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Bulk upload and extract response:", response.data);
      // Set parsed resume data and extraction summary
      // Add a temporary unique ID to each parsed candidate for client-side operations
      const parsedDataWithTempId = (response.data.extracted_candidates || []).map(candidate => ({
        ...candidate,
        tempId: crypto.randomUUID() // Generate a unique ID for client-side use
      }));
      setParsedResumeData(parsedDataWithTempId);
      setExtractionSummary(response.data.summary || { total_files: 0, successful_extractions: 0, failed_extractions: 0 });

      notify.success("Resumes uploaded and parsed successfully! Review the extracted data below.");
    } catch (error) {
      console.error("Bulk upload and extract error:", error.response?.data || error.message);
      notify.error(error.response?.data?.message || "Failed to upload and parse resumes. Please try again.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle submitting candidates from parsed data
  const handleSubmitCandidates = async () => {
    if (parsedResumeData.length === 0) {
      notify.error("No candidate data to submit");
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      notify.error("Please log in to submit candidates.");
      navigate('/login');
      return;
    }

    setIsSubmittingCandidates(true);
    setShowSuccessModal(false); // Clear any previous success modal

    // Get domain name from ID
    const selectedDomainName = domains.find(d => d.id === parseInt(formData.domain, 10))?.name;
    // Get job title from ID
    const selectedJobTitle = allJobs.find(job => job.id === parseInt(formData.job_title, 10))?.job_title;


    // Filter candidates with >70% matching
    const eligibleCandidates = parsedResumeData.filter(candidate => {
      const matchingPercentage = candidate.extracted_data.job_matching?.overall_match || 0;
      return matchingPercentage >= 70;
    });

    if (eligibleCandidates.length === 0) {
      notify.error("No candidates meet the 70% matching threshold. Please review the resume matching scores.");
      setIsSubmittingCandidates(false);
      return;
    }

    if (eligibleCandidates.length < parsedResumeData.length) {
      const excludedCount = parsedResumeData.length - eligibleCandidates.length;
      notify.warning(`${excludedCount} candidate(s) were excluded due to low matching scores (<70%). Only ${eligibleCandidates.length} candidate(s) will be added.`);
    }

    const candidatesToSubmit = eligibleCandidates.map(candidate => ({
      filename: candidate.filename,
      edited_data: {
        // Use the keys expected by the API as per your example payload
        name: candidate.extracted_data.name || "",
        email: candidate.extracted_data.email || "",
        phone: candidate.extracted_data.phone || "",
        work_experience: candidate.extracted_data.work_experience || 0,
        // Include other fields if they are part of the API's expected edited_data structure
        current_company: candidate.extracted_data.current_company || "",
        current_role: candidate.extracted_data.current_role || "",
        expected_salary: candidate.extracted_data.expected_salary || 0,
        notice_period: candidate.extracted_data.notice_period || 0,
      }
    }));

    const submissionPayload = {
      domain: selectedDomainName, // Send domain name
      role: selectedJobTitle, // Send job title (role)
      poc_email: formData.poc_email,
      candidates: candidatesToSubmit,
    };

    try {
      const response = await axios.post(
        `${baseURL}/api/candidates/bulk-create/?step=submit`, // New API endpoint
        submissionPayload,
        {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Bulk candidates submission response:", response.data);

      // Display success message if any candidates were successfully created
      if (response.data.summary.successful_creations > 0) {
        notify.success("Candidates added successfully!");
        setShowSuccessModal(true); // Show the new success modal
        // Clear parsed data after successful submission
        setParsedResumeData([]);
        setExtractionSummary({ total_files: 0, successful_extractions: 0, failed_extractions: 0 });
        // Reset form fields
        setFormData({
          domain: "",
          job_title: "",
          poc_email: userRole === 'RECRUITER' || userRole === 'HIRING_AGENCY' ? userEmail : "",
          resumes: [],
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        notify.error(response.data.message || "No candidates were successfully added.");
      }

      // No need for setTimeout here, modal will be closed by user
    } catch (error) {
      console.error("Submit candidates error:", error.response?.data || error.message);
      notify.error(error.response?.data?.message || "Failed to submit candidates. Please try again.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsSubmittingCandidates(false);
    }
  };

  // NEW: Function to close the success modal
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // Modified handleDeleteClick to work with parsedResumeData (client-side)
  const handleDeleteClick = async (tempId) => {
    setDeleteTempId(tempId);
    setShowDeleteModalOverlay(true);
    setShowDeleteConfirm(true);
  };

  // Modified confirmDelete to work with parsedResumeData (client-side)
  const confirmDelete = () => {
    if (!deleteTempId) return;

    setParsedResumeData(prev => prev.filter(c => c.tempId !== deleteTempId));
    setShowDeleteModalOverlay(false);
    setShowDeleteConfirm(false);
    setDeleteTempId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModalOverlay(false);
    setShowDeleteConfirm(false);
    setDeleteTempId(null);
  };

  // Modified handleEditClick to work with parsedResumeData (client-side)
  const handleEditClick = (candidate) => {
    setEditingCandidateTempId(candidate.tempId);
    // Ensure all fields are present in editedCandidateData, even if empty
    setEditedCandidateData({
      ...candidate.extracted_data, // Edit the extracted_data part
      filename: candidate.filename, // Keep filename for reference
      tempId: candidate.tempId // Keep tempId for identification
    });
  };

  // Modified handleEditCellChange to update editedCandidateData
  const handleEditCellChange = (e, field) => {
    const newValue = e.target.value;
    setEditedCandidateData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  // Modified handleSaveClick to update parsedResumeData (client-side)
  const handleSaveClick = () => {
    if (!editedCandidateData || !editingCandidateTempId) return;

    setParsedResumeData(prev =>
      prev.map(c =>
        c.tempId === editingCandidateTempId
          ? {
              ...c,
              extracted_data: {
                name: editedCandidateData.name,
                email: editedCandidateData.email,
                phone: editedCandidateData.phone,
                work_experience: editedCandidateData.work_experience,
                current_company: editedCandidateData.current_company,
                current_role: editedCandidateData.current_role,
                expected_salary: editedCandidateData.expected_salary,
                notice_period: editedCandidateData.notice_period,
              }
            }
          : c
      )
    );
    setEditingCandidateTempId(null);
    setEditedCandidateData(null);
  };

  const handleCancelEdit = () => {
    setEditingCandidateTempId(null);
    setEditedCandidateData(null);
  };

  // Helper function to get domain name by ID
  const getDomainName = (domainId) => {
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.name : `Domain ${domainId}`;
  };

  // Helper function to get job title by ID
  const getJobTitle = (jobId) => {
    const job = allJobs.find(j => j.id === jobId);
    return job ? job.job_title : `Job ${jobId}`;
  };

  // Helper function to get domain ID by name (not used in this version for editing)
  const getDomainId = (domainName) => {
    const domain = domains.find(d => d.name === domainName);
    return domain ? domain.id : '';
  };

  // Helper function to get job ID by title (not used in this version for editing)
  const getJobId = (jobTitle) => {
    const job = allJobs.find(j => j.job_title === jobTitle);
    return job ? job.id : '';
  };

  // Function to handle card/button clicks on mobile
  const handleCardClick = (cardType) => {
    if (selectedCard === cardType) {
      // If same card clicked, collapse
      setSelectedCard(null);
      setIsExpanded(false);
    } else {
      // If different card clicked, select it
      setSelectedCard(cardType);
      // Only set expanded to true for Add Candidate button
      setIsExpanded(cardType === 'add');
    }
  };

  // Check if any modal is open for blur effect
  const isAnyModalOpen = showSuccessModal || showDeleteModalOverlay || showDeleteConfirm;

  return (
    <>
      <div className={`add-candidates-container ${isAnyModalOpen ? 'blur-background' : ''}`}>
      <div className="add-candidates-top-section">
        {isMobileView ? (
          <>
            <div className="mobile-cards-container">
              <div className="mobile-cards-row">
                <div className="mobile-cards-icons">
                  {selectedCard === 'files' ? (
                    <div className="mobile-selected-icon">
                      <div className="icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="selected-content">
                        <span className="selected-title">Total Files</span>
                        <span className="selected-number">{extractionSummary.total_files}</span>
                      </div>
                      <button className="mobile-close-btn" onClick={() => handleCardClick('files')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ) : selectedCard === 'successful' ? (
                    <div className="mobile-selected-icon">
                      <div className="icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="selected-content">
                        <span className="selected-title">Successful Extractions</span>
                        <span className="selected-number">{extractionSummary.successful_extractions}</span>
                      </div>
                      <button className="mobile-close-btn" onClick={() => handleCardClick('successful')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ) : selectedCard === 'failed' ? (
                    <div className="mobile-selected-icon">
                      <div className="icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="selected-content">
                        <span className="selected-title">Failed Extractions</span>
                        <span className="selected-number">{extractionSummary.failed_extractions}</span>
                      </div>
                      <button className="mobile-close-btn" onClick={() => handleCardClick('failed')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={`mobile-card-icon ${selectedCard === 'files' ? 'selected' : ''}`} onClick={() => handleCardClick('files')}>
                        <div className="icon-wrapper">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="icon-number">{extractionSummary.total_files}</span>
                      </div>
                      <div className={`mobile-card-icon ${selectedCard === 'successful' ? 'selected' : ''}`} onClick={() => handleCardClick('successful')}>
                        <div className="icon-wrapper">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="icon-number">{extractionSummary.successful_extractions}</span>
                      </div>
                      <div className={`mobile-card-icon ${selectedCard === 'failed' ? 'selected' : ''}`} onClick={() => handleCardClick('failed')}>
                        <div className="icon-wrapper">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="icon-number">{extractionSummary.failed_extractions}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button className={`mobile-add-candidate-btn ${selectedCard === 'add' ? 'selected' : ''}`} onClick={() => handleCardClick('add')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="button-text">
                  <span>Add</span>
                  <span>Candidate</span>
                </div>
              </button>
            </div>
            
            {/* Show Add Candidate form below when Add Candidate button is selected */}
            {selectedCard === 'add' && (
              <div className="mobile-selected-card">
                <div className="add-candidates-form card">
                  <h2 className="form-title">Add New Candidate</h2>
                  <form id="candidateForm" onSubmit={handleBulkResumeUpload}>
                    <div className="form-box">
                      <div className="form-group">
                        <label htmlFor="domainSelect">Domain <span className="required-field">*</span></label>
                        <select
                          id="domainSelect"
                          name="domain"
                          value={formData.domain}
                          onChange={handleChange}
                          className="add-candidates-select"
                          required
                          disabled={domainsStatus === 'loading'}
                        >
                          <option value="">Select Domain</option>
                          {domains.map((domain) => (
                            <option key={domain.id} value={domain.id}>
                              {domain.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="jobTitleSelect">Job Title <span className="required-field">*</span></label>
                        <select
                          id="jobTitleSelect"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                          className="add-candidates-select"
                          required
                          disabled={!formData.domain || jobsStatus === 'loading'}
                        >
                          <option value="">Select Job Title</option>
                          {filteredJobsByDomain.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.job_title} ({job.company_name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="pocEmail">POC Email <span className="required-field">*</span></label>
                        <input
                          type="email"
                          id="pocEmail"
                          name="poc_email"
                          placeholder="Point of contact email"
                          value={formData.poc_email}
                          onChange={handleChange}
                          className="add-candidates-input"
                          required
                          readOnly={userRole === 'RECRUITER' || userRole === 'HIRING_AGENCY'}
                        />
                      </div>

                      <div className="form-group resume-upload">
                        <label htmlFor="resumeUploadInput" className="resume-upload-label">
                          <p className="resume-upload-text">Upload Resumes (Max 10) <span className="required-field">*</span></p>
                          <div className="upload-icon-container">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 13V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          {formData.resumes.length > 0 ? (
                            <p className="selected-files-text resume-upload-text">
                              Selected: {formData.resumes.map((file) => file.name).join(", ")}
                            </p>
                          ) : (
                            <p className="selected-files-text resume-upload-text">No files selected</p>
                          )}
                        </label>
                        <input
                          type="file"
                          id="resumeUploadInput"
                          accept=".pdf,.doc,.docx"
                          multiple
                          ref={fileInputRef}
                          onChange={handleResumeChange}
                          style={{ display: "none" }}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        className="submit-btn"
                        type="submit"
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading & Parsing...' : 'Upload & Parse Resumes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="add-candidates-header-cards">
            <div className="add-candidates-card">
              <h3>Total Files</h3>
              <p>{extractionSummary.total_files}</p>
            </div>
            <div className="add-candidates-card">
              <h3>Successful Extractions</h3>
              <p>{extractionSummary.successful_extractions}</p>
            </div>
            <div className="add-candidates-card">
              <h3>Failed Extractions</h3>
              <p>{extractionSummary.failed_extractions}</p>
            </div>
          </div>
        )}
      </div>

      <div className={`add-candidates-main-content fixed-grid ${isMobileView && !isExpanded ? 'mobile-collapsed' : ''}`}>
        <div className="add-candidates-form card">
          <h2 className="form-title">Add New Candidate</h2>
          <form id="candidateForm" onSubmit={handleBulkResumeUpload}>
            <div className="form-box">
              <div className="form-group">
                <label htmlFor="domainSelect">Domain <span className="required-field">*</span></label>
                <select
                  id="domainSelect"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="add-candidates-select"
                  required
                  disabled={domainsStatus === 'loading'}
                >
                  <option value="">Select Domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="jobTitleSelect">Job Title <span className="required-field">*</span></label>
                <select
                  id="jobTitleSelect"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="add-candidates-select"
                  required
                  disabled={!formData.domain || jobsStatus === 'loading'}
                >
                  <option value="">Select Job Title</option>
                  {filteredJobsByDomain.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_title} ({job.company_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pocEmail">POC Email <span className="required-field">*</span></label>
                <input
                  type="email"
                  id="pocEmail"
                  name="poc_email"
                  placeholder="Point of contact email"
                  value={formData.poc_email}
                  onChange={handleChange}
                  className="add-candidates-input"
                  required
                  readOnly={userRole === 'RECRUITER' || userRole === 'HIRING_AGENCY'}
                />
              </div>

              <div className="form-group resume-upload">
                <label htmlFor="resumeUploadInput" className="resume-upload-label">
                  <p className="resume-upload-text">Upload Resumes (Max 10) <span className="required-field">*</span></p>
                  <div className="upload-icon-container">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {formData.resumes.length > 0 ? (
                    <p className="selected-files-text resume-upload-text">
                      Selected: {formData.resumes.map((file) => file.name).join(", ")}
                    </p>
                  ) : (
                    <p className="selected-files-text resume-upload-text">No files selected</p>
                  )}
                </label>
                <input
                  type="file"
                  id="resumeUploadInput"
                  accept=".pdf,.doc,.docx"
                  multiple
                  ref={fileInputRef}
                  onChange={handleResumeChange}
                  style={{ display: "none" }}
                  required
                />
              </div>

            </div>
            <div className="form-actions">
              <button
                className="submit-btn"
                type="submit"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading & Parsing...' : 'Upload & Parse Resumes'}
              </button>
            </div>
          </form>
        </div>

        {/* Parsed Resume Data Table - Always visible */}
        <div className="preview-section card">
          <div className="table-header-with-button">
            <h2 className="table-title">Parsed Resume Data</h2>
          </div>
          <div className="table-box">
            {/* Removed the inline success message div here */}
            <table className="candidate-table">
              <thead>
                <tr>
                  <th>Filename</th><th>Name</th><th>Email</th><th>Phone</th><th>Experience (Years)</th><th>Domain</th><th>Job Role</th><th>Match %</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedResumeData.length > 0 ? (
                  parsedResumeData.map((candidate) => (
                    <tr 
                      key={candidate.tempId}
                      className={`candidate-row ${candidate.extracted_data.job_matching?.overall_match >= 70 ? 'row-included' : 'row-excluded'}`}
                    >
                      <td>{candidate.filename || '-'}</td>
                      <td>
                        {editingCandidateTempId === candidate.tempId ? (
                          <input
                            type="text"
                            value={editedCandidateData?.name || ''}
                            onChange={(e) => handleEditCellChange(e, 'name')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.extracted_data.name || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateTempId === candidate.tempId ? (
                          <input
                            type="email"
                            value={editedCandidateData?.email || ''}
                            onChange={(e) => handleEditCellChange(e, 'email')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.extracted_data.email || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateTempId === candidate.tempId ? (
                          <input
                            type="tel"
                            value={editedCandidateData?.phone || ''}
                            onChange={(e) => handleEditCellChange(e, 'phone')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.extracted_data.phone || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateTempId === candidate.tempId ? (
                          <input
                            type="number"
                            value={editedCandidateData?.work_experience || ''}
                            onChange={(e) => handleEditCellChange(e, 'work_experience')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.extracted_data.work_experience || '-'
                        )}
                      </td>
                      {/* Display Domain from formData, not editable */}
                      <td>{getDomainName(parseInt(formData.domain, 10)) || '-'}</td>
                      {/* Display Job Role from formData, not editable */}
                      <td>{getJobTitle(parseInt(formData.job_title, 10)) || '-'}</td>
                      {/* Display Matching Percentage */}
                      <td>
                        {candidate.extracted_data.job_matching ? (
                          <div className="match-percentage">
                            <span 
                              className={`match-score ${candidate.extracted_data.job_matching.overall_match >= 70 ? 'high' : 'low'}`}
                              title={`Overall: ${candidate.extracted_data.job_matching.overall_match}%
Skills: ${candidate.extracted_data.job_matching.skill_match}%
Text Similarity: ${candidate.extracted_data.job_matching.text_similarity}%
Experience: ${candidate.extracted_data.job_matching.experience_match}%`}
                            >
                              {candidate.extracted_data.job_matching.overall_match}%
                            </span>
                            {candidate.extracted_data.job_matching.error && (
                              <div className="match-error" title={candidate.extracted_data.job_matching.error}>
                                ⚠️
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="actions-cell">
                        {editingCandidateTempId === candidate.tempId ? (
                          <div className="action-buttons-group">
                            <button onClick={handleSaveClick} className="save-btn" title="Save">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12L21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M17 21V13H7V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M7 3V8H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button onClick={handleCancelEdit} className="cancel-btn" title="Cancel">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons-group">
                            <button
                              onClick={() => handleEditClick(candidate)}
                              className="edit-btn"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(candidate.tempId)}
                              className="delete-btn"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="empty-table-message">
                      <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 13V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>No parsed candidates found. Upload resumes to see details.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {parsedResumeData.length > 0 && (
            <div className="table-actions">
              <button
                className="submit-candidates-btn"
                onClick={handleSubmitCandidates}
                disabled={isSubmittingCandidates}
              >
                {isSubmittingCandidates ? 'Submitting Candidates...' : 'Submit All Candidates'}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Modals outside the main container to avoid blur effect */}
      <ConfirmModal
        isOpen={showDeleteModalOverlay}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="btn-danger"
      />

      <Modal
        isOpen={showSuccessModal}
        onClose={closeSuccessModal}
        title="Success!"
        size="small"
        showFooter={true}
        className="success-modal"
        footer={
          <div className="modal-confirm-actions">
            <button className="common-modal-btn btn-primary" onClick={closeSuccessModal}>
              Close
            </button>
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '1rem' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
          </svg>
          <p>Candidates processed successfully!</p>
        </div>
      </Modal>
    </>
  );
};

export default AddCandidates;
