import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import "./Candidates.css";
import { candidateStatusList, baseURL } from '../data';
import { updateCandidateStatus } from '../redux/slices/candidatesSlice'; // Keep updateCandidateStatus
import { fetchCandidates } from '../redux/slices/candidatesSlice'; // Import fetchCandidates thunk
import { fetchJobs, fetchDomains } from '../redux/slices/jobsSlice'; // Import job and domain thunks

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
const CandidateCard = ({ candidate, onViewReport, getDomainName, getJobTitle }) => { // Pass getDomainName and getJobTitle
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
      return `Evaluated: ${candidate.evaluation.score}/10 - ${candidate.evaluation.result}`;
    } else if (candidate.status === "Requires Action" && candidate.aptitude?.score) {
      return `Aptitude: ${candidate.aptitude.score}/100`;
    }
    return candidate.status || 'N/A';
  };

  return (
    <div className="candidate-card">
      <div className="card-left-content">
        <div className="candidate-info">
          <h3 className="candidate-name">{candidate.name || '-'}</h3>
          <p className="candidate-role">{getJobTitle(candidate.jobRole) || '-'}</p> {/* Use helper */}
          <p className="candidate-domain">{getDomainName(candidate.domain) || '-'}</p> {/* Use helper */}
          <p className="candidate-updated">Last Updated: {candidate.lastUpdated ? new Date(candidate.lastUpdated).toLocaleDateString("en-GB") : '-'}</p>
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
    const statuses = new Set(allCandidates.map(c => c.status).filter(Boolean));
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
    const lowerCaseCandidateName = candidate.name ? candidate.name.toLowerCase() : '';
    const lowerCaseCandidateEmail = candidate.email ? candidate.email.toLowerCase() : '';
    const lowerCaseCandidateDomainName = getDomainName(candidate.domain) ? getDomainName(candidate.domain).toLowerCase() : ''; // Use helper
    const lowerCaseCandidateJobTitle = getJobTitle(candidate.jobRole) ? getJobTitle(candidate.jobRole).toLowerCase() : ''; // Use helper
    const lowerCaseCandidatePoc = candidate.poc ? candidate.poc.toLowerCase() : '';
    const lowerCaseCandidateStatus = candidate.status ? candidate.status.toLowerCase() : '';

    const matchesSearchTerm =
      !searchTerm ||
      lowerCaseCandidateName.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateEmail.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateDomainName.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateJobTitle.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidatePoc.includes(lowerCaseSearchTerm) ||
      lowerCaseCandidateStatus.includes(lowerCaseSearchTerm);

    const matchesTab = appliedTab === "All" || lowerCaseCandidateStatus === appliedTab.toLowerCase();

    const matchesDomain = appliedFilters.domain === "" || candidate.domain === parseInt(appliedFilters.domain, 10); // Compare IDs
    const matchesJobRole = appliedFilters.jobRole === "" || candidate.jobRole === parseInt(appliedFilters.jobRole, 10); // Compare IDs
    const matchesPoc = appliedFilters.poc === "" || lowerCaseCandidatePoc === appliedFilters.poc.toLowerCase();
    const matchesStatusDropdown = appliedFilters.status === "" || lowerCaseCandidateStatus === appliedFilters.status.toLowerCase();

    const matchesWorkExperience = appliedFilters.minWorkExperience === "" ||
      (candidate.workExperience !== null && candidate.workExperience >= parseInt(appliedFilters.minWorkExperience, 10));

    return matchesSearchTerm && matchesTab && matchesDomain && matchesJobRole && matchesPoc && matchesWorkExperience && matchesStatusDropdown;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="candidate-page-wrapper">
      <div className="candidates-main-content fixed-grid">
        <div className="filter-sidebar-section card">
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
          <div className="candidate-list">
            {candidatesStatus === 'loading' || jobsStatus === 'loading' || domainsStatus === 'loading' ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading candidates...</p>
              </div>
            ) : candidatesError ? (
              <p className="error-message">Error loading candidates: {candidatesError}</p>
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
              ))}
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
