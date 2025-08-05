// CandidateDetails.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft, FiX } from 'react-icons/fi';
import { updateCandidateStatus } from '../redux/slices/candidatesSlice'; // Only updateCandidateStatus is needed here
import { candidateStatusList, baseURL } from '../data';
import DatePicker from "react-datepicker";
import TimePicker from 'react-time-picker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-time-picker/dist/TimePicker.css';
import "./CandidateDetails.css";
import { useSelector } from 'react-redux'; // Import useSelector to get jobs data

// Interview Modal
const InterviewDetailModal = ({ interviewDetails, onClose }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Trigger animation when component mounts
    setShowModal(true);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    // Delay onClose to allow animation to complete
    setTimeout(onClose, 300); // Match CSS transition duration
  };

  return (
    <div className={`modal-overlay ${showModal ? 'show' : ''}`}>
      <div className={`modal-content interview-modal-large ${showModal ? 'show' : ''}`}>
        <button className="modal-close-button" onClick={handleClose}>
          <FiX size={24} />
        </button>
        <h3>Interview Details</h3>
        {interviewDetails ? (
          <>
            <p><strong>Date:</strong> {interviewDetails.date || '-'}</p>
            <p><strong>Time:</strong> {interviewDetails.time || '-'}</p>
            {interviewDetails.duration && <p><strong>Duration:</strong> {interviewDetails.duration || '-'}</p>}
            {interviewDetails.interviewer && <p><strong>Interviewer:</strong> {interviewDetails.interviewer || '-'}</p>}
            {interviewDetails.type && <p><strong>Type:</strong> {interviewDetails.type || '-'}</p>}
            {interviewDetails.platform && <p><strong>Platform:</strong> {interviewDetails.platform || '-'}</p>}
            {interviewDetails.link && (
              <p><strong>Meeting Link:</strong> {interviewDetails.link !== '-' ? <a href={interviewDetails.link} target="_blank" rel="noopener noreferrer">{interviewDetails.link}</a> : '-'}</p>
            )}
            {interviewDetails.agenda && <p><strong>Agenda:</strong> {interviewDetails.agenda || '-'}</p>}
            {interviewDetails.notes && <p><strong>Notes:</strong> {interviewDetails.notes || '-'}</p>}
          </>
        ) : (
          <p>No interview details available. Please update the candidate status to schedule an interview.</p>
        )}
      </div>
    </div>
  );
};

// Evaluation Modal
const EvaluationDetailModal = ({ evaluation, onClose }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Trigger animation when component mounts
    setShowModal(true);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    // Delay onClose to allow animation to complete
    setTimeout(onClose, 300); // Match CSS transition duration
  };

  return (
    <div className={`modal-overlay ${showModal ? 'show' : ''}`}>
      <div className={`modal-content evaluation-modal-large ${showModal ? 'show' : ''}`}>
        <button className="modal-close-button" onClick={handleClose}>
          <FiX size={24} />
        </button>
        <h3>Evaluation Details</h3>
        {evaluation ? (
          <>
            <p><strong>Score:</strong> {evaluation.score || '-'}/10</p>
            <p><strong>Result:</strong> <span className={`eval-result ${evaluation.result?.toLowerCase() || ''}`}>{evaluation.result || '-'}</span></p>
            {evaluation.interviewDuration && <p><strong>Interview Duration:</strong> {evaluation.interviewDuration || '-'}</p>}
            <p><strong>Feedback:</strong> {evaluation.feedback || '-'}</p>
            {evaluation.strengths && <p><strong>Strengths:</strong> {evaluation.strengths || '-'}</p>}
            {evaluation.areasForImprovement && <p><strong>Areas for Improvement:</strong> {evaluation.areasForImprovement || '-'}</p>}
            {evaluation.recommendation && <p><strong>Recommendation:</strong> {evaluation.recommendation || '-'}</p>}
          </>
        ) : (
          <p>No evaluation details available. Please update the candidate status to complete evaluation.</p>
        )}
      </div>
    </div>
  );
};

