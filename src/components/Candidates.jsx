import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch
import "./Candidates.css"; // Ensure this import is present
import { candidateStatusList, uniqueCandidateDomains, uniqueCandidateJobRoles, uniqueCandidatePocs } from '../data'; // Import data
import { updateCandidateStatus } from '../redux/slices/candidatesSlice'; // Import updateCandidateStatus action

// New Report Modal Component
const ReportModal = ({ candidate, onClose }) => {
  if (!candidate) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Candidate Report: {candidate.name}</h2>
        <div className="modal-details">
          <p><strong>Role:</strong> {candidate.role}</p>
          <p><strong>Domain:</strong> {candidate.domain}</p>
          <p><strong>Current Status:</strong> {candidate.status}</p>
          <p><strong>Last Updated:</strong> {new Date(candidate.lastUpdated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
          <p><strong>Application Date:</strong> {new Date(candidate.applicationDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
          <p><strong>Email:</strong> {candidate.email}</p>
          <p><strong>POC:</strong> {candidate.poc}</p>

          {candidate.evaluation && (
            <div className="evaluation-details">
              <h3>Evaluation Details</h3>
              <p><strong>Score:</strong> {candidate.evaluation.score}/10</p>
              <p><strong>Result:</strong> <span className={`eval-result ${candidate.evaluation.result.toLowerCase()}`}>{candidate.evaluation.result}</span></p>
              <p><strong>Feedback:</strong> {candidate.evaluation.feedback || "N/A"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const CandidateCard = ({ candidate, onUpdateStatus, onViewReport }) => {
  const handleStatusChange = (e) => {
    onUpdateStatus(candidate.id, e.target.value);
  };

  return (
    <div className="candidate-card">
      <div className="card-header">
        <div>
          <strong className="candidate-name">{candidate.name}</strong>
          <div className="candidate-role">{candidate.role}</div>
          <div className="candidate-updated">
            Last updated:{" "}
            {new Date(candidate.lastUpdated).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>

        {candidate.evaluation && (
          <div className="evaluation-section">
            <button className="view-report" onClick={() => onViewReport(candidate)}>
              View Report
            </button>
            <span className="eval-score">{candidate.evaluation.score}/10</span>
            <span className={`eval-result ${candidate.evaluation.result.toLowerCase()}`}>
              {candidate.evaluation.result}
            </span>
          </div>
        )}
      </div>

      <div className="candidate-status-container">
        <select
          className={`badge ${
            candidate.status === "Requires Action" ||
            candidate.status === "Pending Scheduling" ||
            candidate.status === "BR In Process"
              ? "badge-warning"
              : candidate.status === "Rejected" ||
                candidate.status === "Offer Rejected" ||
                candidate.status === "Cancelled"
              ? "badge-danger"
              : "badge-success"
          }`}
          value={candidate.status}
          onChange={handleStatusChange}
        >
          {candidateStatusList.filter(s => s !== "All").map((status) => ( // Use imported status list
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};


const CandidatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Get dispatch function
  const allCandidates = useSelector((state) => state.candidates.allCandidates); // Get all candidates from Redux
  const searchTerm = useSelector((state) => state.search.searchTerm); // Get search term from Redux

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCandidateForReport, setSelectedCandidateForReport] = useState(null);

  const [filterFormData, setFilterFormData] = useState({
    domain: "",
    jobRole: "",
    evaluationIncludes: "",
    poc: "",
    applicationStartDate: "",
    lastStatusUpdateDate: "",
    scoreOption: "",
    scoreValue: "",
  });

  // This useEffect will handle filtering based on both searchTerm and local filters
  useEffect(() => {
    let currentFiltered = allCandidates; // Start filtering from the Redux state

    // Apply global search term first
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(candidate =>
        candidate.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.role.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.domain.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.status.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.poc.toLowerCase().includes(lowerCaseSearchTerm) ||
        (candidate.evaluation && JSON.stringify(candidate.evaluation).toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Apply status tab filter only if no search term, or to further refine search results
    // If searchTerm is active, local filters should *further refine* the search results, not override them.
    // If no searchTerm, then local filters apply as usual.
    if (!searchTerm || (searchTerm && (selectedStatus !== "All" || Object.values(filterFormData).some(val => val !== "")))) {
        if (selectedStatus !== "All") {
            currentFiltered = currentFiltered.filter(c => c.status === selectedStatus);
        }

        currentFiltered = currentFiltered.filter(candidate => {
            const matchesDomain = filterFormData.domain === "" || candidate.domain === filterFormData.domain;
            const matchesJobRole = filterFormData.jobRole === "" || candidate.role === filterFormData.jobRole;
            const matchesPOC = filterFormData.poc === "" || candidate.poc === filterFormData.poc;

            const matchesApplicationStartDate = filterFormData.applicationStartDate === "" ||
                new Date(candidate.applicationDate) >= new Date(filterFormData.applicationStartDate);
            const matchesLastStatusUpdateDate = filterFormData.lastStatusUpdateDate === "" ||
                new Date(candidate.lastUpdated) >= new Date(filterFormData.lastStatusUpdateDate);

            let matchesScore = true;
            if (filterFormData.scoreValue !== "" && candidate.evaluation?.score !== undefined) {
                const score = parseFloat(filterFormData.scoreValue);
                switch (filterFormData.scoreOption) {
                    case "Less than":
                        matchesScore = candidate.evaluation.score < score;
                        break;
                    case "Greater than":
                        matchesScore = candidate.evaluation.score > score;
                        break;
                    default:
                        break;
                }
            } else if (filterFormData.scoreValue !== "" && candidate.evaluation?.score === undefined) {
                matchesScore = false;
            }

            const matchesEvaluationIncludes = filterFormData.evaluationIncludes === "" ||
                (candidate.evaluation && JSON.stringify(candidate.evaluation).toLowerCase().includes(filterFormData.evaluationIncludes.toLowerCase()));

            return matchesDomain && matchesJobRole && matchesPOC &&
                   matchesApplicationStartDate && matchesLastStatusUpdateDate &&
                   matchesScore && matchesEvaluationIncludes;
        });
    }

    currentFiltered.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
    setFilteredCandidates(currentFiltered);
  }, [selectedStatus, filterFormData, allCandidates, searchTerm]); // Add allCandidates to dependency array


  const countByStatus = (status) => {
    // This count should reflect the *currently filtered* candidates if a search term is active
    // otherwise, it counts from the full candidatesData.
    let candidatesToCount = allCandidates; // Count from Redux state
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      candidatesToCount = allCandidates.filter(candidate =>
        candidate.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.role.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.domain.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.status.toLowerCase().includes(lowerCaseSearchTerm) ||
        candidate.poc.toLowerCase().includes(lowerCaseSearchTerm) ||
        (candidate.evaluation && JSON.stringify(candidate.evaluation).toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    return status === "All"
      ? candidatesToCount.length
      : candidatesToCount.filter((c) => c.status === status).length;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilterFormData({
      domain: "",
      jobRole: "",
      evaluationIncludes: "",
      poc: "",
      applicationStartDate: "",
      lastStatusUpdateDate: "",
      scoreOption: "",
      scoreValue: "",
    });
    setSelectedStatus("All");
  };

  const updateCandidateStatusHandler = (id, newStatus) => {
    dispatch(updateCandidateStatus({ id, newStatus })); // Dispatch action to Redux
  };

  const handleViewReport = (candidate) => {
    setSelectedCandidateForReport(candidate);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedCandidateForReport(null);
  };

  const activeFilterCount = Object.values(filterFormData).filter(value => value !== "").length;

  return (
    <div className="candidate-page-wrapper">
      <div className="candidates-main-content fixed-grid">
        <div className="filter-sidebar-section">
          <div className="filter-header">
            <span>Filters ({activeFilterCount})</span>
            <button className="clear-filters" onClick={handleClearFilters}>Clear all</button>
          </div>
          <div className="form-box">
            <div className="filter-group">
              <label htmlFor="domainSelect">Domain</label>
              <select
                id="domainSelect"
                name="domain"
                value={filterFormData.domain}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">Select Domain</option>
                {uniqueCandidateDomains.map((domain) => ( // Use imported domains
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="jobRoleSelect">Job Role</label>
              <select
                id="jobRoleSelect"
                name="jobRole"
                value={filterFormData.jobRole}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">Select Job Role</option>
                {uniqueCandidateJobRoles.map((role) => ( // Use imported job roles
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="evaluationIncludes">Evaluation Includes</label>
              <input
                type="text"
                id="evaluationIncludes"
                name="evaluationIncludes"
                placeholder="e.g., 'Pass', 'Java'"
                value={filterFormData.evaluationIncludes}
                onChange={handleFilterChange}
                className="add-candidates-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="pocSelect">Point of Contact (POC)</label>
              <select
                id="pocSelect"
                name="poc"
                value={filterFormData.poc}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">Select POC</option>
                {uniqueCandidatePocs.map((poc) => ( // Use imported POCs
                  <option key={poc} value={poc}>{poc}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="applicationStartDate">Application Start Date (After)</label>
              <input
                type="date"
                id="applicationStartDate"
                name="applicationStartDate"
                value={filterFormData.applicationStartDate}
                onChange={handleFilterChange}
                className="add-candidates-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="lastStatusUpdateDate">Last Status Update Date (After)</label>
              <input
                type="date"
                id="lastStatusUpdateDate"
                name="lastStatusUpdateDate"
                value={filterFormData.lastStatusUpdateDate}
                onChange={handleFilterChange}
                className="add-candidates-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="scoreOption">For score</label>
              <select
                id="scoreOption"
                name="scoreOption"
                value={filterFormData.scoreOption}
                onChange={handleFilterChange}
                className="add-candidates-select"
              >
                <option value="">Select Option</option>
                <option value="Less than">Less than</option>
                <option value="Greater than">Greater than</option>
              </select>
            </div>
            {filterFormData.scoreOption !== "" && (
              <div className="filter-group">
                <label htmlFor="scoreValue">Score Value</label>
                <input
                  type="number"
                  id="scoreValue"
                  name="scoreValue"
                  placeholder="Enter score"
                  value={filterFormData.scoreValue}
                  onChange={handleFilterChange}
                  className="add-candidates-input"
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>
            )}
          </div>
          <div className="form-actions">
            <button className="submit-btn" onClick={() => console.log('Apply Filters (Client-side)')}>
              Apply Filters
            </button>
          </div>
        </div>
        <div className="candidate-details-section">
          <div className="candidate-status-cards-container">
            {candidateStatusList.map((status) => ( // Use imported status list
              <div
                key={status}
                className={`status-card status-card-${status.toLowerCase().replace(/\s/g, "-")} ${
                  selectedStatus === status ? "active" : ""
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                <span className="status-card-count">{countByStatus(status)}</span>
                <span className="status-card-label">{status}</span>
              </div>
            ))}
          </div>

          <div className="candidate-list">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onUpdateStatus={updateCandidateStatusHandler} // Use the handler that dispatches
                  onViewReport={handleViewReport}
                />
              ))
            ) : (
              <p className="no-results">No Candidates Found Matching Your Filters.</p>
            )}
          </div>
        </div>
      </div>
      {showReportModal && (
        <ReportModal candidate={selectedCandidateForReport} onClose={closeReportModal} />
      )}
    </div>
  );
};

export default CandidatePage;
