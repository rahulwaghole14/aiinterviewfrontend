// AiInterviewScheduler.jsx - Company Slot Management System
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInterviewSlots,
  clearSlotsError,
  setSlots,
} from "../redux/slices/interviewSlotsSlice";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiUsers,
  FiSettings,
  FiBarChart,
} from "react-icons/fi";
import { BeatLoader } from "react-spinners";
import HorizontalDatePicker from "./HorizontalDatePicker";
import TimeSlotPicker from "./TimeSlotPicker";
import "./AiInterviewScheduler.css";

const AiInterviewScheduler = ({
  onClose,
  onTitleChange,
  baseURL = "http://localhost:8000",
}) => {
  const dispatch = useDispatch();
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
  } = useSelector(
    (state) =>
      state.interviewSlots ?? { slots: [], loading: false, error: null }
  );

  // Get user data from Redux store
  const user = useSelector(
    (state) => state?.user?.user || state?.user?.currentUser || {}
  );
  console.log("User data in AiInterviewScheduler:", user);

  const [initialLoading, setInitialLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState("slot-management");
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]);

  // Initialize form with safe defaults and user data
  const [slotForm, setSlotForm] = useState(() => ({
    ai_interview_type: "technical",
    difficulty_level: "intermediate",
    question_count: 10,
    time_limit: 60,
    topics: "algorithms, data_structures",
    max_candidates: 1,
    job: "",
    company: user?.company_name || user?.company || "",
  }));

  // Reset form function - defined before any handlers that use it
  const resetSlotForm = useCallback(() => {
    setSelectedDate(new Date());
    setSelectedTimes([]);
    setSlotForm({
      ai_interview_type: "technical",
      difficulty_level: "intermediate",
      question_count: 10,
      time_limit: 60,
      topics: "algorithms, data_structures",
      max_candidates: 1,
      job: "",
      company: user?.company_name || user?.company || "",
    });
  }, [user]);

  // Initialize data with better error handling
  const initializeData = useCallback(async () => {
    console.log("Initializing interview slots data...");
    setInitialLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Dispatching fetchInterviewSlots...");
      const resultAction = await dispatch(fetchInterviewSlots());

      if (fetchInterviewSlots.fulfilled.match(resultAction)) {
        console.log("Slots loaded successfully:", resultAction.payload);
        if (!resultAction.payload || resultAction.payload.length === 0) {
          console.warn("No slots returned from API");
          setFormError("No interview slots found");
        }
      } else {
        console.error("Failed to load slots:", resultAction.error);
        setFormError(
          resultAction.error.message || "Failed to load interview slots"
        );
      }
    } catch (error) {
      console.error("Error in initializeData:", error);
      setFormError(error.message || "An error occurred while loading slots");
    } finally {
      setInitialLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    console.log("Current user data:", user);
    if (user && Object.keys(user).length > 0) {
      console.log("User authenticated, initializing data...");
      initializeData();
    } else {
      console.warn("No user data found. User might not be authenticated.");
      setFormError("Please log in to access interview scheduling.");
    }
  }, [user, initializeData]);

  // Add a manual refresh function
  const handleRefresh = useCallback(() => {
    setRetryCount(0);
    setFormError(null);
    initializeData();
  }, [initializeData]);

  // Enhanced fetchSlots with better error handling
  const fetchSlots = useCallback(
    async (force = false) => {
      if ((slotsLoading || isSubmitting) && !force) {
        console.log("Skipping fetch - already loading or submitting");
        return;
      }

      try {
        console.log("Starting fetchSlots...");
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          throw new Error("Authentication token not found");
        }

        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const companyId = userData?.company_id || userData?.id;
        console.log("Company ID:", companyId);

        let url = `${baseURL}/api/interviews/slots/`;
        if (companyId) {
          url += `${url.includes("?") ? "&" : "?"}company_id=${companyId}`;
        }
        console.log("Fetching from URL:", url);

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(
            `Failed to fetch slots: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Response data:", data);

        // Handle both array and object with results property
        const slots = data.results || data;
        console.log("Extracted slots:", slots);

        return Array.isArray(slots) ? slots : [];
      } catch (error) {
        console.error("Error in fetchSlots:", error);
        setFormError(error.message);
        throw error;
      }
    },
    [baseURL, slotsLoading, isSubmitting]
  );

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedTimes([]);
  }, []);

  const handleTimeSelect = useCallback((times, duration) => {
    setSelectedTimes(times);
    if (duration) {
      setSlotForm((prev) => ({
        ...prev,
        time_limit: duration,
      }));
    }
  }, []);

  const handleSlotSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (selectedTimes.length === 0) {
        setFormError("Please select at least one time slot");
        return;
      }

      try {
        setIsSubmitting(true);
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Authentication token not found");

        const formattedDate = selectedDate.toISOString().split("T")[0];

        if (selectedTimes.length > 0) {
          const sortedTimes = [...selectedTimes].sort();

          let overallStartTime, overallEndTime;

          const firstTime = sortedTimes[0];
          const lastTime = sortedTimes[sortedTimes.length - 1];

          if (firstTime.includes("-")) {
            overallStartTime = firstTime.split("-")[0];
          } else {
            overallStartTime = firstTime;
          }

          if (lastTime.includes("-")) {
            overallEndTime = lastTime.split("-")[1];
          } else {
            overallEndTime = addMinutesToTime(lastTime, 30, selectedDate);
          }

          console.log(
            "Creating single slot from:",
            overallStartTime,
            "to:",
            overallEndTime
          );
          console.log("Selected times:", selectedTimes);
          console.log("Formatted date:", formattedDate);
          console.log(
            "Final start_time:",
            `${formattedDate}T${overallStartTime}:00`
          );
          console.log(
            "Final end_time:",
            `${formattedDate}T${overallEndTime}:00`
          );

          const slotData = {
            date: formattedDate,
            start_time: `${formattedDate}T${overallStartTime}:00`,
            end_time: `${formattedDate}T${overallEndTime}:00`,
            ai_interview_type: slotForm.ai_interview_type,
            ai_configuration: {
              difficulty_level: slotForm.difficulty_level,
              question_count: parseInt(slotForm.question_count),
              time_limit: parseInt(slotForm.time_limit),
              topics: slotForm.topics.split(",").map((t) => t.trim()),
            },
            max_candidates: parseInt(slotForm.max_candidates),
            status: slotForm.status || "available",
            job: slotForm.job || null,
            company: user?.company_id || user?.id || null,
          };

          const response = await fetch(`${baseURL}/api/interviews/slots/`, {
            method: "POST",
            headers: {
              Authorization: `Token ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(slotData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Failed to create slot: ${JSON.stringify(errorData)}`
            );
          }

          await fetchSlots();
          resetSlotForm();
        }
      } catch (error) {
        console.error("Error creating slot:", error);
        setFormError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedTimes,
      selectedDate,
      slotForm,
      user,
      baseURL,
      fetchSlots,
      resetSlotForm,
    ]
  );

  const handleUpdateSlot = useCallback(
    async (slotId) => {
      try {
        setIsSubmitting(true);
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Authentication token not found");

        if (!slotForm.start_time || !slotForm.end_time) {
          throw new Error("Start time and end time are required");
        }

        const formattedDate = selectedDate.toISOString().split("T")[0];

        const startMinutes = timeToMinutes(slotForm.start_time);
        const endMinutes = timeToMinutes(slotForm.end_time);
        const calculatedTimeLimit = endMinutes - startMinutes;

        if (endMinutes <= startMinutes) {
          throw new Error("End time must be after start time");
        }

        const slotData = {
          date: formattedDate,
          start_time: `${formattedDate}T${slotForm.start_time}:00`,
          end_time: `${formattedDate}T${slotForm.end_time}:00`,
          ai_interview_type: slotForm.ai_interview_type,
          ai_configuration: {
            difficulty_level: slotForm.difficulty_level,
            question_count: parseInt(slotForm.question_count) || 10,
            time_limit:
              calculatedTimeLimit > 0
                ? calculatedTimeLimit
                : parseInt(slotForm.time_limit) || 60,
            topics: slotForm.topics
              ? slotForm.topics
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t)
              : [],
          },
          max_candidates: parseInt(slotForm.max_candidates) || 1,
          status: slotForm.status || "available",
          job: slotForm.job || null,
          company: user?.company_id || user?.id || null,
        };

        const response = await fetch(
          `${baseURL}/api/interviews/slots/${slotId}/`,
          {
            method: "PUT",
            headers: {
              Authorization: `Token ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(slotData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to update slot: ${JSON.stringify(errorData)}`
          );
        }

        await fetchSlots();
        setEditingSlot(null);
      } catch (error) {
        console.error("Error updating slot:", error);
        setFormError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      slotForm,
      selectedDate,
      user,
      baseURL,
      fetchSlots,
      setEditingSlot,
      setIsSubmitting,
    ]
  );

  const handleDeleteSlot = useCallback(
    async (slotId) => {
      if (!window.confirm("Are you sure you want to delete this slot?")) return;

      try {
        setIsSubmitting(true);
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Authentication token not found");

        const response = await fetch(
          `${baseURL}/api/interviews/slots/${slotId}/`,
          {
            method: "DELETE",
            headers: { Authorization: `Token ${authToken}` },
          }
        );

        if (!response.ok) throw new Error("Failed to delete slot");

        await fetchSlots();
      } catch (error) {
        console.error("Error deleting slot:", error);
        setFormError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [baseURL, fetchSlots, setIsSubmitting]
  );

  const handleEditSlot = useCallback(
    (slot) => {
      setEditingSlot(slot);
      setSelectedDate(new Date(slot.date || slot.start_time?.split("T")[0]));

      let startTime = "";
      let endTime = "";

      if (slot.start_time) {
        if (slot.start_time.includes("T")) {
          startTime = slot.start_time.split("T")[1]?.substring(0, 5) || "";
        } else {
          startTime = slot.start_time.substring(0, 5);
        }
      }

      if (slot.end_time) {
        if (slot.end_time.includes("T")) {
          endTime = slot.end_time.split("T")[1]?.substring(0, 5) || "";
        } else {
          endTime = slot.end_time.substring(0, 5);
        }
      }

      setSelectedTimes([startTime]);
      setSlotForm({
        ai_interview_type: slot.ai_interview_type || "technical",
        difficulty_level: slot.ai_configuration?.difficulty_level || "medium",
        question_count: slot.ai_configuration?.question_count || 10,
        time_limit: slot.ai_configuration?.time_limit || 60,
        topics: slot.ai_configuration?.topics?.join(", ") || "",
        max_candidates: slot.max_candidates || 1,
        job: slot.job || "",
        company: slot.company || user?.company || "",
        start_time: startTime,
        end_time: endTime,
        status: slot.status || "available",
      });
    },
    [user]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingSlot(null);
    resetSlotForm();
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingSlot) return;
    await handleUpdateSlot(editingSlot.id);
    setEditingSlot(null);
  }, [editingSlot, handleUpdateSlot]);

  const addMinutesToTime = useCallback((time, minutes, baseDate) => {
    if (!time) return "";
    const [hours, mins] = time.split(":").map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, mins + minutes, 0, 0);

    const newHours = String(date.getHours()).padStart(2, "0");
    const newMins = String(date.getMinutes()).padStart(2, "0");

    return `${newHours}:${newMins}`;
  }, []);

  const formatTimeTo12Hour = useCallback((time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, []);

  const convertTo24Hour = useCallback((time12) => {
    if (!time12) return "";
    const [time, ampm] = time12.split(" ");
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);

    if (ampm === "PM" && hours !== 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }, []);

  const convertTo12Hour = useCallback((time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, []);

  const timeToMinutes = useCallback((time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }, []);

  const renderSlotForm = useCallback(() => {
    return (
      <div className="ai-int-slot-form">
        <div className="ai-int-form-group">
          <label>Date</label>
          <HorizontalDatePicker
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            isDateFullyBooked={() => false}
          />
        </div>

        <div className="ai-int-form-group">
          <label>Time Slots</label>
          {selectedDate && (
            <TimeSlotPicker
              selectedTimes={selectedTimes}
              onSelectTimes={handleTimeSelect}
              selectedDate={selectedDate}
              baseURL={baseURL}
              isBooking={isSubmitting}
              setIsBooking={setIsSubmitting}
              aiInterviewType={slotForm.ai_interview_type}
              onAvailableSlotsChange={(slots) => {
                console.log("Available slots updated:", slots);
              }}
              onAllSlotsChange={(slots) => {
                console.log("All slots updated:", slots);
              }}
            />
          )}
        </div>

        <div className="ai-int-form-group">
                                  <label>Talaro Interview Type</label>
          <select
            value={slotForm.ai_interview_type}
            onChange={(e) =>
              setSlotForm((prev) => ({
                ...prev,
                ai_interview_type: e.target.value,
              }))
            }
          >
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="coding">Coding</option>
            <option value="system_design">System Design</option>
            <option value="case_study">Case Study</option>
          </select>
        </div>

        <div className="ai-int-form-group">
          <label>Difficulty Level</label>
          <select
            value={slotForm.difficulty_level}
            onChange={(e) =>
              setSlotForm((prev) => ({
                ...prev,
                difficulty_level: e.target.value,
              }))
            }
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div className="ai-int-form-row">
          <div className="ai-int-form-group">
            <label>Question Count</label>
            <input
              type="number"
              min="1"
              max="20"
              value={slotForm.question_count}
              onChange={(e) =>
                setSlotForm((prev) => ({
                  ...prev,
                  question_count: e.target.value,
                }))
              }
            />
          </div>
          <div className="ai-int-form-group">
            <label>Duration (calculated from time slots)</label>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
              }}
            >
              <input
                type="number"
                value={slotForm.time_limit}
                disabled
                style={{
                  backgroundColor: "#f5f5f5",
                  cursor: "not-allowed",
                  paddingRight: "60px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#666",
                  fontSize: "0.9em",
                  pointerEvents: "none",
                }}
              >
                minutes
              </span>
            </div>
            <small style={{ color: "#666", fontSize: "0.85em" }}>
              Duration is automatically calculated from selected time slots
            </small>
          </div>
        </div>

        <div className="ai-int-form-group">
          <label>Topics (comma separated)</label>
          <input
            type="text"
            value={slotForm.topics}
            onChange={(e) =>
              setSlotForm((prev) => ({
                ...prev,
                topics: e.target.value,
              }))
            }
            placeholder="algorithms, data_structures, system_design"
          />
        </div>

        <div className="ai-int-form-group">
          <label>Max Candidates</label>
          <input
            type="number"
            min="1"
            value={slotForm.max_candidates}
            onChange={(e) =>
              setSlotForm((prev) => ({
                ...prev,
                max_candidates: e.target.value,
              }))
            }
          />
        </div>

        <div className="ai-int-form-actions">
          <button
            type="button"
            className="ai-int-create-btn"
            disabled={isSubmitting}
            onClick={handleSlotSubmit}
          >
            {isSubmitting ? "Creating..." : "Create Slot"}
          </button>
        </div>
      </div>
    );
  }, [
    selectedDate,
    selectedTimes,
    slotForm,
    isSubmitting,
    handleDateSelect,
    handleTimeSelect,
    handleSlotSubmit,
  ]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case "slot-management":
        return renderSlotManagement();
      case "company-updates":
        return renderCompanyUpdates();
      case "analytics":
        return renderAnalytics();
      default:
        return renderSlotManagement();
    }
  }, [activeTab]);

  const renderSlotManagement = useCallback(
    () => (
      <div className="ai-int-content-wrapper">
        <div className="ai-int-slot-management-container">
          {/* Left Side - Form */}
          <div className="ai-int-slot-form-section">
            <div className="ai-int-form-header">
              <h4>{editingSlot ? "Edit Slot" : "Create New Slot"}</h4>
            </div>
            {renderSlotForm()}
          </div>

          {/* Right Side - Table */}
          <div className="ai-int-slots-table-section">
            <div className="ai-int-slots-table-header">
              <h4>Interview Slots</h4>
            </div>
            <div className="ai-int-slots-table-container">
              {slotsLoading ? (
                <div className="ai-int-loading-container">
                  <BeatLoader color="#4f46e5" />
                  <p>Loading slots...</p>
                </div>
              ) : slots.length > 0 ? (
                <table className="ai-int-slots-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => (
                      <tr
                        key={slot.id}
                        className={
                          editingSlot?.id === slot.id ? "editing-row" : ""
                        }
                      >
                        <td>
                          {new Date(slot.start_time).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(slot.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -
                          {new Date(slot.end_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>{slot.ai_interview_type}</td>
                        <td>
                          <span className={`ai-int-status ${slot.status}`}>
                            {slot.status}
                          </span>
                        </td>
                        <td>
                          <div className="ai-int-action-buttons">
                            <button
                              onClick={() => handleEditSlot(slot)}
                              className="ai-int-edit-btn"
                              title="Edit Slot"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="ai-int-delete-btn"
                              title="Delete Slot"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="ai-int-no-slots">
                  <p>
                    No interview slots found. Create your first slot using the
                    form.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    [
      editingSlot,
      slots,
      slotsLoading,
      renderSlotForm,
      handleEditSlot,
      handleDeleteSlot,
    ]
  );

  const renderCompanyUpdates = useCallback(
    () => (
      <div className="ai-int-company-updates-container">
        <h4>Company Updates</h4>
        <p>Company management features coming soon...</p>
      </div>
    ),
    []
  );

  const renderAnalytics = useCallback(
    () => (
      <div className="ai-int-analytics-container">
        <h4>Analytics & Reports</h4>
        <p>Analytics dashboard coming soon...</p>
      </div>
    ),
    []
  );

  useEffect(() => {
    if (onTitleChange) {
              onTitleChange("Talaro Interview Manager");
    }
  }, [onTitleChange]);

  if (initialLoading) {
    return (
      <div className="ai-int-interview-scheduler-loading">
        <BeatLoader color="#4f46e5" />
        <p>Loading Management System...</p>
      </div>
    );
  }

  if (slotsError) {
    return (
      <div className="ai-int-interview-scheduler">
        <div className="ai-int-error-container">
          <p className="ai-int-error-message">{slotsError}</p>
          <button
            onClick={handleRefresh}
            className="ai-int-retry-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-interview-scheduler">
      {/* Left Side - Form Card (25%) */}
      <div className="ai-int-form-container">
        <div className="ai-int-card ai-int-form-card">
          <div className="ai-int-form-header">
            <h3>{editingSlot ? "Edit Interview Slot" : "Create New Slot"}</h3>
          </div>
          {formError && <div className="ai-int-error-message">{formError}</div>}
          <form onSubmit={handleSlotSubmit} className="ai-int-form">
            <div className="ai-int-form-group">
              <label>Date</label>
              <HorizontalDatePicker
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                isDateFullyBooked={() => false}
              />
            </div>

            <div className="ai-int-form-group">
              <label>Time Slots</label>
              {selectedDate && (
                <TimeSlotPicker
                  selectedTimes={selectedTimes}
                  onSelectTimes={handleTimeSelect}
                  selectedDate={selectedDate}
                  baseURL={baseURL}
                  isBooking={isSubmitting}
                  setIsBooking={setIsSubmitting}
                  aiInterviewType={slotForm.ai_interview_type}
                />
              )}
            </div>

            <div className="ai-int-form-group">
              <label>Interview Type</label>
              <select
                value={slotForm.ai_interview_type}
                onChange={(e) =>
                  setSlotForm({
                    ...slotForm,
                    ai_interview_type: e.target.value,
                  })
                }
              >
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="system-design">System Design</option>
              </select>
            </div>

            <div className="ai-int-form-group">
              <label>Difficulty Level</label>
              <select
                value={slotForm.difficulty_level}
                onChange={(e) =>
                  setSlotForm({
                    ...slotForm,
                    difficulty_level: e.target.value,
                  })
                }
              >
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="ai-int-form-group">
              <label>Question Count</label>
              <input
                type="number"
                min="1"
                max="20"
                value={slotForm.question_count}
                onChange={(e) =>
                  setSlotForm({
                    ...slotForm,
                    question_count: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="ai-int-form-group">
              <label>Topics (comma separated)</label>
              <input
                type="text"
                value={slotForm.topics}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, topics: e.target.value })
                }
                placeholder="e.g., algorithms, data structures, system design"
              />
            </div>

            <div className="ai-int-form-group">
              <label>Max Candidates</label>
              <input
                type="number"
                min="1"
                value={slotForm.max_candidates}
                onChange={(e) =>
                  setSlotForm({
                    ...slotForm,
                    max_candidates: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="ai-int-form-actions">
              <button
                type="submit"
                className="ai-int-btn ai-int-btn-primary"
                disabled={isSubmitting || slotsLoading}
              >
                {isSubmitting ? (
                  <BeatLoader size={8} color="#fff" />
                ) : editingSlot ? (
                  "Update Slot"
                ) : (
                  "Create Slot"
                )}
              </button>
              {editingSlot && (
                <button
                  type="button"
                  className="ai-int-btn ai-int-btn-secondary"
                  onClick={() => {
                    setEditingSlot(null);
                    resetSlotForm();
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Table Card (75%) */}
      <div className="ai-int-table-container">
        <div className="ai-int-card ai-int-table-card">
          <div className="ai-int-table-header">
            <h2 className="ai-int-table-title">Interview Slots</h2>
            <button
              className="ai-int-btn ai-int-btn-secondary"
              onClick={handleRefresh}
              disabled={slotsLoading}
            >
              {slotsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="ai-int-table-wrapper">
            <div className="ai-int-table-container">
              {slotsLoading ? (
                <div className="ai-int-loading-container">
                  <BeatLoader color="#4299e1" />
                  <p>Loading interview slots...</p>
                </div>
              ) : slotsError ? (
                <div className="ai-int-error-message">
                  Error loading slots: {slotsError}
                </div>
              ) : slots.length > 0 ? (
                <table className="ai-int-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => (
                      <tr key={slot.id}>
                        <td>
                          {new Date(slot.start_time).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(slot.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(slot.end_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>{slot.ai_interview_type}</td>
                        <td>
                          <span
                            className={`ai-int-status-badge ${
                              slot.status === "available"
                                ? "available"
                                : "booked"
                            }`}
                          >
                            {slot.status}
                          </span>
                        </td>
                        <td>
                          <div className="ai-int-actions">
                            <button
                              className="ai-int-btn ai-int-btn-edit"
                              onClick={() => handleEditSlot(slot)}
                              title="Edit Slot"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              className="ai-int-btn ai-int-btn-delete"
                              onClick={() => handleDeleteSlot(slot.id)}
                              title="Delete Slot"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="ai-int-empty-state">
                  <p>
                    No interview slots found. Create your first slot to get
                    started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInterviewScheduler;
