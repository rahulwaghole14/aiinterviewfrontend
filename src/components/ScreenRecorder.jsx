import React, { useState, useRef, useCallback } from 'react';

const ScreenRecorder = ({ 
  onRecordingStart, 
  onRecordingStop, 
  onError, 
  maxDuration = 7200 // 2 hours max
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Request screen recording permission
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
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
      
      // Get audio track for microphone
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
        stream.addTrack(audioTrack);
      }

      streamRef.current = stream;
      setPermissionGranted(true);
      
      // Listen for stream end (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (isRecording) {
          stopRecording();
        }
      });

      return true;
    } catch (error) {
      console.error('Error requesting screen recording permission:', error);
      onError?.(error.message || 'Failed to get screen recording permission');
      return false;
    }
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
      };

      // Fallback to supported codec
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const actualDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onRecordingStop?.(blob, actualDuration);
        cleanup();
      };

      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        
        // Auto-stop if max duration reached
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      onRecordingStart?.();
    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.(error.message || 'Failed to start recording');
    }
  }, [onRecordingStart, onRecordingStop, onError, maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
  }, [isRecording]);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - (duration * 1000);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    setIsPaused(!isPaused);
  }, [isPaused, duration]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setDuration(0);
    setPermissionGranted(false);
  }, []);

  // Format duration display
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
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
  };
};

export default ScreenRecorder;
