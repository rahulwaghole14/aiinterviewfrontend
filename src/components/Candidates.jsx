import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { useNotification } from "../hooks/useNotification";
import "./Candidates.css";
import { candidateStatusList, baseURL } from '../data';
import { updateCandidateStatus } from '../redux/slices/candidatesSlice'; // Keep updateCandidateStatus
import { fetchCandidates } from '../redux/slices/candidatesSlice'; // Import fetchCandidates thunk
import { fetchJobs, fetchDomains } from '../redux/slices/jobsSlice'; // Import job and domain thunks

// Status mapping from backend values to frontend display values
const statusMapping = {
  "NEW": "New",
  "INTERVIEW_SCHEDULED": "Interview Scheduled",
  "INTERVIEW_COMPLETED": "Interview Completed",
  "EVALUATED": "Evaluated",
  "REQUIRES_ACTION": "Requires Action",
  "PENDING_SCHEDULING": "Pending Scheduling",
  "BR_IN_PROCESS": "BR In Process",
  "BR_EVALUATED": "BR Evaluated",
  "INTERNAL_INTERVIEWS": "Internal Interviews",
  "OFFERED": "Offered",
  "HIRED": "Hired",
  "REJECTED": "Rejected",
  "OFFER_REJECTED": "Offer Rejected",
  "CANCELLED": "Cancelled",
};

const candidateTabsStatusList = [
  "All",
  "New",
  "Interview Scheduled",
  "Interview Completed",
  "Evaluated",
  "Requires Action",
  "Pending Scheduling",
  "BR In Process",
  "BR Evaluated",
  "Internal Interviews",
  "Offered",
  "Hired",
  "Rejected",
  "Offer Rejected",
  "Cancelled",
];

