// CandidateDetails.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidates } from "../redux/slices/candidatesSlice";
import {
  fetchJobs,
  selectAllJobs,
  selectJobsStatus,
} from "../redux/slices/jobsSlice";
import { baseURL } from "../data";
import "./CandidateDetails.css";
import BeatLoader from "react-spinners/BeatLoader";
import StatusUpdateModal from "./StatusUpdateModal";
import { useNotification } from "../hooks/useNotification";

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notify = useNotification();

  const allCandidates = useSelector((state) => state.candidates.allCandidates);
  const candidatesStatus = useSelector(
    (state) => state.candidates.candidatesStatus
  );
  const allJobs = useSelector(selectAllJobs);
  const jobsStatus = useSelector(selectJobsStatus);

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");

  // Get auth token from localStorage when component mounts
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
    } else {
      console.error("Authentication token not found. Please log in again.");
      // Optionally redirect to login
      // navigate('/login');
    }
  }, []);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  // Helper function to get domain name by ID
  const getDomainName = (domainId) => {
    if (typeof domainId === "string" && !/^[0-9]+$/.test(domainId)) {
      return domainId;
    }
    return domainId || "N/A";
  };

  // Helper function to get job title by ID
  const getJobTitle = (jobId) => {
    if (typeof jobId === "string" && !/^[0-9]+$/.test(jobId)) {
      return jobId;
    }
    const job = allJobs.find((j) => String(j.id) === String(jobId));
    return job ? job.job_title : jobId || "N/A";
  };

  // Fetch interviews and evaluations
  const fetchInterviews = async () => {
    if (!candidate?.id || !authToken) return;

    setInterviewsLoading(true);
    try {
      // Fetch interviews
      const interviewsResponse = await fetch(`${baseURL}/api/interviews/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!interviewsResponse.ok) {
        if (interviewsResponse.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${interviewsResponse.status}`);
      }

      // Fetch evaluations
      const evaluationsResponse = await fetch(
        `${baseURL}/api/evaluation/crud/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        }
      );

      if (!evaluationsResponse.ok) {
        console.error("Failed to fetch evaluations");
        // Don't throw error here as evaluations might be optional
      }

      const interviewsData = await interviewsResponse.json();
      const evaluationsData = evaluationsResponse.ok
        ? await evaluationsResponse.json()
        : [];

      // Process interviews and evaluations
      const processedInterviews = (
        Array.isArray(interviewsData)
          ? interviewsData
          : interviewsData.results || []
      )
        .filter(
          (interview) =>
            interview.candidate === candidate.id ||
            (interview.candidate_object &&
              interview.candidate_object.id === candidate.id)
        )
        .map((interview) => {
          // Find matching evaluation if exists
          const evaluation = Array.isArray(evaluationsData)
            ? evaluationsData.find(
                (evalItem) => evalItem.interview === interview.id
              )
            : null;

          return {
            ...interview,
            evaluation: evaluation || null,
          };
        });

      setInterviews(processedInterviews);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setInterviewsLoading(false);
    }
  };

  // Function to update interview status
  const updateInterviewStatus = async (interviewId, status) => {
    if (!authToken) {
      console.error("Authentication token not found");
      return;
    }

    try {
      const response = await fetch(
        `${baseURL}/api/interviews/${interviewId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the interviews data
      fetchInterviews();
    } catch (error) {
      console.error("Error updating interview status:", error);
    }
  };

  // Determine current status based on interviews
  const getCurrentStatus = () => {
    if (!interviews.length) return "NEW";

    const latestInterview = interviews[interviews.length - 1];
    const status = latestInterview.status?.toLowerCase();

    // Check if there's any AI evaluation for any interview
    const hasAIEvaluation = interviews.some((i) => i.ai_result);
    
    // Also check for legacy evaluation system
    const hasLegacyEvaluation = interviews.some((i) => i.evaluation);

    if (hasAIEvaluation || hasLegacyEvaluation) return "EVALUATED";
    if (status === "completed") return "INTERVIEW_COMPLETED";
    if (status === "scheduled") return "INTERVIEW_SCHEDULED";

    return "NEW";
  };

  // Available actions based on current status
  const availableActions = [
    {
      id: "schedule_interview",
      label: "Schedule Interview",
      status: "INTERVIEW_SCHEDULED",
    },
    { id: "evaluate", label: "Complete Evaluation", status: "EVALUATED" },
    { id: "hire_reject", label: "Make Decision", status: "HIRED" },
  ];

  // Get the next available action based on current status
  const getNextAction = (currentStatus) => {
    switch (currentStatus) {
      case "NEW":
        return { id: "schedule_interview", status: "INTERVIEW_SCHEDULED" };
      case "INTERVIEW_SCHEDULED":
        return { id: "complete_interview", status: "INTERVIEW_COMPLETED" };
      case "INTERVIEW_COMPLETED":
        return { id: "evaluate", status: "EVALUATED" };
      case "EVALUATED":
        return { id: "hire_reject", status: "HIRED" };
      default:
        return null;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (action) => {
    if (action === "schedule_interview") {
      setSelectedAction("schedule_interview");
      setShowStatusModal(true);
    } else if (action === "evaluate") {
      setSelectedAction("evaluate");
      setShowStatusModal(true);
    } else if (action === "hire_reject") {
      setSelectedAction("hire_reject");
      setShowStatusModal(true);
    } else if (action === "complete_interview") {
      // Find the latest scheduled interview
      const latestInterview = interviews.find(
        (interview) => interview.status?.toLowerCase() === "scheduled"
      );

      if (latestInterview) {
        try {
          await updateInterviewStatus(latestInterview.id, "completed");
          // Refresh interviews data
          await fetchInterviews();
        } catch (error) {
          console.error("Error completing interview:", error);
        }
      }
    }
  };

  const handleModalClose = () => {
    setShowStatusModal(false);
    setSelectedAction(null);
    // Refresh interviews after modal closes
    fetchInterviews();
  };



  useEffect(() => {
    if (candidatesStatus === "idle") {
      dispatch(fetchCandidates());
    }
    if (jobsStatus === "idle") {
      dispatch(fetchJobs());
    }
  }, [candidatesStatus, jobsStatus, dispatch]);

  useEffect(() => {
    if (candidatesStatus === "succeeded" && allCandidates) {
      const foundCandidate = allCandidates.find((c) => String(c.id) === id);
      setCandidate(foundCandidate);
      setLoading(false);
    } else if (candidatesStatus === "failed") {
      setLoading(false);
    }
  }, [id, candidatesStatus, allCandidates]);

  useEffect(() => {
    if (candidate) {
      fetchInterviews();
    }
  }, [candidate]);

  // Handle evaluation submission
  const handleEvaluationSubmit = async (evaluationData) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      notify.error("Authentication token not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/evaluations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          ...evaluationData,
          candidate: candidate.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the data
      await fetchInterviews();
      setShowStatusModal(false);
      notify.success("Evaluation submitted successfully!");
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      notify.error(
        error.message || "Failed to submit evaluation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="candidate-details-layout loading-container">
        <BeatLoader color="var(--color-primary-dark)" />
        <p>Loading candidate details...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="candidate-not-found-container">
        <p>Candidate not found.</p>
        <button
          className="back-to-candidates-btn"
          onClick={() => navigate("/candidates")}
        >
          Go to Candidates List
        </button>
      </div>
    );
  }

  const currentStatus = getCurrentStatus();

  return (
    <>
      <div className={`candidate-details-layout ${showStatusModal ? 'blur-background' : ''}`}>
      <div className="candidate-details-left-panel">
        <div className="candidate-details-content card">
          <div className="back-button-container">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FiChevronLeft size={24} /> Back
            </button>
          </div>
          <div className="candidate-header-container">
            <h1 className="candidate-name-display">
              {candidate.name || "N/A"}
            </h1>
          </div>
          <div className="details-grid">
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{candidate.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{candidate.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Experience:</span>
              <span className="detail-value">
                {candidate.workExperience} years
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Domain:</span>
              <span className="detail-value">
                {getDomainName(candidate.domain)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Job Title:</span>
              <span className="detail-value">
                {getJobTitle(candidate.jobRole)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Applied On:</span>
              <span className="detail-value">
                {candidate.applicationDate
                  ? (() => {
                      try {
                        const date = new Date(candidate.applicationDate);
                        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
                      } catch (error) {
                        console.error("Error parsing application date:", error);
                        return "N/A";
                      }
                    })()
                  : "N/A"}
              </span>
            </div>
          </div>
          <hr className="details-divider" />
          <h3>POC Details</h3>
          <div className="poc-details-section">
            <p>
              <strong>POC Email:</strong> {candidate.poc || "N/A"}
            </p>
          </div>
        </div>

        {/* Evaluation Section - Moved here */}
        <div className="evaluation-section card">
          <h3>Evaluation</h3>
          {interviews.some((i) => i.ai_result) ? (
            <div className="evaluation-info">
              {interviews
                .filter((i) => i.ai_result)
                .map((interview) => (
                  <div key={interview.id} className="evaluation-item">
                    <div className="evaluation-header">
                      <h4>Talaro Interview Results</h4>
                      <span className={`overall-rating ${interview.ai_result.overall_rating?.toLowerCase() || "pending"}`}>
                        {interview.ai_result.overall_rating?.toUpperCase() || "PENDING"}
                      </span>
                    </div>
                    
                    <div className="score-breakdown">
                      <div className="score-item">
                        <strong>Total Score:</strong>{" "}
                        <span className={`score ${interview.ai_result.total_score >= 80 ? "high-score" : interview.ai_result.total_score >= 60 ? "medium-score" : "low-score"}`}>
                          {interview.ai_result.total_score?.toFixed(1) || "N/A"}/100
                        </span>
                      </div>
                      
                      {interview.ai_result.technical_score !== undefined && (
                        <div className="score-item">
                          <strong>Technical Score:</strong>{" "}
                          <span className={`score ${interview.ai_result.technical_score >= 80 ? "high-score" : interview.ai_result.technical_score >= 60 ? "medium-score" : "low-score"}`}>
                            {interview.ai_result.technical_score?.toFixed(1) || "N/A"}/100
                          </span>
                        </div>
                      )}
                      
                      {interview.ai_result.behavioral_score !== undefined && (
                        <div className="score-item">
                          <strong>Behavioral Score:</strong>{" "}
                          <span className={`score ${interview.ai_result.behavioral_score >= 80 ? "high-score" : interview.ai_result.behavioral_score >= 60 ? "medium-score" : "low-score"}`}>
                            {interview.ai_result.behavioral_score?.toFixed(1) || "N/A"}/100
                          </span>
                        </div>
                      )}
                      
                      {interview.ai_result.coding_score !== undefined && (
                        <div className="score-item">
                          <strong>Coding Score:</strong>{" "}
                          <span className={`score ${interview.ai_result.coding_score >= 80 ? "high-score" : interview.ai_result.coding_score >= 60 ? "medium-score" : "low-score"}`}>
                            {interview.ai_result.coding_score?.toFixed(1) || "N/A"}/100
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="performance-metrics">
                      <div className="metric-item">
                        <strong>Questions Attempted:</strong> {interview.ai_result.questions_attempted || 0}
                      </div>
                      <div className="metric-item">
                        <strong>Questions Correct:</strong> {interview.ai_result.questions_correct || 0}
                      </div>
                      <div className="metric-item">
                        <strong>Accuracy:</strong> {interview.ai_result.accuracy_percentage?.toFixed(1) || 0}%
                      </div>
                      <div className="metric-item">
                        <strong>Average Response Time:</strong> {interview.ai_result.average_response_time?.toFixed(1) || 0}s
                      </div>
                      <div className="metric-item">
                        <strong>Completion Time:</strong> {interview.ai_result.completion_time || 0}s
                      </div>
                    </div>
                    
                    {interview.ai_result.ai_summary && (
                      <div className="ai-summary">
                        <strong>AI Summary:</strong>
                        <p>{interview.ai_result.ai_summary}</p>
                      </div>
                    )}
                    
                    {interview.ai_result.ai_recommendations && (
                      <div className="ai-recommendations">
                        <strong>AI Recommendations:</strong>
                        <p>{interview.ai_result.ai_recommendations}</p>
                      </div>
                    )}
                    
                    {interview.ai_result.coding_details && interview.ai_result.coding_details.length > 0 && (
                      <div className="coding-details">
                        <strong>Coding Questions:</strong>
                        {interview.ai_result.coding_details.map((coding, index) => (
                          <div key={index} className="coding-question">
                            <h4>Question {index + 1}</h4>
                            <p><strong>Question:</strong> {coding.question_text}</p>
                            <p><strong>Language:</strong> {coding.language}</p>
                            <p><strong>Status:</strong> 
                              <span className={`test-status ${coding.passed_all_tests ? 'passed' : 'failed'}`}>
                                {coding.passed_all_tests ? '✅ PASSED' : '❌ FAILED'}
                              </span>
                            </p>
                            <div className="code-block">
                              <strong>Submitted Code:</strong>
                              <pre><code>{coding.submitted_code}</code></pre>
                            </div>
                            {coding.output_log && (
                              <div className="output-log">
                                <strong>Test Results:</strong>
                                <pre>{coding.output_log}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {interview.ai_result.strengths && interview.ai_result.strengths.length > 0 && (
                      <div className="strengths">
                        <strong>Strengths:</strong>
                        <ul>
                          {interview.ai_result.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {interview.ai_result.weaknesses && interview.ai_result.weaknesses.length > 0 && (
                      <div className="weaknesses">
                        <strong>Areas for Improvement:</strong>
                        <ul>
                          {interview.ai_result.weaknesses.map((weakness, index) => (
                            <li key={index}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="hire-recommendation">
                      <strong>Hire Recommendation:</strong>{" "}
                      <span className={`recommendation ${interview.ai_result.hire_recommendation ? "recommended" : "not-recommended"}`}>
                        {interview.ai_result.hire_recommendation ? "✅ RECOMMENDED" : "❌ NOT RECOMMENDED"}
                      </span>
                    </div>
                    
                    {interview.ai_result.confidence_level && (
                      <div className="confidence-level">
                        <strong>AI Confidence Level:</strong> {interview.ai_result.confidence_level?.toFixed(1)}%
                      </div>
                    )}
                    
                    {interview.ai_result.human_feedback && (
                      <div className="human-feedback">
                        <strong>Human Reviewer Feedback:</strong>
                        <p>{interview.ai_result.human_feedback}</p>
                        {interview.ai_result.human_rating && (
                          <p><strong>Human Rating:</strong> {interview.ai_result.human_rating}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="no-data">{`${
              currentStatus === "INTERVIEW_COMPLETED"
                ? "Evaluation in progress..."
                : "No evaluation available"
            }`}</p>
          )}
        </div>
      </div>

      <div className="candidate-details-right-panel">
        <div className="status-card">
          <div className="status-header">
            <h3>Status</h3>
            <span className={`status-badge ${currentStatus.toLowerCase()}`}>
              {currentStatus.replace(/_/g, " ")}
            </span>
          </div>

          <div className="status-progress-bar">
            {(() => {
              const statusStages = [
                "NEW",
                "INTERVIEW_SCHEDULED",
                "INTERVIEW_COMPLETED",
                "EVALUATED",
                "HIRED",
              ];

              const statusLabels = [
                "New",
                "Schedule Interview",
                "Interview Completed",
                "Evaluate",
                "Hire/Reject",
              ];

              const currentIndex = statusStages.indexOf(currentStatus);
              const nextAction = getNextAction(currentStatus);

              return statusLabels.map((label, index) => {
                const stage = statusStages[index];
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isNextAction =
                  nextAction && statusStages[index] === nextAction.status;
                const isClickable = isNextAction || isCompleted;

                return (
                  <div
                    key={stage}
                    className={`status-step ${isCompleted ? "completed" : ""} ${
                      isCurrent ? "current" : ""
                    } ${isClickable ? "clickable" : ""}`}
                    onClick={() => {
                      if (!isClickable) return;

                      if (stage === "INTERVIEW_SCHEDULED") {
                        handleStatusUpdate("schedule_interview");
                      } else if (stage === "INTERVIEW_COMPLETED") {
                        handleStatusUpdate("complete_interview");
                      } else if (stage === "EVALUATED") {
                        handleStatusUpdate("evaluate");
                      } else if (stage === "HIRED") {
                        handleStatusUpdate("hire_reject");
                      } else if (isCompleted) {
                        const next = getNextAction(stage);
                        if (next) {
                          handleStatusUpdate(next.id);
                        }
                      }
                    }}
                  >
                    <div className="status-circle">{index + 1}</div>
                    <div className="status-label">{label}</div>
                    {index < statusStages.length - 1 && (
                      <div className="status-connector"></div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="interview-section card">
          <h3>Interview Details</h3>
          {interviewsLoading ? (
            <BeatLoader color="var(--color-primary-dark)" size={8} />
          ) : interviews.length > 0 ? (
            <div className="interview-list">
              {interviews.map((interview, index) => (
                <div key={interview.id} className="interview-item">
                  <p>
                    <strong>Round:</strong> {interview.interview_round}
                  </p>
                  <p>
                    <strong>Status:</strong> {interview.status}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {interview.started_at
                      ? new Date(interview.started_at).toLocaleDateString()
                      : "TBD"}
                  </p>

                  
                  {/* Video Recording Section */}
                  {interview.ai_result?.recording_video && (
                    <div className="recording-section">
                      <h4>Interview Recording</h4>
                      <div className="video-player-container">
                        <video
                          controls
                          className="video-player"
                          preload="metadata"
                        >
                          <source src={`${baseURL}${interview.ai_result.recording_video}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      {interview.ai_result.recording_created_at && (
                        <p className="recording-metadata">
                          <strong>Recorded:</strong>{" "}
                          {new Date(interview.ai_result.recording_created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Slot Details */}
                  {interview.slot_details && (
                    <div className="slot-details">
                      <h4>Slot Information</h4>
                      <p>
                        <strong>Start Time:</strong>{" "}
                        {new Date(interview.slot_details.start_time).toLocaleString()}
                      </p>
                      <p>
                        <strong>End Time:</strong>{" "}
                        {new Date(interview.slot_details.end_time).toLocaleString()}
                      </p>
                      <p>
                        <strong>Duration:</strong> {interview.slot_details.duration_minutes} minutes
                      </p>
                      <p>
                        <strong>Talaro Interview Type:</strong> {interview.slot_details.ai_interview_type}
                      </p>

                      {interview.booking_notes && (
                        <p>
                          <strong>Booking Notes:</strong> {interview.booking_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No interviews scheduled</p>
          )}
        </div>


      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
          }}
          onUpdateStatus={handleStatusUpdate}
          action={selectedAction}
          candidate={candidate}
          interviews={interviews}
          onSubmitEvaluation={handleEvaluationSubmit}
          onInterviewScheduled={fetchInterviews}
        />
      )}
    </>
  );
};

export default CandidateDetails;
