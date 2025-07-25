// src/components/Settings.jsx
import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ onTitleChange }) => {
  // State for various settings
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [dataExportFormat, setDataExportFormat] = useState('csv'); // 'csv', 'json', 'pdf'
  const [defaultJobStatus, setDefaultJobStatus] = useState('Open'); // 'Open', 'Closed', 'On Hold'
  const [autoArchiveJobs, setAutoArchiveJobs] = useState(false); // Toggle for auto-archiving
  const [showSaveMessage, setShowSaveMessage] = useState(false); // State for save success message

  useEffect(() => {
    // Apply the theme from state to the document body
    document.body.setAttribute('data-theme', theme);
    // Persist theme preference to localStorage
    localStorage.setItem('theme', theme);

    // Update the header title when this component mounts
    if (onTitleChange) {
      onTitleChange('Settings');
    }
  }, [theme, onTitleChange]); // Re-run when theme or onTitleChange prop changes

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    // The useEffect above will handle applying and persisting the new theme
  };

  const handleEmailNotificationsToggle = () => {
    setEmailNotifications((prev) => !prev);
  };

  const handleSmsNotificationsToggle = () => {
    setSmsNotifications((prev) => !prev);
  };

  const handleDataExportFormatChange = (e) => {
    setDataExportFormat(e.target.value);
  };

  const handleDefaultJobStatusChange = (e) => {
    setDefaultJobStatus(e.target.value);
  };

  const handleAutoArchiveJobsToggle = () => {
    setAutoArchiveJobs((prev) => !prev);
  };

  const handleSaveChanges = () => {
    // In a real application, you would send these settings to a backend API
    console.log('Saving settings:', {
      theme,
      emailNotifications,
      smsNotifications,
      dataExportFormat,
      defaultJobStatus,
      autoArchiveJobs,
    });

    // Show success message
    setShowSaveMessage(true);
    setTimeout(() => {
      setShowSaveMessage(false);
    }, 3000); // Hide message after 3 seconds
  };

  return (
    <div className="settings-container">
      <h2 className="settings-header">Application Settings</h2>

      <div className="settings-section card">
        <h3>General Settings</h3>
        <div className="setting-item">
          <label htmlFor="theme-select">Application Theme</label>
          <select id="theme-select" value={theme} onChange={handleThemeChange} className="settings-select">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <div className="settings-section card">
        <h3>Notification Preferences</h3>
        <div className="setting-item toggle-item">
          <label>Email Notifications</label>
          <label className="switch">
            <input type="checkbox" checked={emailNotifications} onChange={handleEmailNotificationsToggle} />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="setting-item toggle-item">
          <label>SMS Notifications</label>
          <label className="switch">
            <input type="checkbox" checked={smsNotifications} onChange={handleSmsNotificationsToggle} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-section card">
        <h3>Data Management</h3>
        <div className="setting-item">
          <label htmlFor="data-export-format">Default Data Export Format</label>
          <select id="data-export-format" value={dataExportFormat} onChange={handleDataExportFormatChange} className="settings-select">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <div className="setting-item action-item">
          <button className="settings-button">Export All Data</button>
        </div>
      </div>

      <div className="settings-section card">
        <h3>Job Management Defaults</h3>
        <div className="setting-item">
          <label htmlFor="default-job-status">Default New Job Status</label>
          <select id="default-job-status" value={defaultJobStatus} onChange={handleDefaultJobStatusChange} className="settings-select">
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        <div className="setting-item toggle-item">
          <label>Auto-archive Closed Jobs (after 30 days)</label>
          <label className="switch">
            <input type="checkbox" checked={autoArchiveJobs} onChange={handleAutoArchiveJobsToggle} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-changes-btn" onClick={handleSaveChanges}>
          Save Changes
        </button>
        {showSaveMessage && (
          <p className="save-success-message">Settings saved successfully!</p>
        )}
      </div>
    </div>
  );
};

export default Settings;
