import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isAfter, parseISO } from 'date-fns';
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch
import './Interviews.css'; // Import the new CSS file
import { interviewTabs, allInterviewStatuses, uniqueInterviewJobRoles, uniqueInterviewPocs } from '../data'; // Import data (initialInterviews will be from Redux)
import { updateInterviewStatus } from '../redux/slices/interviewsSlice'; // Import updateInterviewStatus action

function Interviews() {
  const dispatch = useDispatch(); // Get dispatch function
  const allInterviews = useSelector((state) => state.interviews.allInterviews); // Get all interviews from Redux
  const searchTerm = useSelector((state) => state.search.searchTerm); // Get search term from Redux

  const [displayedInterviews, setDisplayedInterviews] = useState([]); // Filtered list for display
  const [interviewDate, setInterviewDate] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [sortOrder, setSortOrder] = useState('date-desc');

  const [formData, setFormData] = useState({
    status: '',
    job: '',
    poc: '',
    date: ''
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [editingInterviewId, setEditingInterviewId] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setInterviewDate(date);
    setFormData((prev) => ({
      ...prev,
      date: date ? format(date, 'yyyy-MM-dd') : ''
    }));
  };

  const handleClearFilters = () => {
    setFormData({
      status: '',
      job: '',
      poc: '',
      date: ''
    });
    setInterviewDate(null);
    setActiveTab("All"); // Reset active tab as well
    setSortOrder('date-desc');
  };

  const handleViewReport = (interview) => {
    setSelectedInterview(interview);
    setShowReportModal(true);
    setEditingInterviewId(null);
  };

  const handleToggleStatusDropdown = (id, currentStatus) => {
    if (editingInterviewId === id) {
      setEditingInterviewId(null);
      setNewStatus('');
    } else {
      setEditingInterviewId(id);
      setNewStatus(currentStatus);
      setShowReportModal(false);
    }
  };

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const handleSaveStatus = (id) => {
    if (newStatus) {
      dispatch(updateInterviewStatus({ id, newStatus })); // Dispatch action to Redux
    }
    setEditingInterviewId(null);
    setNewStatus('');
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedInterview(null);
  };

  const activeFilterCount = Object.values(formData).filter(Boolean).length;

  // Filtering logic
  useEffect(() => {
    let currentFiltered = allInterviews; // Start filtering from the Redux master list

    // Apply global search term first
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(interview =>
        interview.candidateName.toLowerCase().includes(lowerCaseSearchTerm) ||
        interview.jobRole.toLowerCase().includes(lowerCaseSearchTerm) ||
        interview.poc.toLowerCase().includes(lowerCaseSearchTerm) ||
        interview.status.toLowerCase().includes(lowerCaseSearchTerm) ||
        interview.round.toLowerCase().includes(lowerCaseSearchTerm) ||
        interview.interviewTime.toLowerCase().includes(lowerCaseSearchTerm) ||
        (interview.notes && interview.notes.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Apply tab filter only if no search term, or to further refine search results
    if (!searchTerm || (searchTerm && activeTab !== "All")) {
      currentFiltered = currentFiltered.filter(interview => {
        const interviewDateTime = parseISO(interview.interviewDate);
        if (activeTab === "Today" && !isToday(interviewDateTime)) return false;
        if (activeTab === "Tomorrow" && !isTomorrow(interviewDateTime)) return false;
        if (activeTab === "Upcoming" && (!isAfter(interviewDateTime, new Date()) && !isToday(interviewDateTime) && !isTomorrow(interviewDateTime))) return false;
        if (activeTab === "Pending Feedback" && interview.status !== "Pending Feedback") return false;
        if (activeTab === "Completed" && interview.status !== "Completed") return false;
        return true;
      });
    }

    // Apply form filters (if no search term is active, or to further refine search results)
    if (!searchTerm || (searchTerm && Object.values(formData).some(val => val !== ""))) {
        currentFiltered = currentFiltered.filter(interview => {
            const matchesStatus = formData.status === '' || interview.status === formData.status;
            const matchesJob = formData.job === '' || interview.jobRole === formData.job;
            const matchesPoc = formData.poc === '' || interview.poc === formData.poc;
            const matchesDate = formData.date === '' || interview.interviewDate === formData.date;
            return matchesStatus && matchesJob && matchesPoc && matchesDate;
        });
    }

    currentFiltered.sort((a, b) => {
      const dateA = parseISO(a.interviewDate);
      const dateB = parseISO(b.interviewDate);
      if (sortOrder === 'date-asc') {
        return dateA.getTime() - dateB.getTime();
      }
      return dateB.getTime() - dateA.getTime();
    });
    setDisplayedInterviews(currentFiltered); // Update the displayed list
  }, [searchTerm, activeTab, formData, sortOrder, allInterviews]); // Dependencies for useEffect

  return (
    <div className="interviews-container">
      <div className="interviews-main-content fixed-grid">
        <div className="filter-sidebar-section">
          <div className="filter-header">
            <span>Filters ({activeFilterCount})</span>
            <button className="clear-filters" onClick={handleClearFilters}>Clear all</button>
          </div>
          <div className="form-box">
            <div className="filter-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className='add-candidates-select'>
                <option value="">Select Status</option>
                <option value="Pending Decision">Pending Decision</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending Feedback">Pending Feedback</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Job</label>
              <select name="job" value={formData.job} onChange={handleChange} className='add-candidates-select'>
                <option value="">Select</option>
                {uniqueInterviewJobRoles.map(role => ( // Use imported job roles
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>POC</label>
              <select name="poc" value={formData.poc} onChange={handleChange} className='add-candidates-select'>
                <option value="">Select</option>
                {uniqueInterviewPocs.map(poc => ( // Use imported POCs
                  <option key={poc} value={poc}>{poc}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Interview Date</label>
              <DatePicker
                selected={interviewDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Interview Date"
                className="add-candidates-input"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="submit-btn" onClick={() => console.log('Apply Filters')}>Apply filters</button>
          </div>
        </div>
        <div className="interview-details-section">
          <div className="top-row">
            <div className="tabs-container">
              {interviewTabs.map((tab) => ( // Use imported tabs
                <button
                  key={tab}
                  className={activeTab === tab ? "tab active" : "tab"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {displayedInterviews.length > 0 ? ( // Use the 'displayedInterviews' state for rendering
            displayedInterviews.map((interview) => (
              <div key={interview.id} className="interview-row">
                <div className="top-row-line">
                  <span className="candidate-name">{interview.candidateName}</span>
                  <span className="status">{interview.status} ({format(parseISO(interview.interviewDate), 'dd MMM, yy')} - {interview.interviewTime})</span>
                  <div className="actions">
                    {editingInterviewId === interview.id ? (
                      <div className="status-dropdown-container">
                        <select
                          className='add-candidates-select status-select'
                          value={newStatus}
                          onChange={handleStatusChange}
                          onBlur={() => handleSaveStatus(interview.id)}
                        >
                          {allInterviewStatuses.map(statusOption => ( // Use imported statuses
                            <option key={statusOption} value={statusOption}>{statusOption}</option>
                          ))}
                        </select>
                        <button className="save-status-btn" onClick={() => handleSaveStatus(interview.id)}>Save</button>
                      </div>
                    ) : (
                      <button
                        className="change-status-btn"
                        onClick={() => handleToggleStatusDropdown(interview.id, interview.status)}
                      >
                        Change Status
                      </button>
                    )}
                    <span
                      className="view-report"
                      onClick={() => handleViewReport(interview)}
                    >
                      View Report
                    </span>
                  </div>
                </div>
                <div className="details-line">{format(parseISO(interview.interviewDate), 'EEE, dd MMM, yy')} - {interview.interviewTime}</div>
                <div className="details-line">{interview.jobRole} - {interview.round}</div>
              </div>
            ))
          ) : (
            <p className="no-results">No Results Found</p>
          )}
        </div>
      </div>
      {showReportModal && selectedInterview && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={closeReportModal}>&times;</button>
            <h2>Interview Report: {selectedInterview.candidateName}</h2>
            <div className="report-details">
              <p><strong>Job Role:</strong> {selectedInterview.jobRole}</p>
              <p><strong>Status:</strong> {selectedInterview.status}</p>
              <p><strong>Date:</strong> {format(parseISO(selectedInterview.interviewDate), 'dd MMM, yyyy')}</p>
              <p><strong>Time:</strong> {selectedInterview.interviewTime}</p>
              <p><strong>Round:</strong> {selectedInterview.round}</p>
              <p><strong>POC:</strong> {selectedInterview.poc}</p>
              <p><strong>Notes:</strong> {selectedInterview.notes || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Interviews;
