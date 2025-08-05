import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import "./Candidates.css";
import { candidateStatusList, baseURL } from '../data';
import { updateCandidateStatus, setCandidates } from '../redux/slices/candidatesSlice';

const candidateTabsStatusList = [
  "All",
  "Requires Action",
  "Interview Pending",
  "Interview Scheduled",
  "Interview Completed",
  "Evaluated",
  "Hired",
  "Rejected",
];

// Candidate Card Component
const CandidateCard = ({ candidate, onViewReport }) => {
  const getStatusBadgeClass = (status) => {
    if (["Requires Action", "Interview Pending"].includes(status)) {
      return "badge-warning";
    } else if (["Rejected", "Offer Rejected", "Cancelled"].includes(status)) {
      return "badge-danger";
    } else if (["Interview Scheduled", "Evaluated", "Hired", "Interview Completed"].includes(status)) {
      return "badge-success";
    } else {
      return "badge-info";
    }
  };

  const renderStatusDisplay = (candidate) => {
    if (candidate.status === "Interview Scheduled" && candidate.interviewDetails?.date && candidate.interviewDetails?.time) {
      return `Scheduled: ${candidate.interviewDetails.date} at ${candidate.interviewDetails.time}`;
    } else if (candidate.status === "Evaluated" && candidate.evaluation?.feedback) {
      // Display evaluation feedback as part of the status
      return `Evaluated: ${candidate.evaluation.score}/10 - ${candidate.evaluation.result}`;
    } else if (candidate.status === "Requires Action" && candidate.aptitude?.score) {
      return `Aptitude: ${candidate.aptitude.score}/100`;
    }
    return candidate.status || 'N/A'; // Default to 'N/A' if status is missing
  };

  return (
    <div className="candidate-card">
      <div className="card-left-content"> {/* Added div for left content */}
        <div className="candidate-info">
          <h3 className="candidate-name">{candidate.name || '-'}</h3>
          <p className="candidate-role">{candidate.jobRole || '-'}</p>
          <p className="candidate-domain">{candidate.domain || '-'}</p>
          {/* Ensure lastUpdated is displayed correctly */}
          <p className="candidate-updated">Last Updated: {candidate.lastUpdated ? new Date(candidate.lastUpdated).toLocaleDateString("en-GB") : '-'}</p>
        </div>
      </div>
      <div className="card-right-actions"> {/* Added div for right actions */}
        <div className="candidate-status">
          <span className={`status-badge ${getStatusBadgeClass(candidate.status)}`}>
            {renderStatusDisplay(candidate)}
          </span>
        </div>
        <button className="view-details-btn" onClick={() => onViewReport(candidate.id)}>
          View Details
        </button>
      </div>
    </div>
  );
};

const CandidatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const allCandidates = useSelector((state) => state.candidates.allCandidates);
  const searchTerm = useSelector((state) => state.search.searchTerm);
  const allJobs = useSelector((state) => state.jobs.allJobs || []); // Get all jobs from Redux

  // States for filters (temporary, before applying)
  const [filters, setFilters] = useState({
    domain: "",
    jobRole: "",
    poc: "",
    minWorkExperience: "", // New filter field
    status: "", // New filter field for dropdown, distinct from tab
  });
  const [activeTab, setActiveTab] = useState("All");

  // States for applied filters (used for actual filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    domain: "",
    jobRole: "",
    poc: "",
    minWorkExperience: "",
    status: "",
  });
  const [appliedTab, setAppliedTab] = useState("All");

  const [itemsPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);

  // Function to fetch candidates from the API
  const fetchCandidates = async () => {
    try {
      const authToken = localStorage.getItem('authToken'); // Get token from local storage
      const headers = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Token ${authToken}`; // Use "Token" prefix for Django Token authentication
      } else {
        // If no token, log out or redirect to login
        console.error("No authentication token found. Please log in.");
        navigate('/login'); // Redirect to login page
        return;
      }

      const response = await fetch(`${baseURL}/api/candidates/`, { headers });
      if (!response.ok) {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        throw new Error(`Failed to fetch candidates: ${response.statusText}`);
      }
      const data = await response.json();

      let fetchedApiCandidates = data;

      // Map API response to Redux state structure
      const formattedCandidates = fetchedApiCandidates.map(candidate => ({
        id: candidate.id,
        name: candidate.full_name || '-',
        email: candidate.email || '-',
        phone: candidate.phone || '-',
        domain: candidate.domain || '-',
        jobRole: candidate.job_title || '-', // Map job_title to jobRole
        poc: candidate.poc_email || '-', // Map poc_email to poc
        workExperience: candidate.work_experience || 0, // Ensure it's a number
        status: candidate.status || 'NEW', // Default status if not provided
        lastUpdated: candidate.last_updated, // Keep as is, will be formatted in CandidateCard
        applicationDate: candidate.created_at, // Add applicationDate
        resumes: candidate.resume_url ? [{ name: candidate.resume_url.split('/').pop(), url: candidate.resume_url }] : [], // Handle single resume_url
        interviewDetails: candidate.interview_details || null, // Ensure this is null if no data
        evaluation: candidate.evaluation_details || null, // Ensure this is null if no data
        aptitude: candidate.aptitude_details || null,
        brChats: candidate.br_chats || [],
      }));
      dispatch(setCandidates(formattedCandidates)); // Update Redux store
    } catch (error) {
      console.error("Error fetching candidates:", error);
      // Optionally set an error message state here to display to the user
    }
  };

  // Fetch candidates on component mount and when jobs data changes (user data is no longer a dependency for filtering)
  useEffect(() => {
    // We still want to fetch candidates if jobs are loaded, as job titles are used in candidate data
    if (allJobs.length > 0) {
      fetchCandidates();
    }
  }, [dispatch, navigate, allJobs]); // Removed loggedInUser dependencies

  // Dynamically generate unique filter options from allCandidates
  const uniqueDomains = useMemo(() => {
    const domains = new Set(allCandidates.map(c => c.domain).filter(Boolean));
    return Array.from(domains).sort();
  }, [allCandidates]);

  const uniqueJobRoles = useMemo(() => {
    const jobRoles = new Set(allCandidates.map(c => c.jobRole).filter(Boolean));
    return Array.from(jobRoles).sort();
  }, [allCandidates]);

  const uniquePocs = useMemo(() => {
    const pocs = new Set(allCandidates.map(c => c.poc).filter(Boolean));
    return Array.from(pocs).sort();
  }, [allCandidates]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(allCandidates.map(c => c.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [allCandidates]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // When a tab is clicked, also update the status filter in the dropdown
    setFilters(prev => ({ ...prev, status: tab === "All" ? "" : tab }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setAppliedTab(activeTab); // Keep appliedTab for the visual active tab
    setCurrentPage(1); // Reset pagination on filter application
  };

  const handleClearFilters = () => {
    setFilters({
      domain: "",
      jobRole: "",
      poc: "",
      minWorkExperience: "",
      status: "",
    });
    setActiveTab("All");
    setAppliedFilters({
      domain: "",
      jobRole: "",
      poc: "",
      minWorkExperience: "",
      status: "",
    });
    setAppliedTab("All");
    setCurrentPage(1); // Reset pagination on clearing filters
  };

  const handleViewDetails = (id) => {
    navigate(`/candidates/${id}`);
  };

  // Filter candidates based on applied tab and applied search term
  const filteredCandidates = allCandidates.filter((candidate) => {
    const lowerCaseSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';
    const lowerCaseCandidateName = candidate.name ? candidate.name.toLowerCase() : '';
    const lowerCaseCandidateEmail = candidate.email ? candidate.email.toLowerCase() : '';
    const lowerCaseCandidateDomain = candidate.domain ? candidate.domain.toLowerCase() : '';
    const lowerCaseCandidateJobRole = candidate.jobRole ? candidate.jobRole.toLowerCase() : '';
    const lowerCaseCandidatePoc = candidate.poc ? candidate.poc.toLowerCase() : '';
    const lowerCaseCandidateStatus = candidate.status ? candidate.status.toLowerCase() : '';

    // Search term filter (global search bar)
    const matchesSearchTerm =
      !searchTerm ||
      lowerCaseCandidateName.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateEmail.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateDomain.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateJobRole.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidatePoc.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateStatus.includes(lowerCaseSearchTerm);

    // Tab filter
    const matchesTab = appliedTab === "All" || lowerCaseCandidateStatus === appliedTab.toLowerCase();

    // Form filters
    const matchesDomain = appliedFilters.domain === "" || lowerCaseCandidateDomain === appliedFilters.domain.toLowerCase();
    const matchesJobRole = appliedFilters.jobRole === "" || lowerCaseCandidateJobRole === appliedFilters.jobRole.toLowerCase();
    const matchesPoc = appliedFilters.poc === "" || lowerCaseCandidatePoc === appliedFilters.poc.toLowerCase();
    const matchesStatusDropdown = appliedFilters.status === "" || lowerCaseCandidateStatus === appliedFilters.status.toLowerCase();

    const matchesWorkExperience = appliedFilters.minWorkExperience === "" ||
      (candidate.workExperience !== null && candidate.workExperience >= parseInt(appliedFilters.minWorkExperience, 10));

    return matchesSearchTerm && matchesTab && matchesDomain && matchesJobRole && matchesPoc && matchesWorkExperience && matchesStatusDropdown;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="candidate-page-wrapper">
      <div className="candidates-main-content fixed-grid"> {/* Main content grid */}
        {/* Filter Sidebar */}
        <div className="filter-sidebar-section card">
          <div className="filter-header">
            <h3>Filters</h3>
            <button className="clear-filters" onClick={handleClearFilters}>Clear Filters</button>
          </div>
          <div className="form-box"> {/* Using form-box for consistent styling */}
            <div className="filter-group">
              <label htmlFor="domainFilter">Domain</label>
              <select
                id="domainFilter"
                name="domain"
                value={filters.domain}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">All Domains</option>
                {uniqueDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="jobRoleFilter">Job Role</label>
              <select
                id="jobRoleFilter"
                name="jobRole"
                value={filters.jobRole}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">All Job Roles</option>
                {uniqueJobRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="pocFilter">POC</label>
              <select
                id="pocFilter"
                name="poc"
                value={filters.poc}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">All POCs</option>
                {uniquePocs.map((poc) => (
                  <option key={poc} value={poc}>
                    {poc}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="minWorkExperienceFilter">Min. Work Experience (Years)</label>
              <input
                type="number"
                id="minWorkExperienceFilter"
                name="minWorkExperience"
                placeholder="e.g., 5"
                value={filters.minWorkExperience}
                onChange={handleFilterChange}
                className="add-candidates-input"
                min="0"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions"> {/* Using form-actions for consistent button styling */}
            <button className="submit-btn" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>

        {/* Candidate Details Section */}
        <div className="candidate-details-section card">
          {/* Status Tabs - Moved inside candidate-details-section */}
          <div className="candidate-status-tabs-container">
            {candidateTabsStatusList.map((tab) => (
              <div
                key={tab}
                className={`status-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <h2 className="section-title">Candidate List</h2>
          <div className="candidate-list"> {/* This is the grid for cards */}
            {currentCandidates.length > 0 ? (
              currentCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onViewReport={handleViewDetails}
                />
              ))
            ) : (
              <p className="no-results">No Candidates Found Matching Your Filters.</p>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredCandidates.length > itemsPerPage && (
            <div className="pagination-container">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`pagination-page-number ${currentPage === i + 1 ? "active" : ""}`}
                >
                  {i + 1}
                </button>
              ))}\
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidatePage;
