// StatusUpdateModal.jsx
import React, { useState, useEffect } from "react";
import { baseURL } from "../data";
import HorizontalDatePicker from "./HorizontalDatePicker";
import TimeSlotPicker from "./TimeSlotPicker";
import "./StatusUpdateModal.css";

const StatusUpdateModal = ({
  isOpen,
  onClose,
  action,
  candidate,
  interviews,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authToken, setAuthToken] = useState("");

  // Get auth token from localStorage when component mounts
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
    } else {
      setError("Authentication token not found. Please log in again.");
    }
  }, []);

  // Common headers for API calls
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Token ${authToken}`,
  });

  // Schedule Interview Form State
  const [scheduleForm, setScheduleForm] = useState({
    interview_round: "",
    selectedDate: new Date(),
    selectedTimes: [],
    video_url: "",
    feedback: "",
  });

  // Evaluation Form State
  const [evaluationForm, setEvaluationForm] = useState({
    overall_score: "",
    traits: "",
    suggestions: "",
  });

  // Hire/Reject Form State
  const [hireRejectForm, setHireRejectForm] = useState({
    decision: "", // 'hired' or 'rejected'
    feedback: "",
  });

  const resetForms = () => {
    setScheduleForm({
      interview_round: "",
      selectedDate: new Date(),
      selectedTimes: [],
      video_url: "",
      feedback: "",
    });
    setEvaluationForm({
      overall_score: "",
      traits: "",
      suggestions: "",
    });
    setHireRejectForm({
      decision: "",
      feedback: "",
    });
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    if (isOpen) {
      resetForms();
    }
  }, [isOpen, action]);

  const handleScheduleInterview = async () => {
    if (!authToken) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    if (
      !scheduleForm.interview_round ||
      scheduleForm.selectedTimes.length === 0
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const interviewData = {
        candidate: candidate.id,
        interview_round: scheduleForm.interview_round,
        scheduled_date: scheduleForm.selectedDate.toISOString().split("T")[0],
        scheduled_times: scheduleForm.selectedTimes,
        video_url: scheduleForm.video_url || null,
        feedback: scheduleForm.feedback || "",
      };

      const response = await fetch(`${baseURL}/api/interviews/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(interviewData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create interview");
      }

      const responseData = await response.json();
      setSuccess("Interview scheduled successfully!");
      onClose();
    } catch (err) {
      console.error("Error scheduling interview:", err);
      setError(err.message || "Error scheduling interview");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    if (!evaluationForm.overall_score || !evaluationForm.traits) {
      setError("Please fill in all required fields");
      return;
    }

    const latestInterview = interviews[interviews.length - 1];
    if (!latestInterview) {
      setError("No interview found to evaluate");
      return;
    }

    setLoading(true);
    try {
      const evaluationData = {
        interview: latestInterview.id,
        overall_score: parseFloat(evaluationForm.overall_score),
        traits: evaluationForm.traits,
        suggestions: evaluationForm.suggestions,
      };

      const response = await fetch(`${baseURL}/api/evaluation/crud/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create evaluation");
      }

      setSuccess("Evaluation submitted successfully!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      setError(
        error.message || "Failed to submit evaluation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHireReject = async () => {
    if (!authToken) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    if (!hireRejectForm.decision) {
      setError("Please select hire or reject");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      // Update candidate status
      const statusData = {
        status: hireRejectForm.decision === "hired" ? "HIRED" : "REJECTED",
        feedback: hireRejectForm.feedback,
      };

      const response = await fetch(
        `${baseURL}/api/candidates/${candidate.id}/`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(statusData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update candidate status");
      }

      setSuccess(`Candidate ${hireRejectForm.decision} successfully!`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error updating candidate status:", error);
      setError("Failed to update candidate status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    if (!authToken) return [];

    try {
      const formattedDate = date.toISOString().split("T")[0];
      const response = await fetch(
        `${baseURL}/api/interviews/slots/?date=${formattedDate}&is_available=true`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch available slots");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching available slots:", err);
      setError("Failed to load available time slots");
      return [];
    }
  };

  const renderScheduleInterviewForm = () => (
    <div className="modal-form">
      <h3>Schedule Interview</h3>

      <div className="form-group">
        <label>Interview Round *</label>
        <input
          type="text"
          value={scheduleForm.interview_round}
          onChange={(e) =>
            setScheduleForm({
              ...scheduleForm,
              interview_round: e.target.value,
            })
          }
          placeholder="e.g., Technical Round 1, HR Round"
          required
        />
      </div>

      <div className="form-group">
        <label>Select Date *</label>
        <HorizontalDatePicker
          selectedDate={scheduleForm.selectedDate}
          onSelectDate={(date) =>
            setScheduleForm({ ...scheduleForm, selectedDate: date })
          }
        />
      </div>

      <div className="form-group">
        <label>Select Time Slot *</label>
        <TimeSlotPicker
          selectedTimes={scheduleForm.selectedTimes}
          onSelectTimes={(times) =>
            setScheduleForm({ ...scheduleForm, selectedTimes: times })
          }
          selectedDate={scheduleForm.selectedDate}
          baseURL={baseURL}
          isModal={true}
        />
      </div>

      <div className="form-group">
        <label>Meeting Link (Optional)</label>
        <input
          type="url"
          value={scheduleForm.video_url}
          onChange={(e) =>
            setScheduleForm({ ...scheduleForm, video_url: e.target.value })
          }
          placeholder="https://meet.google.com/..."
        />
      </div>

      <div className="form-group">
        <label>Additional Notes</label>
        <textarea
          value={scheduleForm.feedback}
          onChange={(e) =>
            setScheduleForm({ ...scheduleForm, feedback: e.target.value })
          }
          placeholder="Any additional notes for the interview"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleScheduleInterview}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? "Scheduling..." : "Schedule Interview"}
        </button>
      </div>
    </div>
  );

  const renderEvaluationForm = () => (
    <div className="modal-form">
      <h3>Evaluate Candidate</h3>

      <div className="form-group">
        <label>Overall Score (0-10) *</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={evaluationForm.overall_score}
          onChange={(e) =>
            setEvaluationForm({
              ...evaluationForm,
              overall_score: e.target.value,
            })
          }
          placeholder="8.5"
          required
        />
      </div>

      <div className="form-group">
        <label>Traits & Strengths *</label>
        <textarea
          value={evaluationForm.traits}
          onChange={(e) =>
            setEvaluationForm({ ...evaluationForm, traits: e.target.value })
          }
          placeholder="Strong technical skills, excellent problem-solving ability, good communication..."
          rows="4"
          required
        />
      </div>

      <div className="form-group">
        <label>Suggestions & Feedback</label>
        <textarea
          value={evaluationForm.suggestions}
          onChange={(e) =>
            setEvaluationForm({
              ...evaluationForm,
              suggestions: e.target.value,
            })
          }
          placeholder="Consider for next round, focus on system design in future interviews..."
          rows="4"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleEvaluate}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Evaluation"}
        </button>
      </div>
    </div>
  );

  const renderHireRejectForm = () => (
    <div className="modal-form">
      <h3>Final Decision</h3>

      <div className="form-group">
        <label>Decision *</label>
        <div className="decision-buttons">
          <button
            type="button"
            className={`decision-btn hire ${
              hireRejectForm.decision === "hired" ? "selected" : ""
            }`}
            onClick={() =>
              setHireRejectForm({ ...hireRejectForm, decision: "hired" })
            }
          >
            ✓ Hire
          </button>
          <button
            type="button"
            className={`decision-btn reject ${
              hireRejectForm.decision === "rejected" ? "selected" : ""
            }`}
            onClick={() =>
              setHireRejectForm({ ...hireRejectForm, decision: "rejected" })
            }
          >
            ✗ Reject
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Feedback & Reasoning</label>
        <textarea
          value={hireRejectForm.feedback}
          onChange={(e) =>
            setHireRejectForm({ ...hireRejectForm, feedback: e.target.value })
          }
          placeholder="Provide reasoning for your decision..."
          rows="4"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleHireReject}
          className="btn-primary"
          disabled={loading || !hireRejectForm.decision}
        >
          {loading
            ? "Processing..."
            : `Confirm ${
                hireRejectForm.decision === "hired" ? "Hire" : "Reject"
              }`}
        </button>
      </div>
    </div>
  );

  const renderForm = () => {
    switch (action) {
      case "schedule_interview":
        return renderScheduleInterviewForm();
      case "evaluate":
        return renderEvaluationForm();
      case "hire_reject":
        return renderHireRejectForm();
      default:
        return <div>Unknown action</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
