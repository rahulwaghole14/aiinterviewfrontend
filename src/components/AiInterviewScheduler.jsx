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
import DataTable from "./common/DataTable";
import LoadingSpinner from "./common/LoadingSpinner";
import { baseURL } from "../config/constants";
import { useNotification } from "../hooks/useNotification";
import "./AiInterviewScheduler.css";

const AiInterviewScheduler = ({
  onClose,
  onTitleChange,
}) => {
  const dispatch = useDispatch();
  const notify = useNotification();
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
  const [refreshKey, setRefreshKey] = useState(0);

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
          notify.info("No interview slots found", "Information");
        }
      } else {
        console.error("Failed to load slots:", resultAction.error);
        notify.error(
          resultAction.error.message || "Failed to load interview slots"
        );
      }
    } catch (error) {
      console.error("Error in initializeData:", error);
      notify.error(error.message || "An error occurred while loading slots");
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
      notify.error("Please log in to access interview scheduling.");
    }
  }, [user, initializeData]);

  // Add a manual refresh function
  const handleRefresh = useCallback(() => {
    setRetryCount(0);
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
        const slotsData = data.results || data;
        console.log("Extracted slots:", slotsData);

        // Update Redux state with the fetched slots
        const validSlots = Array.isArray(slotsData) ? slotsData : [];
        dispatch(setSlots(validSlots));
        
        return validSlots;
      } catch (error) {
        console.error("Error in fetchSlots:", error);
        notify.error(error.message || "Failed to fetch slots");
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
        notify.error("Please select at least one time slot");
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
          // Force TimeSlotPicker to refresh by changing the key
          setRefreshKey(prev => prev + 1);
          // Also clear and reset selected times to trigger refresh
          setSelectedTimes([]);
          resetSlotForm();
          notify.success("Interview slot created successfully!");
        }
      } catch (error) {
        console.error("Error creating slot:", error);
        notify.error(error.message || "Failed to create slot");
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
        notify.success("Interview slot updated successfully!");
      } catch (error) {
        console.error("Error updating slot:", error);
        notify.error(error.message || "Failed to update slot");
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
        notify.success("Interview slot deleted successfully!");
      } catch (error) {
        console.error("Error deleting slot:", error);
        notify.error(error.message || "Failed to delete slot");
      } finally {
        setIsSubmitting(false);
      }
    },
    [baseURL, fetchSlots, setIsSubmitting]
  );

  // New function for DataTable delete integration
  const handleDeleteSlotAPI = useCallback(
    async (slotId) => {
      try {
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
        throw error; // Re-throw so DataTable can handle the error
      }
    },
    [baseURL, fetchSlots]
  );

  // New function for DataTable edit integration
  const handleUpdateSlotAPI = useCallback(
    async (editedData) => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Authentication token not found");

        // Process the simplified data structure
        let processedData = { ...editedData };
        
        console.log('Edited data with new structure:', editedData);
        
        // Helper function to convert 12-hour to 24-hour format
        function convertTo24Hour(time12) {
          try {
            const timeParts = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (!timeParts) {
              return time12; // Return as-is if not 12-hour format
            }
            
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const ampm = timeParts[3].toUpperCase();
            
            // Convert to 24-hour format
            if (ampm === 'AM' && hours === 12) {
              hours = 0;
            } else if (ampm === 'PM' && hours !== 12) {
              hours += 12;
            }
            
            // Format as HH:MM:SS for backend
            const hours24 = hours.toString().padStart(2, '0');
            const minutes24 = minutes.toString().padStart(2, '0');
            return `${hours24}:${minutes24}:00`;
          } catch (error) {
            console.error('Error converting time:', error);
            return time12; // Return original if conversion fails
          }
        }
        
        // Convert 12-hour format times to 24-hour format if needed
        if (processedData.start_time && processedData.start_time.includes('M')) {
          // This is 12-hour format, convert it
          processedData.start_time = convertTo24Hour(processedData.start_time);
          console.log('Converted start_time:', processedData.start_time);
        }
        
        if (processedData.end_time && processedData.end_time.includes('M')) {
          // This is 12-hour format, convert it
          processedData.end_time = convertTo24Hour(processedData.end_time);
          console.log('Converted end_time:', processedData.end_time);
        }
        
        // Validate times (now with 24-hour format)
        if (processedData.start_time && processedData.end_time) {
          try {
            // Parse time strings (format: "HH:MM:SS" or "HH:MM")
            const startParts = processedData.start_time.split(':');
            const endParts = processedData.end_time.split(':');
            
            const startHours = parseInt(startParts[0]);
            const startMinutes = parseInt(startParts[1]);
            const endHours = parseInt(endParts[0]);
            const endMinutes = parseInt(endParts[1]);
            
            // Create time objects for comparison
            const startTimeMinutes = startHours * 60 + startMinutes;
            const endTimeMinutes = endHours * 60 + endMinutes;
            
            if (startTimeMinutes >= endTimeMinutes) {
              throw new Error("End time must be after start time");
            }

            // Check business hours (8:00 AM - 10:00 PM)
            const businessStart = 8 * 60; // 8:00 AM in minutes
            const businessEnd = 22 * 60;  // 10:00 PM in minutes
            
            if (startTimeMinutes < businessStart || endTimeMinutes > businessEnd) {
              const startTime12 = new Date(2000, 0, 1, startHours, startMinutes).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              const endTime12 = new Date(2000, 0, 1, endHours, endMinutes).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              
              throw new Error(
                `Interview time (${startTime12} - ${endTime12}) must be between 8:00 AM and 10:00 PM.`
              );
            }
          } catch (parseError) {
            console.error('Error parsing time for validation:', parseError);
            throw new Error('Invalid time format. Please use format like "9:30 AM" or "2:15 PM"');
          }
        }

        const slotData = {
          interview_date: processedData.interview_date,
          start_time: processedData.start_time,
          end_time: processedData.end_time,
          ai_interview_type: processedData.ai_interview_type,
          status: processedData.status,
          max_candidates: processedData.max_candidates,
          // Keep other fields from original data
          ai_configuration: processedData.ai_configuration,
          job: processedData.job,
          company: processedData.company,
          slot_type: processedData.slot_type,
          notes: processedData.notes,
          is_recurring: processedData.is_recurring,
          recurring_pattern: processedData.recurring_pattern,
        };
        
        console.log('Slot data being sent to API:', slotData);

        const response = await fetch(
          `${baseURL}/api/interviews/slots/${editedData.id}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(slotData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          console.error('Response status:', response.status);
          console.error('Response statusText:', response.statusText);
          
          throw new Error(
            errorData.detail || errorData.message || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`
          );
        }

        // Force refresh the data and UI
        await fetchSlots();
        setRefreshKey(prev => prev + 1); // Refresh TimeSlotPicker and DataTable
        
        // Add a small delay to ensure state updates are processed
        setTimeout(() => {
          console.log("Data refresh completed");
        }, 100);
      } catch (error) {
        console.error("Error updating slot:", error);
        throw error; // Re-throw so DataTable can handle the error
      }
    },
    [baseURL, fetchSlots, setRefreshKey]
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
              key={`${selectedDate.toISOString().split('T')[0]}-${refreshKey}`}
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

          {/* Interview Slots Table */}
          <DataTable
            key={`slots-table-${refreshKey}`}
            title="Interview Slots"
            columns={[
              {
                field: "interview_date",
                header: "Date",
                width: "8%",
                type: "date",
                editable: true,
                render: (value) => {
                  if (!value) return 'N/A';
                  return new Date(value).toLocaleDateString();
                },
              },
              {
                field: "start_time",
                header: "Start Time",
                width: "9%",
                type: "time12",
                editable: true,
                render: (value) => {
                  // Handle null or invalid time values
                  if (!value || typeof value !== 'string') {
                    return 'N/A';
                  }
                  
                  // Convert 24-hour time to 12-hour format for display
                  const [hours, minutes] = value.split(':');
                  const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                    hour: "numeric",
                            minute: "2-digit",
                    hour12: true
                  });
                  return hour12;
                },
                formatForEdit: (value) => {
                  // Handle null or invalid time values
                  if (!value || typeof value !== 'string') {
                    return '';
                  }
                  
                  // Convert 24-hour time (17:45:00) to 12-hour format for editing (5:45 PM)
                  const [hours, minutes] = value.split(':');
                  const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                    hour: "numeric",
                            minute: "2-digit",
                    hour12: true
                  });
                  return hour12;
                },
                parseFromEdit: (editValue, originalRowData) => {
                  // Convert 12-hour format (5:45 PM) back to 24-hour format (17:45:00) for API
                  if (!editValue) return '';
                  
                  try {
                    // Parse 12-hour time format
                    const timeParts = editValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (!timeParts) {
                      throw new Error('Invalid time format');
                    }
                    
                    let hours = parseInt(timeParts[1]);
                    const minutes = parseInt(timeParts[2]);
                    const ampm = timeParts[3].toUpperCase();
                    
                    // Convert to 24-hour format
                    if (ampm === 'AM' && hours === 12) {
                      hours = 0;
                    } else if (ampm === 'PM' && hours !== 12) {
                      hours += 12;
                    }
                    
                    // Format as HH:MM:SS for backend
                    const hours24 = hours.toString().padStart(2, '0');
                    const minutes24 = minutes.toString().padStart(2, '0');
                    return `${hours24}:${minutes24}:00`;
                  } catch (error) {
                    console.error('Error parsing time:', error);
                    return editValue; // Return original value if parsing fails
                  }
                }
              },
              {
                field: "end_time", 
                header: "End Time",
                width: "9%",
                type: "time12",
                editable: true,
                render: (value) => {
                  // Handle null or invalid time values
                  if (!value || typeof value !== 'string') {
                    return 'N/A';
                  }
                  
                  // Convert 24-hour time to 12-hour format for display
                  const [hours, minutes] = value.split(':');
                  const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                  });
                  return hour12;
                },
                formatForEdit: (value) => {
                  // Handle null or invalid time values
                  if (!value || typeof value !== 'string') {
                    return '';
                  }
                  
                  // Convert 24-hour time (18:45:00) to 12-hour format for editing (6:45 PM)
                  const [hours, minutes] = value.split(':');
                  const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                  });
                  return hour12;
                },
                parseFromEdit: (editValue, originalRowData) => {
                  // Convert 12-hour format (6:45 PM) back to 24-hour format (18:45:00) for API
                  if (!editValue) return '';
                  
                  try {
                    // Parse 12-hour time format
                    const timeParts = editValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (!timeParts) {
                      throw new Error('Invalid time format');
                    }
                    
                    let hours = parseInt(timeParts[1]);
                    const minutes = parseInt(timeParts[2]);
                    const ampm = timeParts[3].toUpperCase();
                    
                    // Convert to 24-hour format
                    if (ampm === 'AM' && hours === 12) {
                      hours = 0;
                    } else if (ampm === 'PM' && hours !== 12) {
                      hours += 12;
                    }
                    
                    // Format as HH:MM:SS for backend
                    const hours24 = hours.toString().padStart(2, '0');
                    const minutes24 = minutes.toString().padStart(2, '0');
                    return `${hours24}:${minutes24}:00`;
                  } catch (error) {
                    console.error('Error parsing time:', error);
                    return editValue; // Return original value if parsing fails
                  }
                }
              },
              {
                field: "duration_minutes",
                header: "Duration",
                width: "7%",
                editable: true,
                type: "number",
                render: (value) => value ? `${value}m` : 'N/A',
              },
              {
                field: "ai_interview_type",
                header: "Type",
                width: "9%",
                type: "select",
                editable: true,
                options: [
                  { value: "technical", label: "Technical" },
                  { value: "behavioral", label: "Behavioral" },
                  { value: "coding", label: "Coding" },
                  { value: "system_design", label: "System Design" },
                  { value: "general", label: "General" },
                ],
              },
              {
                field: "status",
                header: "Status",
                width: "8%",
                type: "select",
                editable: true,
                options: [
                  { value: "available", label: "Available" },
                  { value: "booked", label: "Booked" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "completed", label: "Completed" },
                ],
                render: (value) => (
                  <span className="status-cell" data-status={value?.toLowerCase()}>
                    {value}
                          </span>
                ),
              },
              {
                field: "slot_type",
                header: "Slot Type",
                width: "8%",
                type: "select",
                editable: true,
                options: [
                  { value: "fixed", label: "Fixed" },
                  { value: "flexible", label: "Flexible" },
                  { value: "recurring", label: "Recurring" },
                ],
              },
              {
                field: "max_candidates",
                header: "Max Candidates",
                width: "8%",
                editable: true,
                type: "number",
              },
              {
                field: "current_bookings",
                header: "Bookings",
                width: "7%",
                editable: false,
                render: (value) => value || 0,
              },
              {
                field: "available_spots",
                header: "Spots",
                width: "6%",
                editable: false,
                render: (value) => value || 0,
              },
              {
                field: "is_recurring",
                header: "Recurring",
                width: "7%",
                type: "select",
                editable: true,
                options: [
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ],
                render: (value) => value ? "Yes" : "No",
              },
              {
                field: "notes",
                header: "Notes",
                width: "10%",
                editable: true,
              },
              {
                field: "company_name",
                header: "Company",
                width: "8%",
                editable: false,
              },
              {
                field: "job_title",
                header: "Job",
                width: "8%",
                editable: false,
              },
              {
                field: "created_at",
                header: "Created",
                width: "8%",
                editable: false,
                render: (value) => {
                  if (!value) return 'N/A';
                  return new Date(value).toLocaleDateString();
                },
              },
              {
                field: "updated_at",
                header: "Updated",
                width: "8%",
                editable: false,
                render: (value) => {
                  if (!value) return 'N/A';
                  return new Date(value).toLocaleDateString();
                },
              },
            ]}
            data={slots || []}
            loading={slotsLoading}
            actions={["edit", "delete"]}
            onAction={(action, rowData, rowIndex) => {
              if (action === "edit") {
                // For edit, we let DataTable handle inline editing
                return;
              } else if (action === "delete") {
                handleDeleteSlot(rowData.id);
              }
            }}
            onEdit={async (editedData) => {
              // Handle save from DataTable inline editing
              await handleUpdateSlotAPI(editedData);
            }}
            showRefresh={true}
            onRefresh={async () => {
              await fetchSlots();
              setRefreshKey(prev => prev + 1);
            }}
            showActions={true}
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
          />
          {slots.length === 0 && !slotsLoading && (
                <div className="ai-int-no-slots">
                  <p>
                    No interview slots found. Create your first slot using the
                    form.
                  </p>
                </div>
              )}
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
      {/* Left Side - Form */}
      <div className="ai-int-form-container">
          <form onSubmit={handleSlotSubmit} className="ai-int-form">
          <h3 className="ai-int-form-title">Interview Scheduler</h3>
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

      {/* Interview Slots Table */}
      <DataTable
        title="Interview Slots"
        columns={[
          {
            field: "interview_date",
            header: "Date",
            width: "15%",
            type: "date",
            editable: true,
            render: (value) => {
              if (!value) return 'N/A';
              return new Date(value).toLocaleDateString();
            },
          },
          {
            field: "start_time",
            header: "Start Time",
            width: "12%",
            type: "time12",
            editable: true,
            render: (value) => {
              // Handle null or invalid time values
              if (!value || typeof value !== 'string') {
                return 'N/A';
              }
              
              // Convert 24-hour time to 12-hour format for display
              const [hours, minutes] = value.split(':');
              const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                hour: "numeric",
                            minute: "2-digit",
                hour12: true
              });
              return hour12;
            },
            formatForEdit: (value) => {
              // Handle null or invalid time values
              if (!value || typeof value !== 'string') {
                return '';
              }
              
              // Convert 24-hour time (17:45:00) to 12-hour format for editing (5:45 PM)
              const [hours, minutes] = value.split(':');
              const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                hour: "numeric",
                            minute: "2-digit",
                hour12: true
              });
              return hour12;
            },
            parseFromEdit: (editValue, originalRowData) => {
              // Convert 12-hour format (5:45 PM) back to 24-hour format (17:45:00) for API
              if (!editValue) return '';
              
              try {
                // Parse 12-hour time format
                const timeParts = editValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (!timeParts) {
                  throw new Error('Invalid time format');
                }
                
                let hours = parseInt(timeParts[1]);
                const minutes = parseInt(timeParts[2]);
                const ampm = timeParts[3].toUpperCase();
                
                // Convert to 24-hour format
                if (ampm === 'AM' && hours === 12) {
                  hours = 0;
                } else if (ampm === 'PM' && hours !== 12) {
                  hours += 12;
                }
                
                // Format as HH:MM:SS for backend
                const hours24 = hours.toString().padStart(2, '0');
                const minutes24 = minutes.toString().padStart(2, '0');
                return `${hours24}:${minutes24}:00`;
              } catch (error) {
                console.error('Error parsing time:', error);
                return editValue; // Return original value if parsing fails
              }
            }
          },
          {
            field: "end_time", 
            header: "End Time",
            width: "12%",
            type: "time12",
            editable: true,
            render: (value) => {
              // Handle null or invalid time values
              if (!value || typeof value !== 'string') {
                return 'N/A';
              }
              
              // Convert 24-hour time to 12-hour format for display
              const [hours, minutes] = value.split(':');
              const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              });
              return hour12;
            },
            formatForEdit: (value) => {
              // Handle null or invalid time values
              if (!value || typeof value !== 'string') {
                return '';
              }
              
              // Convert 24-hour time (18:45:00) to 12-hour format for editing (6:45 PM)
              const [hours, minutes] = value.split(':');
              const hour12 = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              });
              return hour12;
            },
            parseFromEdit: (editValue, originalRowData) => {
              // Convert 12-hour format (6:45 PM) back to 24-hour format (18:45:00) for API
              if (!editValue) return '';
              
              try {
                // Parse 12-hour time format
                const timeParts = editValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (!timeParts) {
                  throw new Error('Invalid time format');
                }
                
                let hours = parseInt(timeParts[1]);
                const minutes = parseInt(timeParts[2]);
                const ampm = timeParts[3].toUpperCase();
                
                // Convert to 24-hour format
                if (ampm === 'AM' && hours === 12) {
                  hours = 0;
                } else if (ampm === 'PM' && hours !== 12) {
                  hours += 12;
                }
                
                // Format as HH:MM:SS for backend
                const hours24 = hours.toString().padStart(2, '0');
                const minutes24 = minutes.toString().padStart(2, '0');
                return `${hours24}:${minutes24}:00`;
              } catch (error) {
                console.error('Error parsing time:', error);
                return editValue; // Return original value if parsing fails
              }
            }
          },
          {
            field: "ai_interview_type",
            header: "Type",
            width: "18%",
            type: "select",
            editable: true,
            options: [
              { value: "technical", label: "Technical Interview" },
              { value: "behavioral", label: "Behavioral Interview" },
              { value: "coding", label: "Coding Interview" },
              { value: "system_design", label: "System Design Interview" },
              { value: "general", label: "General Interview" },
            ],
          },
          {
            field: "status",
            header: "Status",
            width: "15%",
            type: "select",
            editable: true,
            options: [
              { value: "available", label: "Available" },
              { value: "booked", label: "Booked" },
              { value: "cancelled", label: "Cancelled" },
              { value: "completed", label: "Completed" },
            ],
            render: (value) => (
              <span className="status-cell" data-status={value?.toLowerCase()}>
                {value}
                          </span>
            ),
          },
          {
            field: "max_candidates",
            header: "Max",
            width: "8%",
            type: "number",
            editable: true,
            render: (value) => value || 1,
          },
        ]}
        data={slots || []}
        loading={slotsLoading}
        actions={["edit", "delete"]}
        onAction={(action, rowData, rowIndex) => {
          if (action === "edit") {
            // For edit, we let DataTable handle inline editing
            return;
          } else if (action === "delete") {
            // Handle delete directly with API call
            handleDeleteSlotAPI(rowData.id);
          }
        }}
        onEdit={async (editedData) => {
          // Handle save from DataTable inline editing
          await handleUpdateSlotAPI(editedData);
        }}
        showRefresh={true}
        onRefresh={() => dispatch(fetchInterviewSlots())}
        showActions={true}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
};

export default AiInterviewScheduler;
