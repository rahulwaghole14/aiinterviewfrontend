// StatusUpdateModal.jsx
import React, { useState, useEffect } from "react";
import { baseURL } from "../data";
import HorizontalDatePicker from "./HorizontalDatePicker";
import TimeSlotPicker from "./TimeSlotPicker";
import Modal from "./common/Modal";
import { useNotification } from "../hooks/useNotification";
import { useDispatch } from "react-redux";
import { updateCandidateStatus } from "../redux/slices/candidatesSlice";
import "./StatusUpdateModal.css";

const StatusUpdateModal = ({
  isOpen,
  onClose,
  action,
  candidate,
  interviews,
  onInterviewScheduled,
  onEvaluationSubmitted,
  onUpdateStatus,
}) => {
  const notify = useNotification();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");

  // Get auth token from localStorage when component mounts
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
    } else {
      notify.error("Authentication token not found. Please log in again.");
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
  };

  useEffect(() => {
    if (isOpen) {
      resetForms();
    }
  }, [isOpen, action]);

  const handleScheduleInterview = async () => {
    if (!authToken) {
      notify.error("Authentication token not found. Please log in again.");
      return;
    }

    if (scheduleForm.selectedTimes.length === 0) {
      notify.error("Please select a time slot");
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
      notify.error("Please select valid time slots for the interview");
      return;
    }

    // Validate that we have valid start and end times
    if (!startedAt || !endedAt) {
      notify.error("Please select valid time slots for the interview");
      return;
    }

    setLoading(true);

    try {
      // First, find the matching slot to get the slot ID
      const formattedDate = scheduleForm.selectedDate.toISOString().split("T")[0];
      const slotsResponse = await fetch(
        `${baseURL}/api/interviews/slots/?date=${formattedDate}&status=available`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!slotsResponse.ok) {
        throw new Error("Failed to fetch available slots");
      }

      const slotsData = await slotsResponse.json();
      const availableSlots = slotsData.results || slotsData || [];

      // Find the matching slot
      console.log("=== SLOT MATCHING DEBUG ===");
      console.log("Available slots:", availableSlots);
      console.log("Selected times:", scheduleForm.selectedTimes);
      
      const matchingSlot = availableSlots.find(slot => {
        let slotStartTime, slotEndTime;
        
        if (typeof slot.start_time === 'string') {
          if (slot.start_time.includes("T")) {
            slotStartTime = slot.start_time.split("T")[1]?.substring(0, 5);
            slotEndTime = slot.end_time.split("T")[1]?.substring(0, 5);
          } else {
            slotStartTime = slot.start_time.substring(0, 5);
            slotEndTime = slot.end_time.substring(0, 5);
          }
        }
        
        const slotTimeRange = `${slotStartTime}-${slotEndTime}`;
        console.log(`Checking slot ${slot.id}: ${slotTimeRange} vs selected: ${scheduleForm.selectedTimes}`);
        const isMatch = scheduleForm.selectedTimes.includes(slotTimeRange);
        console.log(`Match found: ${isMatch}`);
        return isMatch;
      });

      console.log("=== SLOT MATCHING RESULT ===");
      console.log("Matching slot found:", !!matchingSlot);
      
      if (matchingSlot) {
        console.log("Found matching slot:", matchingSlot);
      } else {
        console.log("No matching slot found, creating interview without slot link");
        console.log("This might cause time display issues in Candidate Details");
      }

      const interviewData = {
        candidate: candidate.id,
        job: candidate.job?.id || candidate.job || null,
        ...(matchingSlot && { slot: matchingSlot.id }), // Only add slot if found
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

      // Step 2: Update the slot booking (only if we found a matching slot)
      if (matchingSlot) {

        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          const availableSlots = slotsData.results || slotsData || [];

          console.log("=== SLOT BOOKING DEBUG ===");
          console.log("Available slots data:", slotsData);
          console.log("Available slots array:", availableSlots);
          console.log("Number of available slots:", availableSlots.length);
          
          // Log each slot's details
          availableSlots.forEach((slot, index) => {
            console.log(`Slot ${index + 1}:`, {
              id: slot.id,
              start_time: slot.start_time,
              end_time: slot.end_time,
              status: slot.status,
              current_bookings: slot.current_bookings,
              max_candidates: slot.max_candidates,
              interview_date: slot.interview_date,
              ai_interview_type: slot.ai_interview_type
            });
          });

          // Find a slot that matches our selected time
          const matchingSlot = availableSlots.find(slot => {
            console.log("Checking slot:", slot);
            console.log("Slot start_time:", slot.start_time, "type:", typeof slot.start_time);
            console.log("Slot end_time:", slot.end_time, "type:", typeof slot.end_time);
            
            let slotStartTime, slotEndTime;
            
            if (typeof slot.start_time === 'string') {
              if (slot.start_time.includes("T")) {
                // Datetime format: "2025-09-23T09:30:00"
                slotStartTime = slot.start_time.split("T")[1]?.substring(0, 5);
                slotEndTime = slot.end_time.split("T")[1]?.substring(0, 5);
              } else {
                // Time format: "09:30:00"
                slotStartTime = slot.start_time.substring(0, 5);
                slotEndTime = slot.end_time.substring(0, 5);
              }
            }
            
            const slotTimeRange = `${slotStartTime}-${slotEndTime}`;
            console.log("Slot time range:", slotTimeRange);
            console.log("Selected times:", scheduleForm.selectedTimes);
            console.log("Match found:", scheduleForm.selectedTimes.includes(slotTimeRange));
            
            return scheduleForm.selectedTimes.includes(slotTimeRange);
          });

          console.log("=== SLOT MATCHING RESULT ===");
          console.log("Matching slot found:", !!matchingSlot);
          if (matchingSlot) {
            console.log("Matched slot details:", {
              id: matchingSlot.id,
              start_time: matchingSlot.start_time,
              end_time: matchingSlot.end_time,
              status: matchingSlot.status,
              current_bookings: matchingSlot.current_bookings,
              max_candidates: matchingSlot.max_candidates
            });
          } else {
            console.log("No matching slot found for selected times:", scheduleForm.selectedTimes);
          }

          if (matchingSlot) {
            // Update slot booking based on current bookings
            const currentBookings = matchingSlot.current_bookings || 0;
            const maxCandidates = matchingSlot.max_candidates || 1;
            
            let updateData;
            if (currentBookings >= maxCandidates - 1) {
              // If this is the last available slot, mark as booked
              updateData = {
                current_bookings: maxCandidates,
                status: "booked"
              };
            } else {
              // Otherwise, just increment current_bookings
              updateData = {
                current_bookings: currentBookings + 1
              };
            }

            console.log("=== SLOT UPDATE PROCESS ===");
            console.log(`Updating slot ${matchingSlot.id}:`, updateData);
            console.log(`Before update - current_bookings: ${currentBookings}, max_candidates: ${maxCandidates}`);

            // Get the complete slot data first
            console.log("Fetching complete slot data...");
            const slotGetResponse = await fetch(
              `${baseURL}/api/interviews/slots/${matchingSlot.id}/`,
              {
                method: "GET",
                headers: getAuthHeaders(),
              }
            );

            if (!slotGetResponse.ok) {
              console.error("Failed to fetch slot data for update");
            } else {
              const completeSlotData = await slotGetResponse.json();
              console.log("Complete slot data fetched:", completeSlotData);
              
              // Merge the update data with complete slot data
              const fullUpdateData = {
                ...completeSlotData,
                ...updateData
              };

              console.log("Full update data (merged):", fullUpdateData);
              console.log("Update data being sent:", updateData);

              console.log("Sending PUT request to update slot...");
              const slotUpdateResponse = await fetch(
                `${baseURL}/api/interviews/slots/${matchingSlot.id}/`,
                {
                  method: "PUT",
                  headers: getAuthHeaders(),
                  body: JSON.stringify(fullUpdateData),
                }
              );

              console.log("Slot update response status:", slotUpdateResponse.status);
              console.log("Slot update response headers:", Object.fromEntries(slotUpdateResponse.headers.entries()));

              if (!slotUpdateResponse.ok) {
                const errorData = await slotUpdateResponse.json().catch(() => ({}));
                console.error("=== SLOT UPDATE FAILED ===");
                console.error("Failed to update slot:", errorData);
                console.error("Response status:", slotUpdateResponse.status);
                console.warn("Failed to update slot, but interview was created");
              } else {
                const updatedSlotData = await slotUpdateResponse.json();
                console.log("=== SLOT UPDATE SUCCESS ===");
                console.log("Slot updated successfully:", updatedSlotData);
                console.log(`After update - current_bookings: ${updatedSlotData.current_bookings}, status: ${updatedSlotData.status}`);
                console.log("Updated slot times:", {
                  start_time: updatedSlotData.start_time,
                  end_time: updatedSlotData.end_time
                });
              }
            }

            // Also create the schedule relationship
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
              console.warn("Failed to create schedule relationship, but interview was created");
            }
          }
        }
      }

      notify.success("Interview scheduled successfully!");
      onClose();
      // Call callback to refresh interview data
      if (onInterviewScheduled) {
        onInterviewScheduled();
      }
    } catch (err) {
      console.error("Error scheduling interview:", err);
      notify.error(err.message || "Error scheduling interview");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      notify.error("Authentication token not found. Please log in again.");
      return;
    }

    if (!evaluationForm.overall_score || !evaluationForm.traits) {
      notify.error("Please fill in all required fields");
      return;
    }

    const latestInterview = interviews[interviews.length - 1];
    if (!latestInterview) {
      notify.error("No interview found to evaluate");
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

      notify.success("Evaluation submitted successfully!");
      
      // Call the callback to refresh evaluation data in parent component
      if (onEvaluationSubmitted) {
        onEvaluationSubmitted();
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      notify.error(
        error.message || "Failed to submit evaluation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHireReject = async () => {
    if (!authToken) {
      notify.error("Authentication token not found. Please log in again.");
      return;
    }

    if (!hireRejectForm.decision) {
      notify.error("Please select hire or reject");
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

      // Update Redux state immediately
      dispatch(updateCandidateStatus({
        id: candidate.id,
        newStatus: hireRejectForm.decision === "hired" ? "HIRED" : "REJECTED",
        updatedData: {
          status: hireRejectForm.decision === "hired" ? "HIRED" : "REJECTED",
          feedback: hireRejectForm.feedback,
          last_updated: new Date().toISOString()
        }
      }));

      notify.success(`Candidate ${hireRejectForm.decision} successfully!`);
      // Call the onUpdateStatus callback if provided
      if (onUpdateStatus) {
        onUpdateStatus();
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error updating candidate status:", error);
      notify.error("Failed to update candidate status. Please try again.");
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
      notify.error("Failed to load available time slots");
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

  const getModalTitle = () => {
    switch (action) {
      case "schedule_interview":
        return "Schedule Interview";
      case "evaluate":
        return "Evaluate Candidate";
      case "hire_reject":
        return "Hire/Reject Decision";
      default:
        return "Update Status";
    }
  };

  if (!isOpen) return null;

  const getModalFooter = () => {
    switch (action) {
      case "schedule_interview":
        return (
          <div className="modal-form-actions">
            <button type="button" onClick={onClose} className="common-modal-btn btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScheduleInterview}
              className="common-modal-btn btn-primary"
              disabled={loading}
            >
              {loading ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        );
      case "evaluate":
        return (
          <div className="modal-form-actions">
            <button type="button" onClick={onClose} className="common-modal-btn btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEvaluate}
              className="common-modal-btn btn-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Evaluation"}
            </button>
          </div>
        );
      case "hire_reject":
        return (
          <div className="modal-form-actions">
            <button type="button" onClick={onClose} className="common-modal-btn btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleHireReject}
              className="common-modal-btn btn-primary"
              disabled={loading || !hireRejectForm.decision}
            >
              {loading ? "Processing..." : "Submit Decision"}
            </button>
          </div>
        );
      default:
        return (
          <div className="modal-confirm-actions">
            <button className="common-modal-btn btn-cancel" onClick={onClose}>
              Close
            </button>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="large"
      showCloseButton={true}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      showFooter={true}
      footer={getModalFooter()}
    >
      {renderForm()}
    </Modal>
  );
};

export default StatusUpdateModal;
