// src/redux/slices/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [], // Array of notifications
  currentNotification: null, // Currently displayed notification
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNotification: (state, action) => {
      const { type, title, message, duration = 5000, id = Date.now() } = action.payload;
      
      const notification = {
        id,
        type, // 'success', 'error', 'warning', 'info'
        title,
        message,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Add to notifications array
      state.notifications.push(notification);
      
      // Set as current notification if none is currently shown
      if (!state.currentNotification) {
        state.currentNotification = notification;
      }
    },

    hideNotification: (state, action) => {
      const notificationId = action.payload;
      
      // Remove from notifications array
      state.notifications = state.notifications.filter(
        notification => notification.id !== notificationId
      );
      
      // Clear current notification if it matches
      if (state.currentNotification?.id === notificationId) {
        state.currentNotification = null;
        
        // Show next notification if any exist
        if (state.notifications.length > 0) {
          state.currentNotification = state.notifications[0];
        }
      }
    },

    clearCurrentNotification: (state) => {
      const currentId = state.currentNotification?.id;
      
      if (currentId) {
        // Remove from notifications array
        state.notifications = state.notifications.filter(
          notification => notification.id !== currentId
        );
      }
      
      // Set next notification as current
      state.currentNotification = state.notifications.length > 0 ? state.notifications[0] : null;
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
      state.currentNotification = null;
    },
  },
});

export const {
  showNotification,
  hideNotification,
  clearCurrentNotification,
  clearAllNotifications,
} = notificationSlice.actions;

// Helper action creators for common notification types
export const showSuccess = (title, message, duration) => 
  showNotification({ type: 'success', title, message, duration });

export const showError = (title, message, duration) => 
  showNotification({ type: 'error', title, message, duration });

export const showWarning = (title, message, duration) => 
  showNotification({ type: 'warning', title, message, duration });

export const showInfo = (title, message, duration) => 
  showNotification({ type: 'info', title, message, duration });

export default notificationSlice.reducer;