// Candidate Card Component
const CandidateCard = ({ candidate, onViewReport, getDomainName, getJobTitle }) => { // Pass getDomainName and getJobTitle
  const getStatusBadgeClass = (status) => {
    const displayStatus = statusMapping[status] || status;
    if (["Requires Action", "Pending Scheduling", "BR In Process"].includes(displayStatus)) {
      return "badge-warning";
    } else if (["Rejected", "Offer Rejected", "Cancelled"].includes(displayStatus)) {
      return "badge-danger";
    } else if (["BR Evaluated", "Internal Interviews", "Offered", "Hired", "Interview Scheduled", "Interview Completed", "Evaluated"].includes(displayStatus)) {
      return "badge-success";
    } else {
      return "badge-info";
    }
  };

  const renderStatusDisplay = (candidate) => {
    const displayStatus = statusMapping[candidate.status] || candidate.status;
    if (displayStatus === "Interview Scheduled" && candidate.interviewDetails?.date && candidate.interviewDetails?.time) {
      return `Scheduled: ${candidate.interviewDetails.date} at ${candidate.interviewDetails.time}`;
    } else if (displayStatus === "Interview Completed" && candidate.evaluation?.feedback) {
      return `Completed: ${candidate.evaluation.score}/10 - ${candidate.evaluation.result}`;
    } else if (displayStatus === "Evaluated" && candidate.evaluation?.feedback) {
      return `Evaluated: ${candidate.evaluation.score}/10 - ${candidate.evaluation.result}`;
    } else if (displayStatus === "Pending Scheduling" && candidate.interviewDetails?.date && candidate.interviewDetails?.time) {
      return `Scheduled: ${candidate.interviewDetails.date} at ${candidate.interviewDetails.time}`;
    } else if (displayStatus === "BR Evaluated" && candidate.evaluation?.feedback) {
      return `Evaluated: ${candidate.evaluation.score}/10 - ${candidate.evaluation.result}`;
    } else if (displayStatus === "Requires Action" && candidate.aptitude?.score) {
      return `Aptitude: ${candidate.aptitude.score}/100`;
    }
    return displayStatus || 'N/A';
  };

  return (
    <div className="candidate-card">
      <div className="card-left-content">
        <div className="candidate-info">
          <h3 className="candidate-name">{candidate.full_name || candidate.name || '-'}</h3>
          <p className="candidate-role">{getJobTitle(candidate.jobRole) || '-'}</p> {/* Use helper */}
          <p className="candidate-domain">{getDomainName(candidate.domain) || '-'}</p> {/* Use helper */}
          <p className="candidate-updated">Last Updated: {candidate.lastUpdated ? new Date(candidate.lastUpdated).toLocaleDateString("en-GB") : '-'}</p>
          {/* Display matching percentage if available */}
          {candidate.job_matching && (
            <p className="candidate-match">
              Match: 
              <span 
                className={`match-score ${candidate.job_matching.overall_match >= 80 ? 'high' : candidate.job_matching.overall_match >= 60 ? 'medium' : 'low'}`}
                title={`Overall: ${candidate.job_matching.overall_match}%
Skills: ${candidate.job_matching.skill_match}%
Text Similarity: ${candidate.job_matching.text_similarity}%
Experience: ${candidate.job_matching.experience_match}%`}
              >
                {candidate.job_matching.overall_match}%
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="card-right-actions">
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
  const notify = useNotification();
  const allCandidates = useSelector((state) => state.candidates.allCandidates);
  const candidatesStatus = useSelector((state) => state.candidates.candidatesStatus);
  const candidatesError = useSelector((state) => state.candidates.candidatesError);
  const allJobs = useSelector((state) => state.jobs.allJobs || []);
  const domains = useSelector((state) => state.jobs.domains || []);
  const jobsStatus = useSelector((state) => state.jobs.jobsStatus);
  const domainsStatus = useSelector((state) => state.jobs.domainsStatus);
  const searchTerm = useSelector((state) => state.search.searchTerm);

  const [filters, setFilters] = useState({
    domain: "",
    jobRole: "",
    poc: "",
    minWorkExperience: "",
    status: "",
  });
  const [activeTab, setActiveTab] = useState("All");

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

  // Mobile filter and status dropdown states
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Fetch candidates, jobs, and domains on component mount if not already loaded
  useEffect(() => {
    if (jobsStatus === 'idle') {
      dispatch(fetchJobs());
    }
    if (domainsStatus === 'idle') {
      dispatch(fetchDomains());
    }
    // Only fetch candidates if jobs and domains are succeeded or loading,
    // and candidates themselves are not already loaded/loading.
    // This ensures that job and domain data is available for candidate filtering/mapping.
    if (candidatesStatus === 'idle' && jobsStatus !== 'loading' && domainsStatus !== 'loading') {
      dispatch(fetchCandidates());
    }
  }, [dispatch, candidatesStatus, jobsStatus, domainsStatus]);

  // Show error notification when there's an error
  useEffect(() => {
    if (candidatesError) {
      notify.error(`Error loading candidates: ${candidatesError}`);
    }
  }, [candidatesError, notify]);

  // Helper function to get domain name by ID
  const getDomainName = (domainId) => {
    // If domainId is already a name (string), return it directly
    if (typeof domainId === 'string' && !/^[0-9]+$/.test(domainId)) {
      return domainId;
    }
    
    // If domainId is an ID, try to find the domain name
    const domain = domains.find(d => String(d.id) === String(domainId));
    return domain ? domain.name : (domainId || 'N/A');
  };

  // Helper function to get job title by ID
  const getJobTitle = (jobId) => {
    // If jobId is already a title (string), return it directly
    if (typeof jobId === 'string' && !/^[0-9]+$/.test(jobId)) {
      return jobId;
    }
    
    // If jobId is an ID, try to find the job title
    const job = allJobs.find(j => String(j.id) === String(jobId));
    return job ? job.job_title : (jobId || 'N/A');
  };

  // Dynamically generate unique filter options from allCandidates
  const uniqueDomains = useMemo(() => {
    const domainsSet = new Set(allCandidates.map(c => c.domain).filter(Boolean));
    return Array.from(domainsSet).map(id => ({ id, name: getDomainName(id) })).sort((a,b) => a.name.localeCompare(b.name));
  }, [allCandidates, domains]);

  const uniqueJobRoles = useMemo(() => {
    const jobRolesSet = new Set(allCandidates.map(c => c.jobRole).filter(Boolean));
    return Array.from(jobRolesSet).map(id => ({ id, title: getJobTitle(id) })).sort((a,b) => a.title.localeCompare(b.title));
  }, [allCandidates, allJobs]);

  const uniquePocs = useMemo(() => {
    const pocs = new Set(allCandidates.map(c => c.poc).filter(Boolean));
    return Array.from(pocs).sort();
  }, [allCandidates]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(allCandidates.map(c => statusMapping[c.status] || c.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [allCandidates]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, status: tab === "All" ? "" : tab }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setAppliedTab(activeTab);
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  const handleViewDetails = (id) => {
    navigate(`/candidates/${id}`);
  };

  const filteredCandidates = allCandidates.filter((candidate) => {
    const lowerCaseSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';
    const lowerCaseCandidateName = (candidate.full_name || candidate.name) ? (candidate.full_name || candidate.name).toLowerCase() : '';
    const lowerCaseCandidateEmail = candidate.email ? candidate.email.toLowerCase() : '';
    const lowerCaseCandidateDomainName = getDomainName(candidate.domain) ? getDomainName(candidate.domain).toLowerCase() : ''; // Use helper
    const lowerCaseCandidateJobTitle = getJobTitle(candidate.jobRole) ? getJobTitle(candidate.jobRole).toLowerCase() : ''; // Use helper
    const lowerCaseCandidatePoc = candidate.poc ? candidate.poc.toLowerCase() : '';
    const candidateDisplayStatus = statusMapping[candidate.status] || candidate.status;
    const lowerCaseCandidateStatus = candidateDisplayStatus ? candidateDisplayStatus.toLowerCase() : '';

    // Apply only filters, not global search term (global search should sort, not filter)
    const matchesTab = appliedTab === "All" || lowerCaseCandidateStatus === appliedTab.toLowerCase();

    const matchesDomain = appliedFilters.domain === "" || candidate.domain === parseInt(appliedFilters.domain, 10); // Compare IDs
    const matchesJobRole = appliedFilters.jobRole === "" || candidate.jobRole === parseInt(appliedFilters.jobRole, 10); // Compare IDs
    const matchesPoc = appliedFilters.poc === "" || lowerCaseCandidatePoc === appliedFilters.poc.toLowerCase();
    const matchesStatusDropdown = appliedFilters.status === "" || lowerCaseCandidateStatus === appliedFilters.status.toLowerCase();

    const matchesWorkExperience = appliedFilters.minWorkExperience === "" ||
      (candidate.workExperience !== null && candidate.workExperience >= parseInt(appliedFilters.minWorkExperience, 10));

    return matchesTab && matchesDomain && matchesJobRole && matchesPoc && matchesWorkExperience && matchesStatusDropdown;
  });

  // Sort candidates by search relevance if search term exists
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      // Calculate relevance scores for both candidates - search ALL fields
      const getRelevanceScore = (candidate) => {
        let score = 0;
        
        // Search ALL fields in the candidate object dynamically
        const searchAllFields = (obj, prefix = '') => {
          Object.entries(obj || {}).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            
            let searchValue;
            if (typeof value === 'object' && value !== null) {
              // Handle nested objects recursively
              searchAllFields(value, `${prefix}${key}.`);
              return;
            } else if (typeof value === 'boolean') {
              searchValue = value ? 'true' : 'false';
            } else if (typeof value === 'number') {
              searchValue = String(value);
            } else if (value instanceof Date) {
              searchValue = value.toLocaleDateString();
            } else {
              searchValue = String(value);
            }
            
            // Also include domain name lookup for domain field
            if (key === 'domain' && typeof value === 'number') {
              const domainName = getDomainName(value);
              if (domainName) {
                const domainStr = domainName.toLowerCase();
                if (domainStr.includes(searchLower)) {
                  if (domainStr.startsWith(searchLower)) score += 10;
                  else score += 5;
                }
              }
            }
            
            // Also include job title lookup for jobRole field
            if (key === 'jobRole' && typeof value === 'number') {
              const jobTitle = getJobTitle(value);
              if (jobTitle) {
                const jobStr = jobTitle.toLowerCase();
                if (jobStr.includes(searchLower)) {
                  if (jobStr.startsWith(searchLower)) score += 10;
                  else score += 5;
                }
              }
            }
            
            // Also include status mapping
            if (key === 'status' && statusMapping[value]) {
              const statusStr = statusMapping[value].toLowerCase();
              if (statusStr.includes(searchLower)) {
                if (statusStr.startsWith(searchLower)) score += 10;
                else score += 5;
              }
            }
            
            const fieldStr = searchValue.toLowerCase();
            if (fieldStr.includes(searchLower)) {
              if (fieldStr.startsWith(searchLower)) score += 10; // Starts with search term
              else score += 5; // Contains search term
            }
          });
        };
        
        searchAllFields(candidate);
        return score;
      };
      
      const aScore = getRelevanceScore(a);
      const bScore = getRelevanceScore(b);
      
      if (aScore !== bScore) {
        return bScore - aScore; // Higher relevance first
      }
    }
    
    return 0; // No additional sorting if no search term
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = sortedCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="candidate-page-wrapper">
      {/* Mobile Controls Row */}
      <div className="mobile-controls-row">
        {/* Mobile Status Dropdown */}
        <div className="mobile-status-dropdown">
          <select
            value={activeTab}
            onChange={(e) => handleTabClick(e.target.value)}
            className="status-dropdown-select"
          >
            {candidateTabsStatusList.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="mobile-filter-toggle">
          <button
            className={`mobile-filter-btn ${showMobileFilter ? 'filter-open' : ''}`}
            onClick={() => setShowMobileFilter(!showMobileFilter)}
          >
            <span className="btn-icon">{showMobileFilter ? '×' : '⚙'}</span>
            <span className="btn-text">{showMobileFilter ? 'Close' : 'Filter'}</span>
          </button>
        </div>
      </div>

      <div className="candidates-main-content fixed-grid">
        <div className={`filter-sidebar-section card ${showMobileFilter ? 'mobile-filter-visible' : 'mobile-filter-hidden'}`}>
          <div className="filter-header">
            <h3>Filters</h3>
            <button className="clear-filters" onClick={handleClearFilters}>Clear Filters</button>
          </div>
          <div className="form-box">
            <div className="filter-group">
              <label htmlFor="domainFilter">Domain</label>
              <select
                id="domainFilter"
                name="domain"
                value={filters.domain}
                onChange={handleFilterChange}
                className="add-candidates-select"
                disabled={domainsStatus === 'loading'}
              >
                <option value="">All Domains</option>
                {uniqueDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
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
                disabled={jobsStatus === 'loading'}
              >
                <option value="">All Job Roles</option>
                {uniqueJobRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
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
          <div className="form-actions">
            <button className="submit-btn" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>

        <div className="candidate-details-section card">
          <div className="candidate-status-tabs-container desktop-only">
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
          <div className="candidate-list">
            {candidatesStatus === 'loading' || jobsStatus === 'loading' || domainsStatus === 'loading' ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading candidates...</p>
              </div>
            ) : candidatesError ? (
              <p>Unable to load candidates. Please refresh the page.</p>
            ) : currentCandidates.length > 0 ? (
              currentCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onViewReport={handleViewDetails}
                  getDomainName={getDomainName} // Pass helper
                  getJobTitle={getJobTitle} // Pass helper
                />
              ))
            ) : (
              <p className="no-results">No Candidates Found Matching Your Filters.</p>
            )}
          </div>

          {sortedCandidates.length > itemsPerPage && (
            <div className="candidates-pagination-container">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="candidates-pagination-button"
                title="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`candidates-pagination-button ${currentPage === i + 1 ? "active" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="candidates-pagination-button"
                title="Next page"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidatePage;
