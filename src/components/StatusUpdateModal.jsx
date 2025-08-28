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
  onInterviewScheduled,
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
    selectedDate: new Date(),
    selectedTimes: [],
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
      selectedDate: new Date(),
      selectedTimes: [],
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

    if (scheduleForm.selectedTimes.length === 0) {
      setError("Please select a time slot");
      return;
    }

    // Convert selected times to proper datetime format
    const selectedDate = scheduleForm.selectedDate.toISOString().split("T")[0];
    let startedAt = null;
    let endedAt = null;
    
    if (scheduleForm.selectedTimes.length > 0) {
      // Get the first selected time slot
      const firstTime = scheduleForm.selectedTimes[0];
      const lastTime = scheduleForm.selectedTimes[scheduleForm.selectedTimes.length - 1];
      
      // Parse time ranges (e.g., "10:00-11:00" or "10:00")
      let startTime, endTime;
      
      if (firstTime.includes("-")) {
        startTime = firstTime.split("-")[0];
      } else {
        startTime = firstTime;
      }
      
      if (lastTime.includes("-")) {
        endTime = lastTime.split("-")[1];
      } else {
        // If no end time specified, assume 1 hour duration
        const [hours, minutes] = startTime.split(":");
        const endHours = (parseInt(hours) + 1).toString().padStart(2, "0");
        endTime = `${endHours}:${minutes}`;
      }
      
      // Add timezone offset to make it timezone-aware
      const timezoneOffset = new Date().getTimezoneOffset();
      const timezoneHours = Math.abs(Math.floor(timezoneOffset / 60));
      const timezoneMinutes = Math.abs(timezoneOffset % 60);
      const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
      const timezoneString = `${timezoneSign}${timezoneHours.toString().padStart(2, '0')}:${timezoneMinutes.toString().padStart(2, '0')}`;
      
      startedAt = `${selectedDate}T${startTime}:00${timezoneString}`;
      endedAt = `${selectedDate}T${endTime}:00${timezoneString}`;
    }

    // Validate that we have valid start and end times
    if (!startedAt || !endedAt) {
      setError("Please select valid time slots for the interview");
      return;
    }

    // Validate that we have valid start and end times
    if (!startedAt || !endedAt) {
      setError("Please select valid time slots for the interview");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const interviewData = {
        candidate: candidate.id,
        job: candidate.job?.id || candidate.job || null, // Get job ID if it's an object, otherwise use as is
        started_at: startedAt,
        ended_at: endedAt,
        feedback: scheduleForm.feedback || "",
      };

      // Debug logging (can be removed in production)
      console.log("Sending interview data:", interviewData);

      // Step 1: Create the interview
      const response = await fetch(`${baseURL}/api/interviews/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(interviewData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Interview creation failed:", errorData);
        console.error("Response status:", response.status);
        console.error("Response headers:", response.headers);
        
        // Log the full error object
        if (typeof errorData === 'object') {
          console.error("Error details:", JSON.stringify(errorData, null, 2));
        }
        
        throw new Error(errorData.detail || errorData.message || JSON.stringify(errorData) || "Failed to create interview");
      }

      const responseData = await response.json();
      const interviewId = responseData.id;

      // Step 2: Find and book the appropriate slot
      if (scheduleForm.selectedTimes.length > 0) {
        // Get available slots for the selected date
        const formattedDate = scheduleForm.selectedDate.toISOString().split("T")[0];
        const slotsResponse = await fetch(
          `${baseURL}/api/interviews/slots/?date=${formattedDate}&status=available`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          const availableSlots = slotsData.results || slotsData || [];

          // Find a slot that matches our selected time
          const matchingSlot = availableSlots.find(slot => {
            const slotStartTime = slot.start_time.split("T")[1]?.substring(0, 5);
            const slotEndTime = slot.end_time.split("T")[1]?.substring(0, 5);
            const slotTimeRange = `${slotStartTime}-${slotEndTime}`;
            
            return scheduleForm.selectedTimes.includes(slotTimeRange);
          });

          if (matchingSlot) {
            // Book the interview to this slot
            const bookingData = {
              interview_id: interviewId,
              booking_notes: scheduleForm.feedback || ""
            };

            const bookingResponse = await fetch(
              `${baseURL}/api/interviews/slots/${matchingSlot.id}/book_slot/`,
              {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(bookingData),
              }
            );

            if (!bookingResponse.ok) {
              console.warn("Failed to book slot, but interview was created");
            }
          }
        }
      }

      setSuccess("Interview scheduled successfully!");
      onClose();
      // Call callback to refresh interview data
      if (onInterviewScheduled) {
        onInterviewScheduled();
      }
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
