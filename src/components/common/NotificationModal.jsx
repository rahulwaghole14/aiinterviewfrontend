// src/components/common/NotificationModal.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCurrentNotification } from '../../redux/slices/notificationSlice';
import './NotificationModal.css';

const NotificationModal = () => {
  const dispatch = useDispatch();
  const currentNotification = useSelector(state => state.notification.currentNotification);

  useEffect(() => {
    if (currentNotification && currentNotification.duration > 0) {
      const timer = setTimeout(() => {
        dispatch(clearCurrentNotification());
      }, currentNotification.duration);

      return () => clearTimeout(timer);
    }
  }, [currentNotification, dispatch]);

  const handleClose = () => {
    dispatch(clearCurrentNotification());
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!currentNotification) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg className="notification-icon success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
          </svg>
        );
      case 'error':
        return (
          <svg className="notification-icon error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 14.5L14.5 15.5L12 13L9.5 15.5L8.5 14.5L11 12L8.5 9.5L9.5 8.5L12 11L14.5 8.5L15.5 9.5L13 12L15.5 14.5Z" fill="currentColor"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className="notification-icon warning-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L1 21H23L12 2ZM12 18C11.45 18 11 17.55 11 17C11 16.45 11.45 16 12 16C12.55 16 13 16.45 13 17C13 17.55 12.55 18 12 18ZM13 14H11V10H13V14Z" fill="currentColor"/>
          </svg>
        );
      case 'info':
        return (
          <svg className="notification-icon info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="notification-modal-overlay" onClick={handleBackdropClick}>
      <div className={`notification-modal notification-${currentNotification.type}`}>
        <div className="notification-content">
          <div className="notification-header">
            {getIcon(currentNotification.type)}
            <h3 className="notification-title">{currentNotification.title}</h3>
            <button 
              className="notification-close-btn" 
              onClick={handleClose}
              aria-label="Close notification"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="notification-body">
            <p className="notification-message">{currentNotification.message}</p>
          </div>

          <div className="notification-actions">
            <button 
              className="notification-ok-btn" 
              onClick={handleClose}
            >
              OK
            </button>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        {currentNotification.duration > 0 && (
          <div className="notification-progress-bar">
            <div 
              className="notification-progress-fill"
              style={{
                animationDuration: `${currentNotification.duration}ms`
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
