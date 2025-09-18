import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { baseURL } from "../config/constants";
import "./TimeSlotPicker.css";

const TimeSlotPicker = ({
  selectedTimes = [],
  onSelectTimes = () => {},
  selectedDate,
  isBooking = false,
  setIsBooking = () => {},
  onAvailableSlotsChange = () => {},
  onAllSlotsChange = () => {},
  aiInterviewType = "technical",
  isModal = false,
}) => {
  const [localSelectedTimes, setLocalSelectedTimes] = useState(selectedTimes);
  const isCtrlPressed = useRef(false);
  const lastClickedTimeRef = useRef(null);

  const [availableSlotsInternal, setAvailableSlotsInternal] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [allSlotsInternal, setAllSlotsInternal] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = useSelector((state) => state.user?.user);

  // Generate time slots from 9 AM to 8 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : minute + 30;
        const endTime = `${String(endHour).padStart(2, "0")}:${String(
          endMinute
        ).padStart(2, "0")}`;
        const timeRange = `${startTime}-${endTime}`;
        slots.push(timeRange);
      }
    }
    return slots;
  };

  // Generate all possible time slots
  const allTimeSlots = generateTimeSlots();

  // Fetch all slots from API for specific date with role-based filtering
  const fetchAllSlots = useCallback(async () => {
    if (!selectedDate) return;

    try {
      setIsLoading(true);
      const authToken = localStorage.getItem("authToken");
      if (!authToken) return;

      const formattedDate = selectedDate.toISOString().split("T")[0];

      // Build query parameters based on user role
      const queryParams = new URLSearchParams({
        date: formattedDate,
      });

      // If user is company, add company_id filter
      if (user?.role === "company" || user?.user_type === "company") {
        const companyId = user?.company_id || user?.id;
        if (companyId) {
          queryParams.append("company_id", companyId);
        }
      }

      console.log("Fetching all slots for date:", formattedDate);

      // Build the URLs properly
      const availableURL = `${baseURL}/api/interviews/slots/?${queryParams}&status=available`;
      const bookedURL = `${baseURL}/api/interviews/slots/?${queryParams}&status=booked`;

      console.log("Available URL:", availableURL);
      console.log("Booked URL:", bookedURL);

      // Fetch available and booked slots separately with proper status filtering
      const [availableResponse, bookedResponse] = await Promise.all([
        fetch(availableURL, {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(bookedURL, {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      const available = [];
      const booked = [];

      console.log("Available response status:", availableResponse.status);
      console.log("Booked response status:", bookedResponse.status);

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        console.log("Available response data:", availableData);
        const availableSlots = availableData.results || availableData || [];

        console.log(
          "Available slots response:",
          availableSlots.length,
          "slots"
        );
        console.log("Looking for date:", formattedDate);

        // Use Map to store unique time ranges with their metadata
        const availableTimeRanges = new Map();

        availableSlots.forEach((slot) => {
          console.log(
            "Processing slot:",
            slot.id,
            "interview_date:",
            slot.interview_date,
            "start_time:",
            slot.start_time,
            "end_time:",
            slot.end_time,
            "status:",
            slot.status
          );
          if (slot.interview_date && slot.start_time && slot.end_time) {
            // Use interview_date directly since it's now a separate field
            const slotDate = slot.interview_date;
            console.log(
              "Slot date:",
              slotDate,
              "vs selected:",
              formattedDate,
              "match:",
              slotDate === formattedDate
            );

            if (slotDate === formattedDate) {
              // Since start_time and end_time are now TimeField (e.g., "09:00:00"), extract HH:MM
              const startTime = slot.start_time.substring(0, 5); // "09:00:00" -> "09:00"
              const endTime = slot.end_time.substring(0, 5); // "10:30:00" -> "10:30"

              if (startTime && endTime) {
                const timeRange = `${startTime}-${endTime}`;

                // If this time range already exists, combine the capacities
                if (availableTimeRanges.has(timeRange)) {
                  const existing = availableTimeRanges.get(timeRange);
                  existing.totalCapacity += slot.max_candidates || 1;
                  existing.currentBookings += slot.current_bookings || 0;
                  existing.slots.push(slot);
                } else {
                  availableTimeRanges.set(timeRange, {
                    timeRange,
                    totalCapacity: slot.max_candidates || 1,
                    currentBookings: slot.current_bookings || 0,
                    availableSpots: slot.available_spots || 1,
                    aiInterviewType: slot.ai_interview_type,
                    slots: [slot],
                  });
                }

                console.log("Adding/updating available time range:", timeRange);
              }
            }
          }
        });

        // Extract just the time ranges for the available array
        available.push(...Array.from(availableTimeRanges.keys()));

        // Store the detailed slot information for later use
        window.slotDetails = availableTimeRanges;
      } else {
        console.error(
          "Available response not ok:",
          availableResponse.status,
          await availableResponse.text()
        );
      }

      if (bookedResponse.ok) {
        const bookedData = await bookedResponse.json();
        console.log("Booked response data:", bookedData);
        const bookedSlots = bookedData.results || bookedData || [];

        console.log("Booked slots response:", bookedSlots.length, "slots");

        const bookedTimeRanges = new Set(); // Use Set to avoid duplicates

        bookedSlots.forEach((slot) => {
          console.log(
            "Processing booked slot:",
            slot.id,
            "interview_date:",
            slot.interview_date,
            "start_time:",
            slot.start_time,
            "end_time:",
            slot.end_time,
            "status:",
            slot.status
          );
          if (slot.interview_date && slot.start_time && slot.end_time) {
            // Use interview_date directly since it's now a separate field
            const slotDate = slot.interview_date;
            console.log(
              "Booked slot date:",
              slotDate,
              "vs selected:",
              formattedDate,
              "match:",
              slotDate === formattedDate
            );

            if (slotDate === formattedDate) {
              // Since start_time and end_time are now TimeField (e.g., "09:00:00"), extract HH:MM
              const startTime = slot.start_time.substring(0, 5); // "09:00:00" -> "09:00"
              const endTime = slot.end_time.substring(0, 5); // "10:30:00" -> "10:30"

              if (startTime && endTime) {
                const timeRange = `${startTime}-${endTime}`;
                console.log("Adding booked time range:", timeRange);
                bookedTimeRanges.add(timeRange);
              }
            }
          }
        });

        booked.push(...Array.from(bookedTimeRanges));
      } else {
        console.error(
          "Booked response not ok:",
          bookedResponse.status,
          await bookedResponse.text()
        );
      }

      console.log("Processed slots - Available:", available, "Booked:", booked);

      setAvailableSlotsInternal(available);
      setBookedSlots(booked);

      // Combine all slots for reference
      const allSlotsData = [...available, ...booked];
      setAllSlotsInternal(allSlotsData);

      // Notify parent components of changes
      onAvailableSlotsChange(available);
      onAllSlotsChange(allSlotsData);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, user, baseURL]);

  useEffect(() => {
    setLocalSelectedTimes(selectedTimes || []);
  }, [selectedTimes]);

  useEffect(() => {
    fetchAllSlots();
  }, [selectedDate, fetchAllSlots]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Control") {
        isCtrlPressed.current = true;
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Control") {
        isCtrlPressed.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Book an interview slot
  const bookSlot = async (slotId, bookingData) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${baseURL}/api/interviews/slots/${slotId}/book_slot/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to book slot: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error booking interview slot:", error);
      throw error;
    }
  };

  // Release an interview slot
  const releaseSlot = async (slotId) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${baseURL}/api/interviews/slots/${slotId}/release_slot/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to release slot: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error releasing interview slot:", error);
      throw error;
    }
  };

  // Create a new interview slot
  const createSlot = async (slotData) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${baseURL}/api/interviews/slots/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slotData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create slot: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating interview slot:", error);
      throw error;
    }
  };

  // Update an existing interview slot
  const updateSlot = async (slotId, slotData) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

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
        throw new Error(`Failed to update slot: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating interview slot:", error);
      throw error;
    }
  };

  // Delete an interview slot
  const deleteSlot = async (slotId) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${baseURL}/api/interviews/slots/${slotId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete slot: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting interview slot:", error);
      throw error;
    }
  };

  const formatTimeForDisplayInBox = (timeRange) => {
    if (!timeRange) return "";

    // Handle time range format (e.g., "09:00-09:30")
    if (timeRange.includes("-")) {
      const [startTime, endTime] = timeRange.split("-");
      const formatSingleTime = (time) => {
        const [hourStr, minuteStr] = time.split(":");
        let hour = parseInt(hourStr, 10);
        const minutes = parseInt(minuteStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        hour = hour ? hour : 12;
        const minuteStr2 = minutes < 10 ? "0" + minutes : minutes;
        return `${hour}:${minuteStr2} ${ampm}`;
      };

      return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)}`;
    }

    // Fallback for single time format
    const [hourStr, minuteStr] = timeRange.split(":");
    let hour = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    const minuteStr2 = minutes < 10 ? "0" + minutes : minutes;
    return `${hour}:${minuteStr2} ${ampm}`;
  };

  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    return endTotalMin - startTotalMin;
  };

  const handleSlotClick = async (time, event) => {
    let newSelectedTimes = [...localSelectedTimes];
    const isCtrlHeld = event?.ctrlKey || event?.metaKey;
    const isAvailable = availableSlotsInternal.includes(time);
    const isBooked = bookedSlots.includes(time);
    const isNewSlot = !isAvailable && !isBooked;

    // In modal mode, only allow selection of available slots
    if (isModal && !isAvailable) {
      return;
    }

    // In non-modal mode, only allow selection of new slots
    if (!isModal && !isNewSlot) {
      return;
    }

    if (isCtrlHeld) {
      // Multi-select mode: toggle individual slots
      if (newSelectedTimes.includes(time)) {
        newSelectedTimes = newSelectedTimes.filter((t) => t !== time);
      } else {
        newSelectedTimes.push(time);
      }
    } else {
      // Single-select mode: replace selection
      if (newSelectedTimes.includes(time)) {
        newSelectedTimes = [];
      } else {
        newSelectedTimes = [time];
      }
    }

    lastClickedTimeRef.current = time;
    newSelectedTimes.sort();
    setLocalSelectedTimes(newSelectedTimes);

    // Calculate duration based on selected times
    let duration = 0;
    if (newSelectedTimes.length > 0) {
      const startTime = newSelectedTimes[0];
      const endTime = newSelectedTimes[newSelectedTimes.length - 1];
      duration = calculateDuration(startTime, endTime) + 30; // Add 30 min for the last slot
    }

    onSelectTimes(newSelectedTimes, duration);
  };

  if (isLoading) {
    return <div className="slots-loading">Loading available time slots...</div>;
  }

  if (error) {
    return (
      <div className="slots-error">
        Error loading slots: {error}. Showing default slots.
      </div>
    );
  }

  // Combine all actual slots from API data
  const allActualSlots = [
    ...new Set([...availableSlotsInternal, ...bookedSlots]),
  ];

  // Always show generated time slots alongside API data to allow creating new slots
  const allGeneratedSlots = generateTimeSlots();
  const combinedSlots = [...new Set([...allActualSlots, ...allGeneratedSlots])];

  // Sort slots by time for better display
  const slotsToDisplay = combinedSlots.sort((a, b) => {
    const timeA = a.split("-")[0];
    const timeB = b.split("-")[0];
    return timeA.localeCompare(timeB);
  });

  const slotElements = slotsToDisplay.map((time) => {
    const isSelected = localSelectedTimes.includes(time);
    const isAvailable = availableSlotsInternal.includes(time);
    const isBooked = bookedSlots.includes(time);
    const isNewSlot = !isAvailable && !isBooked;

    const displayTime = formatTimeForDisplayInBox(time);

    // Get slot details if available
    const slotDetail = window.slotDetails?.get(time);
    const capacityInfo = slotDetail
      ? `${slotDetail.currentBookings}/${slotDetail.totalCapacity}`
      : "";
    const interviewType = slotDetail?.aiInterviewType || "";

    let slotClass = "time-slot";
    let tooltipText = "";
    let statusLabel = "";
    let isClickable = false;

    if (isBooked) {
      slotClass += " booked";
      tooltipText = "This slot is already booked";
      statusLabel = "BOOKED";
      isClickable = false;
    } else if (isAvailable) {
      slotClass += " available";
      tooltipText = `Available slot${
        capacityInfo ? ` (${capacityInfo} capacity)` : ""
      }${interviewType ? ` - ${interviewType}` : ""}`;
      statusLabel = "AVAILABLE";
      isClickable = true;
    } else {
      slotClass += " new-slot";
      tooltipText = isModal
        ? "Not available for selection"
        : "New slot (can be created)";
      statusLabel = isModal ? "UNAVAILABLE" : "NEW";
      isClickable = !isModal; // Only clickable in non-modal mode
    }

    if (isSelected) {
      slotClass += " selected";
    }

    // Add disabled class for non-clickable slots
    if (!isClickable) {
      slotClass += " disabled";
    }

    return (
      <div key={time} className="slot-container">
        <div className="slot-time-label">{displayTime}</div>
        <div
          className={slotClass}
          onClick={isClickable ? (e) => handleSlotClick(time, e) : undefined}
          title={tooltipText}
          style={{ cursor: isClickable ? "pointer" : "not-allowed" }}
        >
          <div className="slot-status-main">{statusLabel}</div>
          <div className="slot-capacity-main">
            {!isNewSlot ? capacityInfo : ""}
          </div>
          {interviewType && (
            <div className="slot-type-main">{interviewType}</div>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="time-slot-picker-wrapper">
      <div className="time-slot-picker-scroll-container">
        <div className="time-slot-picker-scroll-area">{slotElements}</div>
      </div>
    </div>
  );
};

TimeSlotPicker.propTypes = {
  selectedTimes: PropTypes.arrayOf(PropTypes.string),
  onSelectTimes: PropTypes.func,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  baseURL: PropTypes.string,
  isBooking: PropTypes.bool,
  setIsBooking: PropTypes.func,
  onAvailableSlotsChange: PropTypes.func,
  onAllSlotsChange: PropTypes.func,
  aiInterviewType: PropTypes.string,
  isModal: PropTypes.bool,
};

export default TimeSlotPicker;
