import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { BeatLoader } from 'react-spinners';
import './InterviewIdVerification.css';

const InterviewIdVerification = ({ sessionData, onComplete, onError }) => {
  const [step, setStep] = useState('camera-setup'); // camera-setup, id-verification, screen-permission, ready
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screenPermissionGranted, setScreenPermissionGranted] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Setup camera on component mount
  useEffect(() => {
    setupCamera();
    
    // Cleanup on unmount
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const setupCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false // No audio needed for ID verification
      });

      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          setStep('id-verification');
        };
      }
    } catch (err) {
      console.error('Camera setup error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access is required for ID verification. Please allow camera access and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and refresh the page.');
      } else {
        setError('Failed to access camera. Please check your device and refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
  };

  const requestScreenRecordingPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Request screen recording permission
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      // Get microphone audio for screen recording
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Combine screen video with microphone audio
      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack) {
        screenStream.addTrack(audioTrack);
      }

      // Stop the streams immediately (we just needed permission)
      screenStream.getTracks().forEach(track => track.stop());
      audioStream.getTracks().forEach(track => track.stop());
      
      setScreenPermissionGranted(true);
      toast.success('Screen recording permission granted!');
      
      // Auto-proceed after getting permission
      setTimeout(() => {
        handleScreenPermissionComplete();
      }, 1000);
      
    } catch (err) {
      console.error('Screen recording permission error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Screen recording permission is required for this interview. Please allow screen recording and try again.');
      } else {
        setError('Failed to get screen recording permission. Please check your browser settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIdVerification = async () => {
    try {
      setLoading(true);
      
      // Capture photo for verification
      const photoBlob = await capturePhoto();
      
      // For now, we'll simulate ID verification
      // In a real implementation, you would send the photo to your backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setStep('screen-permission');
      toast.success('ID verification completed successfully!');
      
    } catch (err) {
      console.error('ID verification error:', err);
      setError('ID verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenPermissionComplete = () => {
    setStep('ready');
    toast.success('All permissions granted! Ready to start the interview.');
    
    // Auto-proceed to interview after a short delay
    setTimeout(() => {
      onComplete({
        mediaStream: mediaStream,
        screenRecordingEnabled: true
      });
    }, 1500);
  };

  const retryCameraSetup = () => {
    setError(null);
    setStep('camera-setup');
    setupCamera();
  };

  // Render camera setup step
  if (step === 'camera-setup') {
    return (
      <div className="interview-id-verification">
        <div className="verification-container">
          <div className="verification-header">
            <h2>Camera Setup</h2>
            <p>Please allow camera access to continue with ID verification</p>
          </div>
          
          {loading ? (
            <div className="camera-loading">
              <BeatLoader color="var(--color-primary)" size={15} />
              <p>Setting up camera...</p>
            </div>
          ) : error ? (
            <div className="camera-error">
              <div className="error-icon">📷</div>
              <p>{error}</p>
              <button className="retry-button" onClick={retryCameraSetup}>
                Retry Camera Setup
              </button>
            </div>
          ) : (
            <div className="camera-preview">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
              />
              <p>Camera is ready!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render ID verification step
  if (step === 'id-verification') {
    return (
      <div className="interview-id-verification">
        <div className="verification-container">
          <div className="verification-header">
            <h2>ID Verification</h2>
            <p>Please position your face in the camera and click "Verify ID"</p>
          </div>
          
          <div className="verification-content">
            <div className="camera-preview">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
              />
              <div className="face-overlay">
                <div className="face-frame"></div>
              </div>
            </div>
            
            <div className="verification-instructions">
              <h3>Instructions:</h3>
              <ul>
                <li>Ensure your face is clearly visible</li>
                <li>Remove any hats or sunglasses</li>
                <li>Look directly at the camera</li>
                <li>Ensure good lighting</li>
              </ul>
            </div>
            
            <div className="verification-actions">
              <button 
                className="verify-button"
                onClick={handleIdVerification}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <BeatLoader color="#ffffff" size={8} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify ID'
                )}
              </button>
            </div>
          </div>
          
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    );
  }

  // Render screen permission step
  if (step === 'screen-permission') {
    return (
      <div className="interview-id-verification">
        <div className="verification-container">
          <div className="verification-header">
            <h2>Screen Recording Permission</h2>
            <p>Please allow screen recording with audio to continue with the interview</p>
          </div>
          
          {loading ? (
            <div className="camera-loading">
              <BeatLoader color="var(--color-primary)" size={15} />
              <p>Requesting screen recording permission...</p>
            </div>
          ) : error ? (
            <div className="camera-error">
              <div className="error-icon">🖥️</div>
              <p>{error}</p>
              <button className="retry-button" onClick={requestScreenRecordingPermission}>
                Retry Screen Recording Permission
              </button>
            </div>
          ) : (
            <div className="permission-content">
              <div className="permission-icon">🖥️</div>
              <h3>Screen Recording Required</h3>
              <p>This interview requires screen recording with audio to be enabled for assessment purposes.</p>
              <div className="permission-info">
                <ul>
                  <li>Your screen will be recorded during the technical and coding interview</li>
                  <li>Audio will be captured along with the screen recording</li>
                  <li>The recording is used for evaluation purposes only</li>
                  <li>You can stop sharing your screen at any time</li>
                </ul>
              </div>
              <button 
                className="permission-button" 
                onClick={requestScreenRecordingPermission}
              >
                Grant Screen Recording Permission
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render ready step
  if (step === 'ready') {
    return (
      <div className="interview-id-verification">
        <div className="verification-container">
          <div className="verification-header">
            <h2>Ready to Start!</h2>
            <p>All permissions granted successfully</p>
          </div>
          
          <div className="ready-content">
            <div className="success-icon">✅</div>
            <h3>You're all set!</h3>
            <p>Your interview will begin in a moment...</p>
            <div className="loading-indicator">
              <BeatLoader color="var(--color-primary)" size={10} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewIdVerification;
