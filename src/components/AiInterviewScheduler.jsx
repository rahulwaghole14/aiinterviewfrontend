// AiInterviewScheduler.jsx - Company Slot Management System
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInterviewSlots,
  clearSlotsError,
  setSlots,
} from "../redux/slices/interviewSlotsSlice";
import CustomDropdown from './common/CustomDropdown';
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
import ContextMenu from "./common/ContextMenu";
import { baseURL } from "../config/constants";
import { useNotification } from "../hooks/useNotification";
import { formatTimeTo12Hour, formatTimeTo24Hour } from "../utils/timeFormatting";
import "./AiInterviewScheduler.css";

const AiInterviewScheduler = ({
  onClose,
  onTitleChange,
}) => {
  const dispatch = useDispatch();
  const notify = useNotification();
  const searchTerm = useSelector((state) => state.search?.searchTerm || '');
  
  // Search term handling
  useEffect(() => {
    // Handle search term changes
  }, [searchTerm]);
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

  const [initialLoading, setInitialLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState("slot-management");
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    rowData: null,
    rowIndex: null,
  });

  // DataTable edit state
  const [editingRow, setEditingRow] = useState(null);
  const [editingData, setEditingData] = useState(null);

  // Sort slots based on search term for better user experience
  const sortedSlots = useMemo(() => {
    if (!slots || slots.length === 0) return [];
    
    // If no search term, return all slots sorted by date (most recent first)
    if (!searchTerm) {
      return [...slots].sort((a, b) => {
        if (a.interview_date && b.interview_date) {
          return new Date(b.interview_date) - new Date(a.interview_date);
        }
        return 0;
      });
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    return [...slots].sort((a, b) => {
      // Calculate relevance scores for both slots - search ALL fields
      const getRelevanceScore = (slot) => {
        let score = 0;
        
        // Search ALL fields in the slot object dynamically
        const searchAllFields = (obj, prefix = '') => {
          Object.entries(obj || {}).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            
            let searchValue;
            if (typeof value === 'object' && value !== null) {
              // Handle nested objects recursively
              searchAllFields(value, `${prefix}${key}.`);
              return;
            } else if (typeof value === 'boolean') {
              searchValue = value ? 'true' : 'false';
            } else if (typeof value === 'number') {
              searchValue = String(value);
            } else if (value instanceof Date) {
              searchValue = value.toLocaleDateString() + ' ' + value.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            } else {
              searchValue = String(value);
            }
            
            const fieldStr = searchValue.toLowerCase();
            if (fieldStr.includes(searchLower)) {
              if (fieldStr.startsWith(searchLower)) score += 10; // Starts with search term
              else score += 5; // Contains search term
            }
          });
        };
        
        searchAllFields(slot);
        
        // Calculate relevance score for search
        
        return score;
      };
      
      const aScore = getRelevanceScore(a);
      const bScore = getRelevanceScore(b);
      
      // Sort by relevance score (higher scores first)
      if (bScore !== aScore) return bScore - aScore;
      
      // If same relevance, sort by date (most recent first)
      if (a.interview_date && b.interview_date) {
        return new Date(b.interview_date) - new Date(a.interview_date);
      }
      
      return 0;
    });
  }, [slots, searchTerm]);

  // Initialize form with default values
  const [slotForm, setSlotForm] = useState(() => ({
    ai_interview_type: "technical",
    difficulty_level: "intermediate",
    question_count: "10",
    time_limit: "",
    topics: "",
    max_candidates: "1",
    job: "",
    company: "",
  }));

  // Reset form function - defined before any handlers that use it
  const resetSlotForm = useCallback(() => {
    setSelectedDate(new Date());
    setSelectedTimes([]);
    setSlotForm({
      ai_interview_type: "technical",
      difficulty_level: "intermediate",
      question_count: "10",
      time_limit: "",
      topics: "",
      max_candidates: "1",
      job: "",
      company: "",
    });
  }, []);

  // Initialize data with better error handling
  const initializeData = useCallback(async () => {
    setInitialLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const resultAction = await dispatch(fetchInterviewSlots());

      if (fetchInterviewSlots.fulfilled.match(resultAction)) {
        // Slots loaded successfully
      } else {
        notify.error(
          resultAction.error.message || "Failed to load interview slots"
        );
      }
    } catch (error) {
      notify.error(error.message || "An error occurred while loading slots");
    } finally {
      setInitialLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (user && Object.keys(user).length > 0) {
      initializeData();
    } else {
      notify.error("Please log in to access interview scheduling.");
    }
  }, [user, initializeData]);

  // Add a manual refresh function
  const handleRefresh = useCallback(() => {
    setRetryCount(0);
    initializeData();
  }, [initializeData]);

  // Context menu handlers
  const handleContextMenuClick = (event, rowData, rowIndex) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      rowData,
      rowIndex,
    });
  };

  const handleContextMenuAction = (action, rowData, rowIndex) => {
    if (action === "edit") {
      // Trigger DataTable's edit mode by setting editing state
      setEditingRow(rowIndex);
      setEditingData({ ...rowData });
    } else if (action === "delete") {
      // Use the same delete function that shows confirmation
      handleDeleteSlot(rowData.id);
    }
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      rowData: null,
      rowIndex: null,
    });
  };

  // Enhanced fetchSlots with better error handling
  const fetchSlots = useCallback(
    async (force = false) => {
      if ((slotsLoading || isSubmitting) && !force) {
        return;
      }

      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          throw new Error("Authentication token not found");
        }

        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const companyId = userData?.company_id || userData?.id;

        let url = `${baseURL}/api/interviews/slots/`;
        if (companyId) {
          url += `${url.includes("?") ? "&" : "?"}company_id=${companyId}`;
        }

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch slots: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        // Handle both array and object with results property
        const slotsData = data.results || data;

        // Update Redux state with the fetched slots
        const validSlots = Array.isArray(slotsData) ? slotsData : [];
        dispatch(setSlots(validSlots));
        
        // Show success notification only if this is a manual refresh
        if (force) {
          notify.success("Interview slots refreshed successfully!");
        }
        
        // Reset error flag on successful load
        setHasShownError(false);
        
        return validSlots;
      } catch (error) {
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

          // Create single slot with calculated times

          const slotData = {
            date: formattedDate,
            start_time: overallStartTime,
            end_time: overallEndTime,
            ai_interview_type: slotForm.ai_interview_type || "technical",
            ai_configuration: {
              difficulty_level: slotForm.difficulty_level || "intermediate",
              question_count: parseInt(slotForm.question_count) || 10,
              time_limit: parseInt(slotForm.time_limit) || 60,
              topics: slotForm.topics ? slotForm.topics.split(",").map((t) => t.trim()) : ["algorithms", "data_structures"],
            },
            max_candidates: parseInt(slotForm.max_candidates) || 1,
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
          start_time: slotForm.start_time,
          end_time: slotForm.end_time,
          ai_interview_type: slotForm.ai_interview_type || "technical",
          ai_configuration: {
            difficulty_level: slotForm.difficulty_level || "intermediate",
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
        
        // Process edited data
        
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
            return time12; // Return original if conversion fails
          }
        }
        
        // Convert 12-hour format times to 24-hour format if needed
        if (processedData.start_time && processedData.start_time.includes('M')) {
          // This is 12-hour format, convert it
          processedData.start_time = convertTo24Hour(processedData.start_time);
        }
        
        if (processedData.end_time && processedData.end_time.includes('M')) {
          // This is 12-hour format, convert it
          processedData.end_time = convertTo24Hour(processedData.end_time);
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
        
        // Send slot data to API

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
          
          throw new Error(
            errorData.detail || errorData.message || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`
          );
        }

        // Force refresh the data and UI
        await fetchSlots();
        setRefreshKey(prev => prev + 1); // Refresh TimeSlotPicker and DataTable
        
        // Add a small delay to ensure state updates are processed
        setTimeout(() => {
          // Data refresh completed
        }, 100);
      } catch (error) {
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
                // Available slots updated
              }}
              onAllSlotsChange={(slots) => {
                // All slots updated
              }}
            />
          )}
        </div>

        <div className="ai-int-form-group">
          <label>Talaro Interview Type</label>
          <CustomDropdown
            value={slotForm.ai_interview_type}
            options={[
              { value: 'technical', label: 'Technical' },
              { value: 'behavioral', label: 'Behavioral' },
              { value: 'coding', label: 'Coding' },
              { value: 'system_design', label: 'System Design' },
              { value: 'case_study', label: 'Case Study' }
            ]}
            onChange={(value) =>
              setSlotForm((prev) => ({
                ...prev,
                ai_interview_type: value,
              }))
            }
            placeholder="Select Interview Type"
          />
        </div>

        <div className="ai-int-form-group">
          <label>Difficulty Level</label>
          <CustomDropdown
            value={slotForm.difficulty_level}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'expert', label: 'Expert' }
            ]}
            onChange={(value) =>
              setSlotForm((prev) => ({
                ...prev,
                difficulty_level: value,
              }))
            }
            placeholder="Select Difficulty"
          />
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
                  
                  // Convert 24-hour time to 12-hour format for display (using shared utility)
                  return formatTimeTo12Hour(value);
                },
                formatForEdit: (value) => {
                  // Handle null or invalid time values
                  if (!value || typeof value !== 'string') {
                    return '';
                  }
                  
                  // Convert 24-hour time (17:45:00) to 12-hour format for editing (5:45 PM)
                  return formatTimeTo12Hour(value);
                },
                parseFromEdit: (editValue, originalRowData) => {
                  // Convert 12-hour format (5:45 PM) back to 24-hour format (17:45:00) for API
                  if (!editValue) return '';
                  
                  // Use shared utility to convert 12-hour to 24-hour format
                  const time24 = formatTimeTo24Hour(editValue);
                  return time24 ? `${time24}:00` : editValue;
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
                  
                  // Convert 24-hour time to 12-hour format for display (using shared utility)
                  return formatTimeTo12Hour(value);
                },
                formatForEdit: (value) => {
                  // Handle null or invalid time values
                  if (!value || typeof value !== 'string') {
                    return '';
                  }
                  
                  // Convert 24-hour time (18:45:00) to 12-hour format for editing (6:45 PM)
                  return formatTimeTo12Hour(value);
                },
                parseFromEdit: (editValue, originalRowData) => {
                  // Convert 12-hour format (6:45 PM) back to 24-hour format (18:45:00) for API
                  if (!editValue) return '';
                  
                  // Use shared utility to convert 12-hour to 24-hour format
                  const time24 = formatTimeTo24Hour(editValue);
                  return time24 ? `${time24}:00` : editValue;
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
            data={sortedSlots}
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
            onContextMenuClick={handleContextMenuClick}
            onEdit={async (editedData) => {
              // Handle save from DataTable inline editing
              await handleUpdateSlotAPI(editedData);
            }}
            editingRow={editingRow}
            editingData={editingData}
            setEditingRow={setEditingRow}
            setEditingData={setEditingData}
            showRefresh={true}
            onRefresh={async () => {
              try {
                await fetchSlots(true);
                setRefreshKey(prev => prev + 1);
              } catch (error) {
                notify.error("Failed to refresh interview slots. Please try again.");
              }
            }}
            showActions={true}
            defaultPageSize={10}
            pageSizeOptions={[10, 20, 50, 100]}
          />
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

  // Show error notification and continue with normal render
  if (slotsError && retryCount === 0 && !hasShownError) {
    notify.error(slotsError, "Failed to Load Slots");
    setHasShownError(true);
  }

  return (
    <div className="ai-interview-scheduler">
            {/* Mobile Toggle Button */}
            <div className="mobile-form-toggle">
              <button
                className={`mobile-create-slot-btn ${showMobileForm ? 'form-open' : ''}`}
                onClick={() => setShowMobileForm(!showMobileForm)}
              >
                <span className="btn-icon">{showMobileForm ? '×' : '+'}</span>
                <span className="btn-text">{showMobileForm ? 'Close' : 'Create New Slot'}</span>
              </button>
            </div>

      {/* Left Side - Form */}
      <div className={`ai-int-form-container slide-in-left ${showMobileForm ? 'mobile-form-visible' : 'mobile-form-hidden'}`}>
          <div className="ai-int-form">
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
              <CustomDropdown
                value={slotForm.ai_interview_type}
                options={[
                  { value: '', label: 'Select interview type' },
                  { value: 'technical', label: 'Technical' },
                  { value: 'behavioral', label: 'Behavioral' },
                  { value: 'system-design', label: 'System Design' }
                ]}
                onChange={(value) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    ai_interview_type: value,
                  }))
                }
                placeholder="Select interview type"
              />
            </div>

            <div className="ai-int-form-group">
              <label>Difficulty Level</label>
              <CustomDropdown
                value={slotForm.difficulty_level}
                options={[
                  { value: '', label: 'Select difficulty level' },
                  { value: 'easy', label: 'Easy' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'hard', label: 'Hard' }
                ]}
                onChange={(value) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    difficulty_level: value,
                  }))
                }
                placeholder="Select difficulty level"
              />
            </div>

            <div className="ai-int-form-group">
              <label>Question Count</label>
              <input
                type="number"
                min="1"
                max="20"
                value={slotForm.question_count}
                placeholder="Enter number of questions (1-20)"
                onChange={(e) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    question_count: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="ai-int-form-group">
              <label>Topics (comma separated)</label>
              <input
                type="text"
                value={slotForm.topics}
                onChange={(e) =>
                  setSlotForm((prev) => ({ ...prev, topics: e.target.value }))
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
                placeholder="Enter maximum number of candidates"
                onChange={(e) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    max_candidates: parseInt(e.target.value) || 0,
                  }))
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
          </div>
      </div>

      {/* Interview Slots Table */}
      <div className="ai-int-table-container slide-in-right">
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
                if (!value || typeof value !== 'string') {
                  return 'N/A';
                }
                return formatTimeTo12Hour(value);
              },
              formatForEdit: (value) => {
                if (!value || typeof value !== 'string') {
                  return '';
                }
                return formatTimeTo12Hour(value);
              },
              parseFromEdit: (editValue, originalRowData) => {
                if (!editValue) return '';
                const time24 = formatTimeTo24Hour(editValue);
                return time24;
              }
            },
            {
              field: "end_time", 
              header: "End Time",
              width: "9%",
              type: "time12",
              editable: true,
              render: (value) => {
                if (!value || typeof value !== 'string') {
                  return 'N/A';
                }
                return formatTimeTo12Hour(value);
              },
              formatForEdit: (value) => {
                if (!value || typeof value !== 'string') {
                  return '';
                }
                return formatTimeTo12Hour(value);
              },
              parseFromEdit: (editValue, originalRowData) => {
                if (!editValue) return '';
                const time24 = formatTimeTo24Hour(editValue);
                return time24;
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
            {
              field: "question_count",
              header: "Questions",
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
          data={sortedSlots}
          loading={slotsLoading}
          actions={["edit", "delete"]}
          onAction={(action, rowData, rowIndex) => {
            if (action === "edit") {
              return;
            } else if (action === "delete") {
              handleDeleteSlot(rowData.id);
            }
          }}
          onContextMenuClick={handleContextMenuClick}
          onEdit={async (editedData) => {
            await handleUpdateSlotAPI(editedData);
          }}
          editingRow={editingRow}
          editingData={editingData}
          setEditingRow={setEditingRow}
          setEditingData={setEditingData}
          showRefresh={true}
          onRefresh={async () => {
            try {
              await fetchSlots(true);
              setRefreshKey(prev => prev + 1);
            } catch (error) {
              notify.error("Failed to refresh interview slots. Please try again.");
            }
          }}
          showActions={true}
          defaultPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
        />

        {/* Context Menu */}
        <ContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          actions={["edit", "delete"]}
          onAction={handleContextMenuAction}
          onClose={handleContextMenuClose}
          rowData={contextMenu.rowData}
          rowIndex={contextMenu.rowIndex}
        />
      </div>

    </div>
  );
};

export default AiInterviewScheduler;