// Update Status Modal
const UpdateStatusModal = ({ candidate, onClose, onSave }) => {
  const [showModal, setShowModal] = useState(false);
  const allJobs = useSelector((state) => state.jobs.allJobs); // Get all jobs from Redux

  useEffect(() => {
    // Trigger animation when component mounts
    setShowModal(true);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    // Delay onClose to allow animation to complete
    setTimeout(onClose, 300); // Match CSS transition duration
  };

  const processSteps = [
    "Requires Action",
    "Interview Pending",
    "Interview Scheduled",
    "Interview Completed",
    "Evaluated"
  ];

  // Derive currentStepIndex directly from candidate.status
  const currentStepIndex = processSteps.indexOf(candidate.status);
  const currentProcessStatus = processSteps[currentStepIndex];

  const [interviewDate, setInterviewDate] = useState(candidate?.interviewDetails?.date ? new Date(candidate.interviewDetails.date) : null);
  const [interviewTime, setInterviewTime] = useState(candidate?.interviewDetails?.time || '');
  const [interviewDuration, setInterviewDuration] = useState(candidate?.evaluation?.interviewDuration || '');
  const [evaluationRemark, setEvaluationRemark] = useState(candidate?.evaluation?.feedback || '');
  const [evaluationScore, setEvaluationScore] = useState(candidate?.evaluation?.score || '');
  const [evaluationResult, setEvaluationResult] = useState(candidate?.evaluation?.result || '');

  // Validation Error States
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [resultError, setResultError] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const resetErrors = () => {
    setDateError('');
    setTimeError('');
    setDurationError('');
    setScoreError('');
    setResultError('');
    setFeedbackError('');
  };

  const isFormValid = () => {
    resetErrors(); // Clear errors on validation attempt
    let isValid = true;

    switch (currentProcessStatus) {
      case "Interview Pending":
        if (!interviewDate) {
          setDateError("Interview Date is required.");
          isValid = false;
        }
        if (!interviewTime) {
          setTimeError("Interview Time is required.");
          isValid = false;
        }
        break;
      case "Interview Completed":
        if (!interviewDuration.trim()) {
          setDurationError("Interview Duration is required.");
          isValid = false;
        }
        if (!evaluationScore) {
          setScoreError("Evaluation Score is required.");
          isValid = false;
        } else if (isNaN(parseFloat(evaluationScore)) || parseFloat(evaluationScore) < 0 || parseFloat(evaluationScore) > 10) {
          setScoreError("Score must be between 0 and 10.");
          isValid = false;
        }
        if (!evaluationResult.trim()) {
          setResultError("Evaluation Result is required.");
          isValid = false;
        }
        if (!evaluationRemark.trim()) {
          setFeedbackError("Feedback is required.");
          isValid = false;
        }
        break;
      default:
        break;
    }
    return isValid;
  };

  // This function now takes the target status to save as an argument
  const handleSaveCurrentStepData = async (statusToUpdate, updatedFormData = {}) => {
    let payloadData = updatedFormData;

    // Logic to prepare payload based on the current step and form fields
    if (currentProcessStatus === "Interview Pending" && statusToUpdate === "Interview Scheduled") {
      if (!isFormValid()) return;

      const job = allJobs.find(job => job.title === candidate.jobRole);
      if (!job) {
        console.error("Job not found for candidate's job role:", candidate.jobRole);
        return;
      }

      const startDate = interviewDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const [hours, minutes] = interviewTime.split(':');
      const scheduledAt = new Date(`${startDate}T${hours}:${minutes}:00Z`); // Assuming UTC for simplicity

      const interviewPayload = {
        candidate: candidate.id,
        job: job.id,
        interview_round: 1, // Assuming first round for now
        started_at: scheduledAt.toISOString(),
        status: "SCHEDULED"
      };

      try {
        const authToken = localStorage.getItem('authToken');
        const headers = {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Token ${authToken}` }) // Conditionally add auth header
        };

        const response = await fetch(`${baseURL}/api/interviews/`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(interviewPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to schedule interview:", errorData);
          return;
        }

        const interviewResponse = await response.json();
        console.log("Interview scheduled successfully:", interviewResponse);

        // Update local data that will be passed to onSave for candidate PATCH
        // Use data from the API response if available, otherwise placeholders
        payloadData.interviewDetails = {
          date: startDate,
          time: interviewTime,
          duration: interviewResponse.duration || "30 minutes", // Use API response or default
          interviewer: interviewResponse.interviewer || "Auto-assigned", // Placeholder
          type: interviewResponse.interview_type || "Technical", // Placeholder
          platform: interviewResponse.platform || "Google Meet", // Placeholder
          link: interviewResponse.meeting_link || "https://meet.google.com/xyz-abc", // Placeholder
          agenda: interviewResponse.agenda || "Technical assessment", // Placeholder
          notes: interviewResponse.notes || "Initial screening interview", // Placeholder
        };
      } catch (apiError) {
        console.error("API call failed during interview scheduling:", apiError);
        return;
      }

    } else if (currentProcessStatus === "Interview Completed" && statusToUpdate === "Evaluated") {
      if (!isFormValid()) return;
      payloadData.evaluation = {
        score: parseFloat(evaluationScore),
        result: evaluationResult,
        feedback: evaluationRemark,
        interviewDuration
      };
    }

    // Call onSave which will PATCH the candidate status and re-fetch details
    await onSave(statusToUpdate, payloadData);
    
    // Close the modal only after the save operation (and re-fetch in parent) is complete
    // This prevents the modal from re-rendering with stale data
    onClose();
  };

  const handleNextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < processSteps.length) {
      const nextStatus = processSteps[nextStepIndex];
      // Check if current step requires form validation before proceeding
      if (currentProcessStatus === "Interview Pending" || currentProcessStatus === "Interview Completed") {
        if (isFormValid()) {
          handleSaveCurrentStepData(nextStatus);
        }
      } else {
        // For steps like "Requires Action" where no form is present, just trigger the save for the next status
        handleSaveCurrentStepData(nextStatus);
      }
    }
  };

  const handleGoBack = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      const prevStatus = processSteps[prevStepIndex];
      // For going back, we typically just update the status without sending form data
      // and then close the modal.
      onSave(prevStatus, {}); // This will trigger re-fetch in parent
      onClose(); // Close the modal immediately after triggering the save
    }
  };

  const handleSaveFinalStatus = (finalStatus) => {
    onSave(finalStatus, {});
    handleClose(); // Close modal after final status selection
  };

  // Show Next button if not on the last step and not "Evaluated" (as "Evaluated" branches to Hired/Rejected)
  const showNextButton = currentStepIndex < processSteps.length - 1 && currentProcessStatus !== "Evaluated";

  return (
    <div className={`modal-overlay ${showModal ? 'show' : ''}`}>
      <div className={`modal-content update-status-modal-content ${showModal ? 'show' : ''}`}>
        <button className="modal-close-button" onClick={handleClose}>
          <FiX size={24} />
        </button>
        <h3>Update Candidate Status</h3>

        <div className="process-flow-container">
          {processSteps.map((step, index) => (
            <React.Fragment key={step}>
              <div className={`process-step ${index <= currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'active' : ''}`}>
                {step}
              </div>
              {index < processSteps.length - 1 && (
                <div className={`process-arrow ${index < currentStepIndex ? 'completed' : ''}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="update-status-form-content">
          {currentProcessStatus === "Requires Action" && (
            <p className="process-info-text">Ready to move this candidate forward?</p>
          )}

          {currentProcessStatus === "Interview Pending" && (
            <div className="conditional-input-group">
              <label>Interview Date:</label>
              <DatePicker
                selected={interviewDate}
                onChange={(date) => { setInterviewDate(date); setDateError(''); }}
                dateFormat="yyyy-MM-dd"
                className="add-candidates-input"
              />
              {dateError && <p className="error-message">{dateError}</p>}
              <label>Interview Time:</label>
              <TimePicker
                onChange={(time) => { setInterviewTime(time); setTimeError(''); }}
                value={interviewTime}
                disableClock
                className="add-candidates-input"
              />
              {timeError && <p className="error-message">{timeError}</p>}
            </div>
          )}

          {currentProcessStatus === "Interview Completed" && (
            <div className="conditional-input-group">
              <label>Interview Duration:</label>
              <input
                type="text"
                value={interviewDuration}
                onChange={(e) => { setInterviewDuration(e.target.value); setDurationError(''); }}
                className="add-candidates-input"
                placeholder="e.g., 60 minutes, 1.5 hours"
              />
              {durationError && <p className="error-message">{durationError}</p>}
              <label>Evaluation Score:</label>
              <input
                type="number"
                value={evaluationScore}
                onChange={(e) => { setEvaluationScore(e.target.value); setScoreError(''); }}
                className="add-candidates-input"
                placeholder="e.g., 8.5"
                min="0"
                max="10"
                step="0.1"
              />
              {scoreError && <p className="error-message">{scoreError}</p>}
              <label>Evaluation Result:</label>
              <input
                type="text"
                value={evaluationResult}
                onChange={(e) => { setEvaluationResult(e.target.value); setResultError(''); }}
                className="add-candidates-input"
                placeholder="e.g., Pass, Fail"
              />
              {resultError && <p className="error-message">{resultError}</p>}
              <label>Feedback:</label>
              <textarea
                value={evaluationRemark}
                onChange={(e) => { setEvaluationRemark(e.target.value); setFeedbackError(''); }}
                className="add-candidates-textarea"
                rows="3"
              ></textarea>
              {feedbackError && <p className="error-message">{feedbackError}</p>}
            </div>
          )}

          <div className="modal-navigation-buttons">
            <button onClick={handleGoBack} disabled={currentStepIndex === 0} className="cancel-btn">Go Back</button>

            {currentProcessStatus === "Evaluated" ? (
              <>
                <button onClick={() => handleSaveFinalStatus("Hired")} className="submit-btn final-action-btn">Hired</button>
                <button onClick={() => handleSaveFinalStatus("Rejected")} className="cancel-btn final-action-btn">Rejected</button>
              </>
            ) : (
              <>
                {showNextButton && (
                  <button onClick={handleNextStep} className="submit-btn next-step-btn">Next</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CandidateDetails = ({ onTitleChange }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  // Function to fetch a single candidate's details from the API
  const fetchCandidateDetails = async (candidateId) => {
    setLoading(true);
    setError(null);
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Token ${authToken}`;
      } else {
        console.error("No authentication token found. Please log in.");
        navigate('/login');
        return;
      }

      const response = await fetch(`${baseURL}/api/candidates/${candidateId}/`, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        throw new Error(`Failed to fetch candidate details: ${response.statusText}`);
      }
      const apiCandidate = await response.json();

      // Format the single candidate data
      const formattedCandidate = {
        id: apiCandidate.id,
        name: apiCandidate.full_name || '-',
        email: apiCandidate.email || '-',
        phone: apiCandidate.phone || '-',
        domain: apiCandidate.domain || '-',
        jobRole: apiCandidate.job_title || '-',
        poc: apiCandidate.poc_email || '-',
        workExperience: apiCandidate.work_experience || '-',
        status: apiCandidate.status || 'NEW',
        lastUpdated: apiCandidate.last_updated ? new Date(apiCandidate.last_updated).toLocaleDateString("en-GB") : '-',
        applicationDate: apiCandidate.created_at ? new Date(apiCandidate.created_at).toLocaleDateString("en-GB") : '-',
        resumes: apiCandidate.resume_url ? [{ name: apiCandidate.resume_url.split('/').pop(), url: apiCandidate.resume_url }] : [],
        // Map interview_details and evaluation_details directly from API response
        interviewDetails: apiCandidate.interview_details ? {
          date: apiCandidate.interview_details.started_at ? new Date(apiCandidate.interview_details.started_at).toLocaleDateString("en-GB") : '-',
          time: apiCandidate.interview_details.started_at ? new Date(apiCandidate.interview_details.started_at).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : '-',
          duration: apiCandidate.interview_details.duration || '-',
          interviewer: apiCandidate.interview_details.interviewer || '-',
          type: apiCandidate.interview_details.interview_type || '-',
          platform: apiCandidate.interview_details.platform || '-',
          link: apiCandidate.interview_details.meeting_link || '-',
          agenda: apiCandidate.interview_details.agenda || '-',
          notes: apiCandidate.interview_details.notes || '-',
        } : null,
        evaluation: apiCandidate.evaluation_details ? {
          score: apiCandidate.evaluation_details.score || '-',
          result: apiCandidate.evaluation_details.result || '-',
          feedback: apiCandidate.evaluation_details.feedback || '-',
          strengths: apiCandidate.evaluation_details.strengths || '-',
          areasForImprovement: apiCandidate.evaluation_details.areas_for_improvement || '-',
          recommendation: apiCandidate.evaluation_details.recommendation || '-',
          interviewDuration: apiCandidate.evaluation_details.interview_duration || '-',
        } : null,
        aptitude: apiCandidate.aptitude_details || null,
        brChats: apiCandidate.br_chats || [],
      };
      setCandidate(formattedCandidate);
    } catch (err) {
      console.error("Error fetching candidate details:", err);
      setError("Failed to load candidate details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCandidateDetails(id);
    }
    if (onTitleChange) {
      onTitleChange('Candidate Details');
    }
  }, [id, onTitleChange, navigate]);

  const handleSaveStatus = async (newStatus, updatedData) => {
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Token ${authToken}`;
      } else {
        console.error("No authentication token found. Please log in.");
        navigate('/login');
        return;
      }

      const payload = {
        status: newStatus,
      };

      // Conditionally add interview_details or evaluation_details if present in updatedData
      if (updatedData.interviewDetails) {
        // Map back to API expected format if necessary, or ensure it's already in that format
        payload.interview_details = {
          started_at: new Date(`${updatedData.interviewDetails.date}T${updatedData.interviewDetails.time}:00Z`).toISOString(),
          duration: updatedData.interviewDetails.duration,
          interviewer: updatedData.interviewDetails.interviewer,
          interview_type: updatedData.interviewDetails.type,
          platform: updatedData.interviewDetails.platform,
          meeting_link: updatedData.interviewDetails.link,
          agenda: updatedData.interviewDetails.agenda,
          notes: updatedData.interviewDetails.notes,
          status: "SCHEDULED", // Assuming status is handled during interview scheduling
        };
      }
      if (updatedData.evaluation) {
        payload.evaluation_details = {
          score: updatedData.evaluation.score,
          result: updatedData.evaluation.result,
          feedback: updatedData.evaluation.feedback,
          strengths: updatedData.evaluation.strengths || '', // Add these fields
          areas_for_improvement: updatedData.evaluation.areasForImprovement || '',
          recommendation: updatedData.evaluation.recommendation || '',
          interview_duration: updatedData.evaluation.interviewDuration,
        };
      }

      const response = await fetch(`${baseURL}/api/candidates/${id}/`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        throw new Error(`Failed to update candidate status: ${response.statusText}`);
      }

      fetchCandidateDetails(id); // Re-fetch candidate details to update UI

    } catch (err) {
      console.error("Error updating candidate status:", err);
    }
  };

  if (loading) {
    return (
      <div className="candidate-not-found-container">
        <h2>Loading Candidate Details...</h2>
        <p>Please wait.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-not-found-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="back-to-candidates-btn" onClick={() => navigate('/candidates')}>
          Back to Candidates
        </button>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="candidate-not-found-container">
        <h2>Candidate Not Found</h2>
        <p>The candidate you are looking for does not exist or has been removed.</p>
        <button className="back-to-candidates-btn" onClick={() => navigate('/candidates')}>
          Back to Candidates
        </button>
      </div>
    );
  }

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

  // Function to truncate text based on screen width
  const truncateResumeName = (name) => {
    // Check if the screen width is less than a certain breakpoint (e.g., 768px for mobile)
    if (window.innerWidth <= 767) { // Corresponds to the @media (max-width: 767px) in CSS
      if (!name) return '';
      const maxLength = 10; // Truncate to 10 characters on mobile
      return name.length <= maxLength ? name : name.substring(0, maxLength) + '...';
    }
    return name; // Show full name on larger screens
  };

  return (
    <div className="candidate-details-layout">
      <div className="candidate-details-left-panel">
        <div className="candidate-details-content card"> {/* Main candidate info card */}
          <div className="back-button-container"> {/* Back button inside the card */}
            <button onClick={() => navigate('/candidates')} className="back-button">
              <FiChevronLeft size={24} /> Back to Candidates
            </button>
          </div>

          <h1 className="candidate-name-display">{candidate.name || '-'}</h1>
          <p className="candidate-role-display">{candidate.jobRole || '-'}</p>
          <span className={`status-badge ${getStatusBadgeClass(candidate.status)}`}>
            {candidate.status || 'NEW'}
          </span>

          <div className="details-grid">
            <p><strong>Email:</strong> {candidate.email || '-'}</p>
            <p><strong>Phone:</strong> {candidate.phone || '-'}</p>
            <p><strong>Domain:</strong> {candidate.domain || '-'}</p>
            <p><strong>Work Experience:</strong> {candidate.workExperience || '-'} years</p>
            <p><strong>Application Date:</strong> {candidate.applicationDate || '-'}</p>
            <p><strong>Last Updated:</strong> {candidate.lastUpdated || '-'}</p>
            <p>
              <strong>Resumes:</strong>
              {candidate.resumes && candidate.resumes.length > 0 ? (
                <ul className="resume-list-detail">
                  {candidate.resumes.map((resume, index) => (
                    <li key={index}>
                      <a href={resume.url} target="_blank" rel="noopener noreferrer" className="resume-link-detail">
                        {truncateResumeName(resume.name)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                '-'
              )}
            </p>
          </div>

          <div className="update-status-section">
            {candidate.status !== "Hired" && candidate.status !== "Rejected" && (
              <button onClick={() => setShowUpdateStatusModal(true)} className="submit-btn save-status-btn">
                Update Status
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="candidate-details-right-panel">
        {/* POC Details Section */}
        <div className="poc-details-section card">
          <h3>POC Details</h3>
          <p><strong>POC Email:</strong> {candidate.poc || '-'}</p>
          {/* Add other POC related details if available in your API response */}
        </div>

        {/* Interview Details Summary Card */}
        <div className="interview-summary-card card" onClick={() => setShowInterviewModal(true)}>
          <h3>Interview Details</h3>
          {candidate.interviewDetails ? (
            <>
              <p>Date: {candidate.interviewDetails.date || '-'}</p>
              <p>Time: {candidate.interviewDetails.time || '-'}</p>
              {candidate.interviewDetails.duration && <p>Duration: {candidate.interviewDetails.duration || '-'}</p>}
              <span className="view-details-link">View More</span>
            </>
          ) : (
            <p>Interview needs to be scheduled.</p>
          )}
        </div>

        {/* Evaluation Details Summary Card */}
        <div className="evaluation-summary-card card" onClick={() => setShowEvaluationModal(true)}>
          <h3>Evaluation Details</h3>
          {candidate.evaluation ? (
            <>
              <p>Score: {candidate.evaluation.score || '-'}/10</p>
              <p>Result: {candidate.evaluation.result || '-'}</p>
              {candidate.evaluation.interviewDuration && <p>Interview Duration: {candidate.evaluation.interviewDuration || '-'}</p>}
              <p>Feedback: {candidate.evaluation.feedback || '-'}</p>
              <span className="view-details-link">View More</span>
            </>
          ) : (
            <p>Evaluation needs to be completed.</p>
          )}
        </div>

        {/* Placeholder for BR Chats or Aptitude if needed in the future */}
        {/* <div className="br-chats-section card">
          <h3>BR Chats</h3>
          <p>No chat history available.</p>
        </div>
        <div className="aptitude-details-section card">
          <h3>Aptitude Score</h3>
          <p>Score: -</p>
        </div> */}
      </div>


      {showInterviewModal && (
        <InterviewDetailModal
          interviewDetails={candidate.interviewDetails}
          onClose={() => setShowInterviewModal(false)}
        />
      )}
      {showEvaluationModal && (
        <EvaluationDetailModal
          evaluation={candidate.evaluation}
          onClose={() => setShowEvaluationModal(false)}
        />
      )}
      {showUpdateStatusModal && (
        <UpdateStatusModal
          candidate={candidate}
          onClose={() => setShowUpdateStatusModal(false)}
          onSave={handleSaveStatus}
        />
      )}
    </div>
  );
};

export default CandidateDetails;
