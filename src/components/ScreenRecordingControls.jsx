import React, { useState, useEffect } from 'react';
import ScreenRecorder from './ScreenRecorder';
import './ScreenRecordingControls.css';

const ScreenRecordingControls = ({ 
  interviewId, 
  onRecordingComplete,
  autoStart = false,
  showControls = true 
}) => {
  const [recordingState, setRecordingState] = useState('idle'); // idle, recording, paused, completed
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    isRecording,
    isPaused,
    duration,
    permissionGranted,
    startRecording,
    stopRecording,
    togglePause,
    requestPermission,
    formatDuration,
    cleanup
  } = ScreenRecorder({
    onRecordingStart: () => {
      setRecordingState('recording');
      setError('');
    },
    onRecordingStop: async (blob, actualDuration) => {
      setRecordingState('completed');
      await uploadRecording(blob, actualDuration);
    },
    onError: (errorMessage) => {
      setError(errorMessage);
      setRecordingState('idle');
    }
  });

  // Upload recording to backend
  const uploadRecording = async (blob, duration) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('screen_recording', blob, `screen_recording_${interviewId}_${Date.now()}.webm`);
      formData.append('duration', duration.toString());

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/interviews/${interviewId}/screen-recording/upload/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      onRecordingComplete?.(result);
      setRecordingState('completed');
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload recording');
      setRecordingState('idle');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Auto-start recording if requested
  useEffect(() => {
    if (autoStart && permissionGranted && recordingState === 'idle') {
      startRecording();
    }
  }, [autoStart, permissionGranted, recordingState, startRecording]);

  // Request permission on component mount
  useEffect(() => {
    requestPermission();
    
    return () => {
      cleanup();
    };
  }, [requestPermission, cleanup]);

  const handleStartRecording = async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    startRecording();
  };

  const handleStopRecording = () => {
    if (window.confirm('Are you sure you want to stop the screen recording?')) {
      stopRecording();
    }
  };

  if (!showControls && recordingState === 'recording') {
    return null; // Hidden recording mode
  }

  return (
    <div className="screen-recording-controls">
      <div className="recording-status">
        <div className={`status-indicator ${recordingState}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {recordingState === 'idle' && 'Ready to record'}
            {recordingState === 'recording' && 'Recording'}
            {recordingState === 'paused' && 'Paused'}
            {recordingState === 'completed' && 'Completed'}
          </span>
        </div>
        
        {isRecording && (
          <div className="recording-timer">
            <span className="timer-icon">⏱️</span>
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {error && (
        <div className="recording-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">Uploading... {uploadProgress}%</span>
        </div>
      )}

      {showControls && (
        <div className="recording-controls">
          {recordingState === 'idle' && (
            <button
              className="btn btn-primary start-recording-btn"
              onClick={handleStartRecording}
              disabled={!permissionGranted}
            >
              <span className="btn-icon">🔴</span>
              Start Screen Recording
            </button>
          )}

          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div className="active-controls">
              <button
                className={`btn ${isPaused ? 'btn-success' : 'btn-warning'}`}
                onClick={togglePause}
              >
                <span className="btn-icon">{isPaused ? '▶️' : '⏸️'}</span>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <button
                className="btn btn-danger stop-recording-btn"
                onClick={handleStopRecording}
              >
                <span className="btn-icon">⏹️</span>
                Stop Recording
              </button>
            </div>
          )}

          {recordingState === 'completed' && (
            <div className="completed-message">
              <span className="success-icon">✅</span>
              Screen recording saved successfully!
            </div>
          )}
        </div>
      )}

      {recordingState === 'recording' && (
        <div className="recording-indicator">
          <span className="rec-dot"></span>
          REC
        </div>
      )}
    </div>
  );
};

export default ScreenRecordingControls;
