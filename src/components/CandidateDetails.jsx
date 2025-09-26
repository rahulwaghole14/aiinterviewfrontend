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
import "./common/DataTable.css";
import BeatLoader from "react-spinners/BeatLoader";
import StatusUpdateModal from "./StatusUpdateModal";
import { useNotification } from "../hooks/useNotification";
import { formatTimeTo12Hour } from "../utils/timeFormatting";

// Helper function to safely parse JSON fields
const parseJsonField = (field) => {
  if (!field) return [];
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn('Failed to parse JSON field:', field);
      return [];
    }
  }
  return Array.isArray(field) ? field : [];
};

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
  const [showEditInterviewModal, setShowEditInterviewModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [showEditEvaluationModal, setShowEditEvaluationModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'interview' or 'evaluation'
  const [itemToDelete, setItemToDelete] = useState(null);

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

      console.log("Fetched interviews data:", interviewsData);
      console.log("Fetched evaluations data:", evaluationsData);
      
      // Process interviews and evaluations
      const candidateInterviews = (
        Array.isArray(interviewsData)
          ? interviewsData
          : interviewsData.results || []
      )
        .filter(
          (interview) =>
            interview.candidate === candidate.id ||
            (interview.candidate_object &&
              interview.candidate_object.id === candidate.id)
        );

      console.log("Candidate interviews:", candidateInterviews);

      // For each interview, fetch the associated slot details directly from slots API (same as AI Interview Scheduler)
      const interviewsWithSlots = await Promise.all(candidateInterviews.map(async (interview) => {
        console.log(`Processing interview ${interview.id} with slot:`, interview.slot);
        
        if (interview.slot) {
          try {
            console.log(`Fetching slot details for slot ID: ${interview.slot}`);
            const slotResponse = await fetch(`${baseURL}/api/interviews/slots/${interview.slot}/`, {
              method: "GET",
              headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              credentials: "include",
            });

            if (slotResponse.ok) {
              const slotData = await slotResponse.json();
              console.log(`=== SLOT DATA COMPARISON ===`);
              console.log(`Fetched slot data for interview ${interview.id}:`, slotData);
              console.log(`Raw start_time: "${slotData.start_time}" (type: ${typeof slotData.start_time})`);
              console.log(`Raw end_time: "${slotData.end_time}" (type: ${typeof slotData.end_time})`);
              
              // Create slot_details object with the same structure as AI Interview Scheduler
              const slotDetails = {
                id: slotData.id,
                start_time: slotData.start_time,
                end_time: slotData.end_time,
                duration_minutes: slotData.duration_minutes,
                ai_interview_type: slotData.ai_interview_type,
                status: slotData.status,
                current_bookings: slotData.current_bookings,
                max_candidates: slotData.max_candidates,
                interview_date: slotData.interview_date
              };
              
              console.log(`Created slot_details for interview ${interview.id}:`, slotDetails);
              console.log(`Slot details start_time: "${slotDetails.start_time}"`);
              console.log(`Slot details end_time: "${slotDetails.end_time}"`);
              
              return { 
                ...interview, 
                slot_details: slotDetails,
                slot: slotData // Keep original slot data too
              };
            } else {
              console.error(`Failed to fetch slot ${interview.slot}:`, slotResponse.status);
              return interview;
            }
          } catch (error) {
            console.error(`Error fetching slot ${interview.slot}:`, error);
            return interview;
          }
        }
        
        return interview;
      }));

      console.log("Interviews with slots:", interviewsWithSlots);

      // Add evaluations to interviews
      const processedInterviews = interviewsWithSlots.map((interview) => {
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

      console.log("Processed interviews with evaluations and slots:", processedInterviews);
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

  // Determine current status based on interviews and candidate status
  const getCurrentStatus = () => {
    // First check if candidate has been hired or rejected
    if (candidate?.status === "HIRED") return "HIRED";
    if (candidate?.status === "REJECTED") return "REJECTED";
    
    if (!interviews.length) return "NEW";

    const latestInterview = interviews[interviews.length - 1];
    const status = latestInterview.status?.toLowerCase();

    // Check if there's any AI evaluation for any interview
    const hasAIEvaluation = interviews.some((i) => i.ai_result);
    
    // Also check for legacy evaluation system
    const hasLegacyEvaluation = interviews.some((i) => i.evaluation);

    // Handle new status structure
    if (hasLegacyEvaluation && hasAIEvaluation) return "AI_MANUAL_EVALUATED";
    if (hasLegacyEvaluation) return "MANUAL_EVALUATED";
    if (hasAIEvaluation) return "AI_EVALUATED";
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
    { id: "manual_evaluate", label: "Manual Evaluation", status: "MANUAL_EVALUATED" },
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
        // After interview completed, next step is manual evaluation (can be done even without AI evaluation)
        return { id: "manual_evaluate", status: "MANUAL_EVALUATED" };
      case "AI_EVALUATED":
        // After AI evaluation, next step is manual evaluation
        return { id: "manual_evaluate", status: "MANUAL_EVALUATED" };
      case "MANUAL_EVALUATED":
        return { id: "hire_reject", status: "HIRE" }; // Show hire option
      default:
        return null;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (action) => {
    if (action === "schedule_interview") {
      setSelectedAction("schedule_interview");
      setShowStatusModal(true);
    } else if (action === "manual_evaluate") {
      setSelectedAction("manual_evaluate");
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
    // Refresh both interviews and candidate data after modal closes
    fetchInterviews();
    // Refresh candidate data from Redux
    dispatch(fetchCandidates());
  };

  // Interview management handlers
  const handleEditInterview = (interview) => {
    console.log("Edit interview:", interview);
    setEditingInterview(interview);
    setShowEditInterviewModal(true);
  };



  // Evaluation management handlers
  const handleEditEvaluation = (evaluation) => {
    console.log("Edit evaluation:", evaluation);
    console.log("Evaluation data structure:", {
      overall_score: evaluation.overall_score,
      traits: evaluation.traits,
      suggestions: evaluation.suggestions,
      created_at: evaluation.created_at
    });
    setEditingEvaluation(evaluation);
    setShowEditEvaluationModal(true);
  };

  const handleDeleteEvaluation = (evaluation) => {
    setDeleteType('evaluation');
    setItemToDelete(evaluation);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvaluation = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        notify.error("Authentication token not found");
        return;
      }

      // Delete the evaluation
      const response = await fetch(`${baseURL}/api/evaluations/${itemToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete evaluation: ${response.status}`);
      }

      notify.success("Evaluation deleted successfully!");
      
      // Refresh data
      fetchInterviews();
      dispatch(fetchCandidates());
      
      // Close modal
      setShowDeleteModal(false);
      setDeleteType(null);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      notify.error(error.message || "Failed to delete evaluation");
    }
  };

  const handleDeleteInterview = (interview) => {
    setDeleteType('interview');
    setItemToDelete(interview);
    setShowDeleteModal(true);
  };

  const confirmDeleteInterview = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        notify.error("Authentication token not found");
        return;
      }

      // First, release the slot if it exists
      const slotId = itemToDelete.slot || itemToDelete.slot_details?.id;
      if (slotId) {
        try {
          const releaseResponse = await fetch(`${baseURL}/api/interviews/slots/${slotId}/release_slot/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
          });

          if (releaseResponse.ok) {
            console.log("Slot released successfully");
          } else {
            console.warn("Failed to release slot, but continuing with interview deletion");
          }
        } catch (slotError) {
          console.warn("Error releasing slot:", slotError);
          // Continue with interview deletion even if slot release fails
        }
      }

      // Delete the interview
      const response = await fetch(`${baseURL}/api/interviews/${itemToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete interview: ${response.status}`);
      }

      notify.success("Interview deleted and slot released successfully!");
      
      // Refresh data
      fetchInterviews();
      dispatch(fetchCandidates());
      
      // Close modal
      setShowDeleteModal(false);
      setDeleteType(null);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting interview:", error);
      notify.error(error.message || "Failed to delete interview");
    }
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

  // Additional effect to update candidate when allCandidates changes (for status updates)
  useEffect(() => {
    if (allCandidates && candidate?.id) {
      const updatedCandidate = allCandidates.find((c) => String(c.id) === candidate.id);
      if (updatedCandidate && (
        updatedCandidate.status !== candidate.status ||
        updatedCandidate.last_updated !== candidate.last_updated
      )) {
        console.log("Updating candidate from allCandidates:", {
          oldStatus: candidate.status,
          newStatus: updatedCandidate.status,
          oldLastUpdated: candidate.last_updated,
          newLastUpdated: updatedCandidate.last_updated
        });
        setCandidate(updatedCandidate);
      }
    }
  }, [allCandidates, candidate?.id, candidate?.status, candidate?.last_updated]);

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

      // Refresh the data with a slight delay to ensure backend processing is complete
      setTimeout(async () => {
        await fetchInterviews();
      }, 1000);
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

  // Don't show actions if candidate is hired or rejected
  const shouldShowActions = currentStatus !== "HIRED" && currentStatus !== "REJECTED";

  return (
    <>
      <div className={`candidate-details-layout ${showStatusModal ? 'blur-background' : ''}`}>
      <div className="candidate-details-left-panel" style={{ paddingBottom: '50px' }}>
        <div className="candidate-details-content card">
          <div className="candidate-main-layout">
            <div className="candidate-info-section">
              <div className="back-button-container">
                <button className="back-button" onClick={() => navigate(-1)}>
                  <FiChevronLeft size={24} /> Back
                </button>
              </div>
              
              <h1 className="candidate-name-display">
                {candidate.name || "N/A"}
              </h1>
              
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
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`status-badge ${currentStatus.toLowerCase()}`}>
                      {currentStatus.replace(/_/g, " ")}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">
                    {candidate.last_updated
                      ? (() => {
                          try {
                            const date = new Date(candidate.last_updated);
                            return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString() + ' ' + date.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });
                          } catch (error) {
                            console.error("Error parsing last updated date:", error);
                            return "N/A";
                          }
                        })()
                      : "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Interview Count:</span>
                  <span className="detail-value">
                    {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">AI Evaluated:</span>
                  <span className="detail-value">
                    {interviews.some((i) => i.ai_result) ? (
                      <span className="status-indicator evaluated">Yes</span>
                    ) : (
                      <span className="status-indicator pending">No</span>
                    )}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Manual Evaluated:</span>
                  <span className="detail-value">
                    {interviews.some((i) => i.evaluation) ? (
                      <span className="status-indicator evaluated">Yes</span>
                    ) : (
                      <span className="status-indicator pending">No</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hire Recommendation and Test Scores - Right side */}
            {interviews.some((i) => i.ai_result) && (
              <div className="hire-recommendation-section">
                <div className="hire-recommendation">
                  <strong>Hire Recommendation:</strong>{" "}
                  <span className={`recommendation ${interviews.find(i => i.ai_result)?.ai_result.hire_recommendation ? "recommended" : "not-recommended"}`}>
                    {interviews.find(i => i.ai_result)?.ai_result.hire_recommendation ? "✅ RECOMMENDED" : "❌ NOT RECOMMENDED"}
                  </span>
                </div>
                <div className="test-scores">
                  <h4>Test Scores</h4>
                  <div className="test-scores-grid">
                    {interviews.find(i => i.ai_result)?.ai_result.total_score !== undefined && (
                      <div className="test-score-item">
                        <span className="test-score-label">Total Score</span>
                        <span className={`test-score-value ${interviews.find(i => i.ai_result)?.ai_result.total_score >= 80 ? "high-score" : interviews.find(i => i.ai_result)?.ai_result.total_score >= 60 ? "medium-score" : "low-score"}`}>
                          {interviews.find(i => i.ai_result)?.ai_result.total_score?.toFixed(1) || "N/A"}/100
                        </span>
                      </div>
                    )}
                    {interviews.find(i => i.ai_result)?.ai_result.technical_score !== undefined && (
                      <div className="test-score-item">
                        <span className="test-score-label">Technical</span>
                        <span className={`test-score-value ${interviews.find(i => i.ai_result)?.ai_result.technical_score >= 80 ? "high-score" : interviews.find(i => i.ai_result)?.ai_result.technical_score >= 60 ? "medium-score" : "low-score"}`}>
                          {interviews.find(i => i.ai_result)?.ai_result.technical_score?.toFixed(1) || "N/A"}/100
                        </span>
                      </div>
                    )}
                    {interviews.find(i => i.ai_result)?.ai_result.behavioral_score !== undefined && (
                      <div className="test-score-item">
                        <span className="test-score-label">Behavioral</span>
                        <span className={`test-score-value ${interviews.find(i => i.ai_result)?.ai_result.behavioral_score >= 80 ? "high-score" : interviews.find(i => i.ai_result)?.ai_result.behavioral_score >= 60 ? "medium-score" : "low-score"}`}>
                          {interviews.find(i => i.ai_result)?.ai_result.behavioral_score?.toFixed(1) || "N/A"}/100
                        </span>
                      </div>
                    )}
                    {interviews.find(i => i.ai_result)?.ai_result.coding_score !== undefined && (
                      <div className="test-score-item">
                        <span className="test-score-label">Coding</span>
                        <span className={`test-score-value ${interviews.find(i => i.ai_result)?.ai_result.coding_score >= 80 ? "high-score" : interviews.find(i => i.ai_result)?.ai_result.coding_score >= 60 ? "medium-score" : "low-score"}`}>
                          {interviews.find(i => i.ai_result)?.ai_result.coding_score?.toFixed(1) || "N/A"}/100
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
          {/* AI Results Section */}
          {interviews.some((i) => i.ai_result) && (
            <div className="evaluation-info">
              {interviews
                .filter((i) => i.ai_result)
              .map((interview) => (
                  <div key={interview.id} className="evaluation-item">
                  <div className="evaluation-header">
                      <h4>AI Evaluation Results</h4>
                      <span className={`overall-rating ${interview.ai_result.overall_rating?.toLowerCase() || "pending"}`}>
                        {interview.ai_result.overall_rating?.toUpperCase() || "PENDING"}
                      </span>
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
                    
                    {interview.ai_result.coding_details && (() => {
                      const codingDetails = parseJsonField(interview.ai_result.coding_details);
                      return codingDetails.length > 0 && (
                        <div className="coding-details">
                          <strong>Coding Questions:</strong>
                          {codingDetails.map((coding, index) => (
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
                      );
                    })()}
                    
                    {(() => {
                      const strengths = parseJsonField(interview.ai_result.strengths);
                      return strengths.length > 0 && (
                        <div className="strengths">
                          <strong>Strengths:</strong>
                          <ul>
                            {strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                    
                    {(() => {
                      const weaknesses = parseJsonField(interview.ai_result.weaknesses);
                      return weaknesses.length > 0 && (
                        <div className="weaknesses">
                          <strong>Areas for Improvement:</strong>
                          <ul>
                            {weaknesses.map((weakness, index) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                    
                    <div className="evaluation-metadata">
                      <p><strong>Evaluated on:</strong> {new Date(interview.created_at).toLocaleDateString() + ' ' + new Date(interview.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Separator between AI and Manual evaluations */}
          {interviews.some((i) => i.ai_result) && interviews.some((i) => i.evaluation) && (
            <hr style={{ margin: '20px 0', border: '1px solid #e0e0e0' }} />
          )}

          {/* Manual Evaluation Section */}
          {interviews.some((i) => i.evaluation) && (
            <div className="evaluation-info">
              <div className="evaluation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>Manual Evaluation Results</h4>
                {interviews
                  .filter((i) => i.evaluation)
                  .map((interview) => (
                    <span key={interview.id} className={`overall-rating ${interview.evaluation.overall_score >= 8 ? "excellent" : interview.evaluation.overall_score >= 6 ? "good" : interview.evaluation.overall_score >= 4 ? "fair" : "poor"}`}>
                      {interview.evaluation.overall_score >= 8 ? "EXCELLENT" : interview.evaluation.overall_score >= 6 ? "GOOD" : interview.evaluation.overall_score >= 4 ? "FAIR" : "POOR"}
                    </span>
                  ))}
                  </div>
              {interviews
                .filter((i) => i.evaluation)
                .map((interview) => (
                  <div key={interview.id}>
                  
                  {/* Score as simple text */}
                  <div className="evaluation-score-simple">
                    <p><strong>Score:</strong> <span className="score-number">{interview.evaluation.overall_score?.toFixed(1) || "N/A"}/10</span></p>
                  </div>
                  
                  {interview.evaluation.traits && (
                    <div className="traits">
                      <strong>Key Traits:</strong>
                      <p>{interview.evaluation.traits}</p>
                    </div>
                  )}
                  
                  {interview.evaluation.suggestions && (
                    <div className="suggestions">
                      <strong>Suggestions:</strong>
                      <p>{interview.evaluation.suggestions}</p>
                    </div>
                  )}
                  
                  <div className="evaluation-metadata">
                    <p><strong>Evaluated on:</strong> {new Date(interview.evaluation.created_at).toLocaleDateString() + ' ' + new Date(interview.evaluation.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}</p>
                  </div>
                  
                  {/* Evaluation Action Buttons */}
                    <div className="evaluation-actions-container" style={{ marginTop: '-10px' }}>
                    <div className="evaluation-actions">
                      <button 
                        className="edit-evaluation-btn" 
                        onClick={() => handleEditEvaluation(interview.evaluation)}
                        title="Edit Evaluation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </button>
                      <button 
                        className="delete-evaluation-btn" 
                        onClick={() => handleDeleteEvaluation(interview.evaluation)}
                        title="Delete Evaluation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                ))}
            </div>
          )}

          {/* No Evaluation Message */}
          {!interviews.some((i) => i.ai_result) && !interviews.some((i) => i.evaluation) && (
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
              // Always show both evaluation steps in sequence
              const statusStages = [
                "NEW",
                "INTERVIEW_SCHEDULED",
                "INTERVIEW_COMPLETED",
                "AI_EVALUATED",
                "MANUAL_EVALUATED",
                "HIRE",
              ];

              const statusLabels = [
                "New",
                "Schedule Interview",
                "Interview Completed",
                "AI Evaluated",
                "Manual Evaluated",
                "Hire",
              ];

              const currentIndex = statusStages.indexOf(currentStatus);
              const nextAction = getNextAction(currentStatus);

              return statusLabels.map((label, index) => {
                const stage = statusStages[index];
                
                // Status step logic
                let isCompleted = false;
                let isCurrent = false;
                let isNextAction = false;
                let isClickable = false;
                let isRecommended = false;
                let displayLabel = label;
                
                if (stage === "HIRE") {
                  // Special handling for the hire step
                  if (currentStatus === "HIRED" || currentStatus === "REJECTED") {
                    // If candidate is hired or rejected, show the final status
                    displayLabel = currentStatus === "HIRED" ? "Hired" : "Rejected";
                    isCompleted = true;
                    isCurrent = true;
                    isClickable = false;
                  } else {
                    // Show "Hire" as the next action
                    isNextAction = nextAction && nextAction.status === "HIRE";
                    isClickable = isNextAction;
                    isRecommended = isNextAction;
                  }
                } else {
                  // Regular status steps
                  isCompleted = index < currentIndex;
                  isCurrent = index === currentIndex;
                  isNextAction = nextAction && statusStages[index] === nextAction.status;
                  
                  // Special handling for AI_EVALUATED - make it non-clickable when completed
                  if (stage === "AI_EVALUATED") {
                    const hasAIEvaluation = interviews.some((i) => i.ai_result);
                    if (hasAIEvaluation) {
                      isCompleted = true;
                      isClickable = false; // AI evaluation is not clickable
                      isCurrent = false; // Never current, always completed
                    } else {
                      isClickable = false; // AI evaluation is never clickable
                      isCompleted = false; // Show as incomplete if no AI results
                    }
                  } else if (stage === "MANUAL_EVALUATED") {
                    // Manual evaluation is always clickable as next action, even if AI evaluation is not complete
                    isClickable = isNextAction || isCompleted;
                  } else {
                    isClickable = isNextAction || isCompleted;
                  }
                  
                  isRecommended = isNextAction;
                }

                // Determine additional CSS classes based on status
                let additionalClasses = "";
                if (stage === "HIRE") {
                  if (currentStatus === "HIRED") {
                    additionalClasses = "hired";
                  } else if (currentStatus === "REJECTED") {
                    additionalClasses = "rejected";
                  }
                }

                return (
                  <div
                    key={stage}
                    className={`status-step ${isCompleted ? "completed" : ""} ${
                      isCurrent ? "current" : ""
                    } ${isClickable ? "clickable" : ""} ${isRecommended ? "recommended" : ""} ${additionalClasses}`}
                    onClick={() => {
                      if (!isClickable || !shouldShowActions) return;

                      if (stage === "INTERVIEW_SCHEDULED") {
                        handleStatusUpdate("schedule_interview");
                      } else if (stage === "INTERVIEW_COMPLETED") {
                        handleStatusUpdate("complete_interview");
                      } else if (stage === "AI_EVALUATED") {
                        // AI evaluation is not clickable - handled automatically
                        return;
                      } else if (stage === "MANUAL_EVALUATED") {
                        handleStatusUpdate("manual_evaluate");
                      } else if (stage === "HIRE") {
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
                    <div className="status-label">{displayLabel}</div>
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
          {interviewsLoading ? (
            <BeatLoader color="var(--color-primary-dark)" size={8} />
          ) : interviews.length > 0 ? (
            interviews.map((interview, index) => (
              <div key={interview.id}>
                <div className="interview-header">
                  <h4>Interview Details - Round {interview.interview_round}</h4>
                  <span className={`interview-status ${interview.status.toLowerCase()}`}>
                    {interview.status}
                  </span>
                </div>
                
                <div className="interview-basic-info">
                  <p>
                    <strong>Date:</strong>{" "}
                    {interview.started_at
                      ? new Date(interview.started_at).toLocaleDateString()
                      : "TBD"}
                  </p>
                  <p>
                    <strong>Slot:</strong>{" "}
                    {(() => {
                      console.log("=== CANDIDATE DETAILS DEBUG ===");
                      console.log("Candidate ID:", candidate.id);
                      console.log("Candidate Name:", candidate.full_name);
                      console.log("Interview ID:", interview.id);
                      console.log("Full interview object:", interview);
                      console.log("Interview slot_details:", interview.slot_details);
                      console.log("Interview schedule:", interview.schedule);
                      console.log("Interview started_at:", interview.started_at);
                      console.log("Interview ended_at:", interview.ended_at);
                      
                      // Try different possible field names
                      const slotData = interview.slot_details || interview.schedule || interview.slot;
                      console.log("Slot data found:", slotData);
                      
                      // Also check if we can get slot data from the candidate's interviews
                      console.log("All candidate interviews:", candidate.interviews);
                      console.log("Current interview index:", interviews.findIndex(i => i.id === interview.id));
                      
                      // Check if there's a schedule relationship
                      if (interview.schedule) {
                        console.log("Interview schedule details:", interview.schedule);
                        if (interview.schedule.slot) {
                          console.log("Schedule slot details:", interview.schedule.slot);
                        }
                      }
                      
                      if (slotData && slotData.start_time && slotData.end_time) {
                        try {
                          console.log("Raw slot start_time:", slotData.start_time);
                          console.log("Raw slot end_time:", slotData.end_time);
                          
                          // Handle time strings using the same approach as AI Interview Scheduler
                          if (typeof slotData.start_time === 'string' && slotData.start_time.includes(':')) {
                            console.log("Time string parsing (AI Interview Scheduler method):");
                            console.log("  Start time string:", slotData.start_time);
                            console.log("  End time string:", slotData.end_time);
                            
                            // Use shared time formatting utility
                            const formatTime = (timeStr) => {
                              console.log("Formatting time string:", timeStr);
                              const result = formatTimeTo12Hour(timeStr);
                              console.log("Formatted time result:", result);
                              return result;
                            };
                            
                            const startTimeFormatted = formatTime(slotData.start_time);
                            const endTimeFormatted = formatTime(slotData.end_time);
                            
                            console.log("  Formatted start time:", startTimeFormatted);
                            console.log("  Formatted end time:", endTimeFormatted);
                            
                            return `${startTimeFormatted} - ${endTimeFormatted}`;
                          } else if (typeof slotData.start_time === 'string' && slotData.start_time.includes('T')) {
                            // Handle datetime format (e.g., "2025-09-23T09:30:00")
                            const startTime = new Date(slotData.start_time);
                            const endTime = new Date(slotData.end_time);
                            
                            console.log("Datetime string parsing:");
                            console.log("  Start datetime string:", slotData.start_time, "→", startTime);
                            console.log("  End datetime string:", slotData.end_time, "→", endTime);
                            
                            return `${startTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })} - ${endTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}`;
                          } else {
                            // Fallback for other formats
                            console.log("Unknown time format, using fallback");
                            return "Invalid time format";
                          }
                        } catch (error) {
                          console.error("Error formatting slot time:", error);
                          return "Invalid time format";
                        }
                      }
                      
                      // Fallback to started_at and ended_at if available
                      if (interview.started_at && interview.ended_at) {
                        try {
                          return `${new Date(interview.started_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })} - ${new Date(interview.ended_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`;
                        } catch (error) {
                          console.error("Error formatting interview time:", error);
                          return "Invalid time format";
                        }
                      }
                      
                      return "N/A";
                    })()}
                  </p>
                </div>
                
                {/* Interview Action Buttons - Only show for scheduled interviews */}
                {interview.status?.toLowerCase() === 'scheduled' && (
                  <div className="interview-actions-container">
                    <div className="interview-actions">
                      <button 
                        className="edit-interview-btn" 
                        onClick={() => handleEditInterview(interview)}
                        title="Edit Interview"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </button>
                      <button 
                        className="delete-interview-btn" 
                        onClick={() => handleDeleteInterview(interview)}
                        title="Delete Interview"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
                
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
                        {new Date(interview.ai_result.recording_created_at).toLocaleDateString() + ' ' + new Date(interview.ai_result.recording_created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>
                )}
                
              </div>
            ))
          ) : (
            <p className="no-data">No interviews scheduled</p>
          )}
        </div>
      </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={handleModalClose}
          onUpdateStatus={() => {
            // Refresh candidate data when status is updated
            dispatch(fetchCandidates());
          }}
          action={selectedAction}
          candidate={candidate}
          interviews={interviews}
          onSubmitEvaluation={handleEvaluationSubmit}
          onInterviewScheduled={() => {
            // Refresh both interview data and candidate data when interview is scheduled
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
          onEvaluationSubmitted={() => {
            // Refresh both interview data and candidate data when evaluation is submitted
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
        />
      )}

      {/* Edit Interview Modal */}
      {showEditInterviewModal && editingInterview && (
        <StatusUpdateModal
          isOpen={showEditInterviewModal}
          onClose={() => {
            setShowEditInterviewModal(false);
            setEditingInterview(null);
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
          action="schedule_interview"
          candidate={candidate}
          interviews={interviews}
          isEditMode={true}
          editingInterview={editingInterview}
        />
      )}

      {/* Edit Evaluation Modal */}
      {showEditEvaluationModal && editingEvaluation && (
        <StatusUpdateModal
          isOpen={showEditEvaluationModal}
          onClose={() => {
            setShowEditEvaluationModal(false);
            setEditingEvaluation(null);
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
          action="evaluate"
          candidate={candidate}
          interviews={interviews}
          isEditMode={true}
          editingEvaluation={editingEvaluation}
        />
      )}

      {/* Delete Confirmation Modal - Matching DataTable Style */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{deleteType === 'interview' ? "Delete Interview" : "Delete Evaluation"}</h3>
            <p>
              {deleteType === 'interview' 
                ? "Are you sure you want to delete this interview? This will also release the slot and cannot be undone."
                : "Are you sure you want to delete this evaluation? This action cannot be undone."
              }
            </p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteType(null);
                  setItemToDelete(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={deleteType === 'interview' ? confirmDeleteInterview : confirmDeleteEvaluation} 
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateDetails;
