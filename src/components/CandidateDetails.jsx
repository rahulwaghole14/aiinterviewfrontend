// CandidateDetails.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCandidates } from '../redux/slices/candidatesSlice';
import {
  fetchJobs,
  selectAllJobs,
  selectJobsStatus,
} from '../redux/slices/jobsSlice';
import { baseURL } from '../data';
import './CandidateDetails.css';
import './common/DataTable.css';
import BeatLoader from 'react-spinners/BeatLoader';
import StatusUpdateModal from './StatusUpdateModal';
import { useNotification } from '../hooks/useNotification';
import { formatTimeTo12Hour } from '../utils/timeFormatting';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Video Player Component with Error Handling
const VideoPlayerWithErrorHandling = ({ videoUrl, baseURL }) => {
  const [error, setError] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoUrl) {
      setError('No video URL provided');
      setIsLoading(false);
      return;
    }

    // Construct full video URL
    let fullUrl = videoUrl;
    
    // If it's already a full URL (http/https), use it as is
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      fullUrl = videoUrl;
    } 
    // If it starts with /media/, just prepend baseURL
    else if (videoUrl.startsWith('/media/')) {
      fullUrl = `${baseURL}${videoUrl}`;
    }
    // If it starts with /, prepend baseURL
    else if (videoUrl.startsWith('/')) {
      fullUrl = `${baseURL}${videoUrl}`;
    }
    // If it's a relative path like "interview_videos/..." or "interview_videos_merged/...", add /media/ prefix
    else if (videoUrl.includes('interview_videos/') || videoUrl.includes('interview_videos_merged/') || videoUrl.includes('interview_videos_raw/') || videoUrl.includes('interview_audio/')) {
      // Ensure /media/ prefix
      const cleanPath = videoUrl.startsWith('media/') ? videoUrl : `media/${videoUrl}`;
      fullUrl = `${baseURL}/${cleanPath}`;
    }
    // Default: prepend baseURL
    else {
      fullUrl = `${baseURL}/${videoUrl}`;
    }
    
    console.log('Video URL construction:', {
      original: videoUrl,
      constructed: fullUrl,
      baseURL: baseURL
    });
    
    setVideoSrc(fullUrl);
    setIsLoading(false);
  }, [videoUrl, baseURL]);

  const handleError = (e) => {
    const videoElement = e.target;
    const error = videoElement?.error;
    const actualSrc = videoElement?.src || videoElement?.currentSrc || videoSrc;
    
    console.error('Video playback error:', e);
    console.error('Video source (state):', videoSrc);
    console.error('Video source (element):', videoElement?.src);
    console.error('Video currentSrc:', videoElement?.currentSrc);
    console.error('Video error details:', {
      code: error?.code,
      message: error?.message,
      networkState: videoElement?.networkState,
      readyState: videoElement?.readyState,
      src: videoElement?.src,
      currentSrc: videoElement?.currentSrc
    });
    
    // Try to fetch the video URL to check if it's accessible
    const urlToCheck = actualSrc || videoSrc;
    if (urlToCheck) {
      fetch(urlToCheck, { method: 'HEAD' })
        .then(response => {
          console.log('Video URL accessibility check:', {
            url: urlToCheck,
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          });
          if (!response.ok) {
            setError(`Video file not accessible (HTTP ${response.status}). URL: ${urlToCheck}`);
          }
        })
        .catch(fetchError => {
          console.error('Error checking video URL:', fetchError);
          setError(`Cannot access video file. Please check: 1) Server is running, 2) File exists, 3) URL is correct: ${urlToCheck}`);
        });
    } else {
      setError('Video URL is not set. Please check the interview video path.');
    }
    
    // Provide more specific error messages
    let errorMessage = 'Video cannot be played. The file may be corrupted or in an unsupported format.';
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Video playback was aborted.';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = `Network error while loading video. URL: ${videoSrc}`;
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Video format is not supported or the file is corrupted. Try downloading and playing with VLC.';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format is not supported by your browser.';
          break;
        default:
          errorMessage = `Video error (code: ${error.code}). The file may be corrupted or in an unsupported format.`;
      }
    }
    
    setError(errorMessage);
  };

  const handleLoadedMetadata = (e) => {
    console.log('Video metadata loaded:', {
      duration: e.target.duration,
      videoWidth: e.target.videoWidth,
      videoHeight: e.target.videoHeight,
      readyState: e.target.readyState
    });
    setError(null);
  };

  const handleCanPlay = (e) => {
    console.log('Video can play');
    setIsLoading(false);
    setError(null);
  };

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
        <p style={{ color: '#856404', marginBottom: '10px' }}>ΓÜá∩╕Å {error}</p>
        {videoSrc && (
          <>
            <p style={{ marginTop: '10px', fontSize: '11px', color: '#666', wordBreak: 'break-all' }}>
              Video URL: {videoSrc}
            </p>
            <a 
              href={videoSrc} 
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-block', 
                padding: '8px 16px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px',
                marginTop: '10px'
              }}
            >
              Download Video File
            </a>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              If the video doesn't play, try downloading it and playing with VLC or another media player.
            </p>
            <p style={{ marginTop: '10px', fontSize: '11px', color: '#856404' }}>
              ≡ƒÆí Tip: Check browser console (F12) for detailed error information.
            </p>
          </>
        )}
      </div>
    );
  }

  // Don't render video until we have a valid source
  if (!videoSrc) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <p style={{ color: '#666' }}>Loading video URL...</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px'
        }}>
          Loading video...
        </div>
      )}
      <video
        key={videoSrc} // Force re-render when videoSrc changes
        controls
        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        preload="auto"
        crossOrigin="anonymous"
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => {
          console.log('Video data loaded successfully');
          setIsLoading(false);
          setError(null);
        }}
        playsInline
        muted={false}
      >
        <source src={videoSrc} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
        <source src={videoSrc} type="video/mp4" />
        <source src={videoSrc} type="video/webm" />
        <source src={videoSrc} type="video/quicktime" />
        Your browser does not support the video tag.
      </video>
      {videoSrc && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <a 
            href={videoSrc}
            download
            style={{ 
              display: 'inline-block', 
              padding: '6px 12px', 
              color: '#007bff', 
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ≡ƒôÑ Download Video
          </a>
        </div>
      )}
    </div>
  );
};

// Helper function to safely parse JSON fields or bullet-pointed text
const parseJsonField = (field) => {
  if (!field) return [];
  if (typeof field === 'string') {
    try {
      // First try to parse as JSON
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // If not JSON, try to parse as bullet-pointed text
      const lines = field.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length > 0) {
        // Check if it's bullet-pointed (starts with -, ΓÇó, *, etc.)
        const items = lines.map(line => {
          // Remove bullet markers
          return line.replace(/^[-ΓÇó*]\s*/, '').trim();
        }).filter(item => item);
        return items.length > 0 ? items : [];
      }
      return [];
    }
  }
  return Array.isArray(field) ? field : [];
};

const sortQAPairs = (list = []) => {
  return [...list].sort((a, b) => {
    const seqA = Number.isFinite(a?.conversation_sequence) ? a.conversation_sequence : Number.MAX_SAFE_INTEGER;
    const seqB = Number.isFinite(b?.conversation_sequence) ? b.conversation_sequence : Number.MAX_SAFE_INTEGER;
    if (seqA !== seqB) return seqA - seqB;
    const orderA = Number.isFinite(a?.order) ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(b?.order) ? b.order : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    const idA = a?.id || '';
    const idB = b?.id || '';
    return idA.localeCompare(idB);
  });
};

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notify = useNotification();

  const allCandidates = useSelector((state) => state.candidates.allCandidates);
  const candidatesStatus = useSelector(
    (state) => state.candidates.candidatesStatus
  );
  const allJobs = useSelector(selectAllJobs);
  const jobsStatus = useSelector(selectJobsStatus);

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");

  // Get auth token from localStorage when component mounts
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
    } else {
      // Authentication token not found
      // navigate('/login');
    }
  }, []);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showEditInterviewModal, setShowEditInterviewModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [showEditEvaluationModal, setShowEditEvaluationModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'interview' or 'evaluation'
  const [itemToDelete, setItemToDelete] = useState(null);

  // Proctoring PDF URL states - using interview ID/session_key as keys
  const [proctoringPdfUrls, setProctoringPdfUrls] = useState({});
  const [proctoringPdfLoading, setProctoringPdfLoading] = useState({});

  // Function to fetch proctoring PDF URL for a specific interview
  const fetchProctoringPdfUrl = async (interviewId, sessionKey) => {
    const key = sessionKey || interviewId;
    if (!key) return;

    try {
      setProctoringPdfLoading(prev => ({ ...prev, [key]: true }));
      let apiUrl = `${baseURL}/api/evaluation/proctoring-pdf-url/`;
      const params = new URLSearchParams();

      if (sessionKey) {
        params.append('session_key', sessionKey);
      } else if (interviewId) {
        params.append('interview_id', interviewId);
      }

      if (params.toString()) {
        apiUrl += '?' + params.toString();
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.gcs_url) {
        setProctoringPdfUrls(prev => ({ ...prev, [key]: data.gcs_url }));
      } else {
        setProctoringPdfUrls(prev => ({ ...prev, [key]: 'No proctoring PDF URL available' }));
      }
    } catch (error) {
      console.error('Error fetching proctoring PDF URL:', error);
      setProctoringPdfUrls(prev => ({ ...prev, [key]: 'Error loading PDF URL' }));
    } finally {
      setProctoringPdfLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Fetch PDF URLs when interviews are loaded
  useEffect(() => {
    if (interviews.length > 0 && authToken) {
      interviews.forEach(interview => {
        if (interview.id || interview.session_key) {
          const key = interview.session_key || interview.id;
          // Only fetch if we haven't already fetched for this interview
          if (!(key in proctoringPdfUrls)) {
            fetchProctoringPdfUrl(interview.id, interview.session_key);
          }
        }
      });
    }
  }, [interviews, authToken]);

  // Helper function to get domain name by ID
  const getDomainName = (domainId) => {
    if (typeof domainId === "string" && !/^[0-9]+$/.test(domainId)) {
      return domainId;
    }
    return domainId || "N/A";
  };

  // Helper function to get job title by ID
  const getJobTitle = (jobId) => {
    if (typeof jobId === "string" && !/^[0-9]+$/.test(jobId)) {
      return jobId;
    }
    const job = allJobs.find((j) => String(j.id) === String(jobId));
    return job ? job.job_title : jobId || "N/A";
  };

  // Fetch interviews and evaluations
  const fetchInterviews = async () => {
    if (!candidate?.id || !authToken) return;

    setInterviewsLoading(true);
    try {
      // Fetch interviews for the current candidate
      console.log('Fetching interviews for candidate ID:', candidate.id, 'URL:', `${baseURL}/api/interviews/?candidate_id=${candidate.id}`);
      const interviewsResponse = await fetch(`${baseURL}/api/interviews/?candidate_id=${candidate.id}`, {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!interviewsResponse.ok) {
        if (interviewsResponse.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${interviewsResponse.status}`);
      }

      // Fetch evaluations
      const evaluationsResponse = await fetch(
        `${baseURL}/api/evaluation/crud/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        }
      );

      if (!evaluationsResponse.ok) {
        // Don't throw error here as evaluations might be optional
      }

      const interviewsData = await interviewsResponse.json();
      const evaluationsData = evaluationsResponse.ok
        ? await evaluationsResponse.json()
        : [];

      // Process fetched data
      console.log('=== RAW API RESPONSE DEBUG ===');
      console.log('Interviews API response:', interviewsData);
      console.log('Evaluations API response:', evaluationsData);
      console.log('Candidate ID:', candidate.id, 'Type:', typeof candidate.id);
      
      // Process interviews and evaluations
      const allInterviews = Array.isArray(interviewsData)
        ? interviewsData
        : interviewsData.results || [];
      
      // Debug: Log first few interviews to see candidate field structure
      if (allInterviews.length > 0) {
        console.log('Sample interview structure:', {
          first_interview: allInterviews[0],
          candidate_field: allInterviews[0].candidate,
          candidate_type: typeof allInterviews[0].candidate,
          candidate_object: allInterviews[0].candidate_object
        });
      }
      
      // Filter interviews - handle different candidate field formats
      const candidateInterviews = allInterviews.filter((interview) => {
        // Convert both to strings for comparison to handle type mismatches
        const candidateIdStr = String(candidate.id);
        const interviewCandidateStr = interview.candidate
          ? String(interview.candidate)
          : null;
        const candidateObjectIdStr = interview.candidate_object?.id
          ? String(interview.candidate_object.id)
          : null;

        const matches =
          interviewCandidateStr === candidateIdStr ||
          candidateObjectIdStr === candidateIdStr;

        if (!matches) {
          console.log(`Interview ${interview.id} doesn't match:`, {
            interview_candidate: interview.candidate,
            interview_candidate_type: typeof interview.candidate,
            candidate_object_id: interview.candidate_object?.id,
            candidate_id: candidate.id,
            candidate_id_type: typeof candidate.id
          });
        }

        return matches;
      });
      
      console.log('Filtered candidate interviews:', candidateInterviews);
      candidateInterviews.forEach(interview => {
        console.log(`Interview ${interview.id} from API:`, {
          status: interview.status,
          ai_result: interview.ai_result,
          has_ai_result: !!interview.ai_result
        });
      });

      // Process candidate interviews

      // For each interview, fetch the associated slot details directly from slots API (same as AI Interview Scheduler)
      const interviewsWithSlots = await Promise.all(candidateInterviews.map(async (interview) => {
        // Process interview slot
        
        if (interview.slot) {
          try {
            // Fetch slot details
            const slotResponse = await fetch(`${baseURL}/api/interviews/slots/${interview.slot}/`, {
              method: "GET",
              headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              credentials: "include",
            });

            if (slotResponse.ok) {
              const slotData = await slotResponse.json();
              // Process slot data
              
              // Create slot_details object with the same structure as AI Interview Scheduler
              const slotDetails = {
                id: slotData.id,
                start_time: slotData.start_time,
                end_time: slotData.end_time,
                duration_minutes: slotData.duration_minutes,
                ai_interview_type: slotData.ai_interview_type,
                status: slotData.status,
                current_bookings: slotData.current_bookings,
                max_candidates: slotData.max_candidates,
                interview_date: slotData.interview_date
              };
              
              console.log(`Created slot_details for interview ${interview.id}:`, slotDetails);
              console.log(`Slot details start_time: "${slotDetails.start_time}"`);
              console.log(`Slot details end_time: "${slotDetails.end_time}"`);
              
              return { 
                ...interview, 
                slot_details: slotDetails,
                slot: slotData // Keep original slot data too
              };
            } else {
              console.error(`Failed to fetch slot ${interview.slot}:`, slotResponse.status);
              return interview;
            }
          } catch (error) {
            console.error(`Error fetching slot ${interview.slot}:`, error);
            return interview;
          }
        }
        
        return interview;
      }));

      console.log("Interviews with slots:", interviewsWithSlots);

      // Add evaluations to interviews and extract ai_result if needed
      const processedInterviews = interviewsWithSlots.map((interview) => {
        // Find matching evaluation if exists
        const evaluation = Array.isArray(evaluationsData)
          ? evaluationsData.find(
              (evalItem) => String(evalItem.interview) === String(interview.id)
            )
          : null;

        // If interview doesn't have ai_result but evaluation has details.ai_analysis, extract it
        let aiResult = interview.ai_result;
        if (!aiResult && evaluation && evaluation.details && evaluation.details.ai_analysis) {
          const aiAnalysis = evaluation.details.ai_analysis;

          // Transform ai_analysis to ai_result format
          aiResult = {
            overall_score: (aiAnalysis.overall_score || 0) / 10.0,
            total_score: (aiAnalysis.overall_score || 0) / 10.0,
            technical_score: (aiAnalysis.technical_score || 0) / 10.0,
            behavioral_score: (aiAnalysis.behavioral_score || 0) / 10.0,
            coding_score: (aiAnalysis.coding_score || 0) / 10.0,
            communication_score: (aiAnalysis.communication_score || 0) / 10.0,
            strengths: aiAnalysis.strengths || '',
            weaknesses: aiAnalysis.weaknesses || '',
            technical_analysis: aiAnalysis.technical_analysis || '',
            behavioral_analysis: aiAnalysis.behavioral_analysis || '',
            coding_analysis: aiAnalysis.coding_analysis || '',
            detailed_feedback: aiAnalysis.detailed_feedback || '',
            hiring_recommendation: aiAnalysis.hiring_recommendation || '',
            recommendation: aiAnalysis.recommendation || 'MAYBE',
            hire_recommendation: ['STRONG_HIRE', 'HIRE'].includes(aiAnalysis.recommendation),
            confidence_level: (aiAnalysis.confidence_level || 0) / 10.0,
            proctoring_pdf_url: evaluation.details.proctoring_pdf_gcs_url || evaluation.details.proctoring_pdf_url || null,
            proctoring_pdf_gcs_url: evaluation.details.proctoring_pdf_gcs_url || null,
            proctoring_warnings: evaluation.details.proctoring?.warnings || [],
          };
          console.log(`Γ£à Extracted ai_result from evaluation for interview ${interview.id}`);
          console.log(`Γ£à Proctoring PDF URL in extracted ai_result: ${aiResult.proctoring_pdf_gcs_url || 'None'}`);
        }

        // Ensure proctoring_pdf_gcs_url is always included in ai_result
        let finalAiResult = aiResult || interview.ai_result;
        if (finalAiResult && !finalAiResult.proctoring_pdf_gcs_url) {
          // Try to get it from evaluation details if not already in ai_result
          if (evaluation && evaluation.details) {
            finalAiResult.proctoring_pdf_gcs_url = evaluation.details.proctoring_pdf_gcs_url || evaluation.details.proctoring_pdf_url || null;
          }
          console.log(`Γ£à Added proctoring_pdf_gcs_url to ai_result: ${finalAiResult.proctoring_pdf_gcs_url || 'None'}`);
        }

        return {
          ...interview,
          evaluation: evaluation || null,
          ai_result: finalAiResult,
        };
      });

      console.log("Processed interviews with evaluations and slots:", processedInterviews);
      
      // Debug: Log interview status and ai_result for debugging
      processedInterviews.forEach(interview => {
        console.log(`=== Interview ${interview.id} Debug ===`);
        console.log('Status:', interview.status);
        console.log('Has ai_result:', !!interview.ai_result);
        console.log('ai_result:', interview.ai_result);
        console.log('ai_result keys:', interview.ai_result ? Object.keys(interview.ai_result) : null);
        console.log('ai_result.total_score:', interview.ai_result?.total_score);
        console.log('Will show in UI?', interview.ai_result && (interview.status === 'completed' || interview.status === 'COMPLETED' || interview.status?.toLowerCase() === 'completed'));
        console.log('==========================');
      });
      
      setInterviews(processedInterviews);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setInterviewsLoading(false);
    }
  };

  // Function to update interview status
  const updateInterviewStatus = async (interviewId, status) => {
    if (!authToken) {
      console.error("Authentication token not found");
      return;
    }

    try {
      const response = await fetch(
        `${baseURL}/api/interviews/${interviewId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the interviews data
      fetchInterviews();
    } catch (error) {
      console.error("Error updating interview status:", error);
    }
  };

  // Determine current status based on interviews and candidate status
  const getCurrentStatus = () => {
    // First check if candidate has been hired or rejected
    if (candidate?.status === "HIRED") return "HIRED";
    if (candidate?.status === "REJECTED") return "REJECTED";
    
    if (!interviews.length) return "NEW";

    const latestInterview = interviews[interviews.length - 1];
    const status = latestInterview.status?.toLowerCase();

    // Check if there's any AI evaluation for any interview
    const hasAIEvaluation = interviews.some((i) => i.ai_result);
    
    // Also check for legacy evaluation system
    const hasLegacyEvaluation = interviews.some((i) => i.evaluation);

    // Handle new status structure
    if (hasLegacyEvaluation && hasAIEvaluation) return "AI_MANUAL_EVALUATED";
    if (hasLegacyEvaluation) return "MANUAL_EVALUATED";
    if (hasAIEvaluation) return "AI_EVALUATED";
    if (status === "completed") return "INTERVIEW_COMPLETED";
    if (status === "scheduled") return "INTERVIEW_SCHEDULED";

    return "NEW";
  };

  // Available actions based on current status
  const availableActions = [
    {
      id: "schedule_interview",
      label: "Schedule Interview",
      status: "INTERVIEW_SCHEDULED",
    },
    { id: "manual_evaluate", label: "Manual Evaluation", status: "MANUAL_EVALUATED" },
    { id: "hire_reject", label: "Make Decision", status: "HIRED" },
  ];

  // Get the next available action based on current status
  const getNextAction = (currentStatus) => {
    switch (currentStatus) {
      case "NEW":
        return { id: "schedule_interview", status: "INTERVIEW_SCHEDULED" };
      case "INTERVIEW_SCHEDULED":
        return { id: "complete_interview", status: "INTERVIEW_COMPLETED" };
      case "INTERVIEW_COMPLETED":
        // After interview completed, next step is manual evaluation (can be done even without AI evaluation)
        return { id: "manual_evaluate", status: "MANUAL_EVALUATED" };
      case "AI_EVALUATED":
        // After AI evaluation, next step is manual evaluation
        return { id: "manual_evaluate", status: "MANUAL_EVALUATED" };
      case "MANUAL_EVALUATED":
        return { id: "hire_reject", status: "HIRE" }; // Show hire option
      default:
        return null;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (action) => {
    if (action === "schedule_interview") {
      setSelectedAction("schedule_interview");
      setShowStatusModal(true);
    } else if (action === "manual_evaluate") {
      setSelectedAction("manual_evaluate");
      setShowStatusModal(true);
    } else if (action === "hire_reject") {
      setSelectedAction("hire_reject");
      setShowStatusModal(true);
    } else if (action === "complete_interview") {
      // Find the latest scheduled interview
      const latestInterview = interviews.find(
        (interview) => interview.status?.toLowerCase() === "scheduled"
      );

      if (latestInterview) {
        try {
          await updateInterviewStatus(latestInterview.id, "completed");
          // Refresh interviews data
          await fetchInterviews();
        } catch (error) {
          console.error("Error completing interview:", error);
        }
      }
    }
  };

  const handleModalClose = () => {
    setShowStatusModal(false);
    setSelectedAction(null);
    // Refresh both interviews and candidate data after modal closes
    fetchInterviews();
    // Refresh candidate data from Redux
    dispatch(fetchCandidates());
  };

  // Interview management handlers
  const handleEditInterview = (interview) => {
    console.log("Edit interview:", interview);
    setEditingInterview(interview);
    setShowEditInterviewModal(true);
  };



  // Evaluation management handlers
  const handleEditEvaluation = (evaluation) => {
    console.log("Edit evaluation:", evaluation);
    console.log("Evaluation data structure:", {
      overall_score: evaluation.overall_score,
      traits: evaluation.traits,
      suggestions: evaluation.suggestions,
      created_at: evaluation.created_at
    });
    setEditingEvaluation(evaluation);
    setShowEditEvaluationModal(true);
  };

  const handleDeleteEvaluation = (evaluation) => {
    setDeleteType('evaluation');
    setItemToDelete(evaluation);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvaluation = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        notify.error("Authentication token not found");
        return;
      }

      // Delete the evaluation
      const response = await fetch(`${baseURL}/api/evaluations/${itemToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete evaluation: ${response.status}`);
      }

      notify.success("Evaluation deleted successfully!");
      
      // Refresh data
      fetchInterviews();
      dispatch(fetchCandidates());
      
      // Close modal
      setShowDeleteModal(false);
      setDeleteType(null);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      notify.error(error.message || "Failed to delete evaluation");
    }
  };

  const handleDeleteInterview = (interview) => {
    setDeleteType('interview');
    setItemToDelete(interview);
    setShowDeleteModal(true);
  };

  const confirmDeleteInterview = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        notify.error("Authentication token not found");
        return;
      }

      // First, release the slot if it exists
      const slotId = itemToDelete.slot || itemToDelete.slot_details?.id;
      if (slotId) {
        try {
          const releaseResponse = await fetch(`${baseURL}/api/interviews/slots/${slotId}/release_slot/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${authToken}`,
            },
          });

          if (releaseResponse.ok) {
            console.log("Slot released successfully");
          } else {
            console.warn("Failed to release slot, but continuing with interview deletion");
          }
        } catch (slotError) {
          console.warn("Error releasing slot:", slotError);
          // Continue with interview deletion even if slot release fails
        }
      }

      // Delete the interview
      const response = await fetch(`${baseURL}/api/interviews/${itemToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete interview: ${response.status}`);
      }

      notify.success("Interview deleted and slot released successfully!");
      
      // Refresh data
      fetchInterviews();
      dispatch(fetchCandidates());
      
      // Close modal
      setShowDeleteModal(false);
      setDeleteType(null);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting interview:", error);
      notify.error(error.message || "Failed to delete interview");
    }
  };



  useEffect(() => {
    if (candidatesStatus === "idle") {
      dispatch(fetchCandidates());
    }
    if (jobsStatus === "idle") {
      dispatch(fetchJobs());
    }
  }, [candidatesStatus, jobsStatus, dispatch]);

  useEffect(() => {
    if (candidatesStatus === "succeeded" && allCandidates) {
      const foundCandidate = allCandidates.find((c) => String(c.id) === id);
      setCandidate(foundCandidate);
      setLoading(false);
    } else if (candidatesStatus === "failed") {
      setLoading(false);
    }
  }, [id, candidatesStatus, allCandidates]);

  // Additional effect to update candidate when allCandidates changes (for status updates)
  useEffect(() => {
    if (allCandidates && candidate?.id) {
      const updatedCandidate = allCandidates.find((c) => String(c.id) === candidate.id);
      if (updatedCandidate && (
        updatedCandidate.status !== candidate.status ||
        updatedCandidate.last_updated !== candidate.last_updated
      )) {
        console.log("Updating candidate from allCandidates:", {
          oldStatus: candidate.status,
          newStatus: updatedCandidate.status,
          oldLastUpdated: candidate.last_updated,
          newLastUpdated: updatedCandidate.last_updated
        });
        setCandidate(updatedCandidate);
      }
    }
  }, [allCandidates, candidate?.id]);

  useEffect(() => {
    if (candidate) {
      fetchInterviews();
    }
  }, [candidate]);

  // Handle evaluation submission
  const handleEvaluationSubmit = async (evaluationData) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      notify.error("Authentication token not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/evaluations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          ...evaluationData,
          candidate: candidate.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the data with a slight delay to ensure backend processing is complete
      setTimeout(async () => {
        await fetchInterviews();
      }, 1000);
      setShowStatusModal(false);
      notify.success("Evaluation submitted successfully!");
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      notify.error(
        error.message || "Failed to submit evaluation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="candidate-details-layout loading-container">
        <BeatLoader color="var(--color-primary-dark)" />
        <p>Loading candidate details...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="candidate-not-found-container">
        <p>Candidate not found.</p>
        <button
          className="back-to-candidates-btn"
          onClick={() => navigate("/candidates")}
        >
          Go to Candidates List
        </button>
      </div>
    );
  }

  const currentStatus = getCurrentStatus();

  // Don't show actions if candidate is hired or rejected
  const shouldShowActions = currentStatus !== "HIRED" && currentStatus !== "REJECTED";

  return (
    <>
      <div className={`candidate-details-layout ${showStatusModal ? 'blur-background' : ''}`}>
      <div className="candidate-details-left-panel" style={{ paddingBottom: '50px' }}>
        <div className="candidate-details-content card">
          <div className="candidate-main-layout">
            <div className="candidate-info-section">
          <div className="back-button-container">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FiChevronLeft size={24} /> Back
            </button>
          </div>
              
            <h1 className="candidate-name-display">
              {candidate.name || "N/A"}
            </h1>
              
          <div className="details-grid">
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{candidate.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{candidate.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Experience:</span>
              <span className="detail-value">
                {candidate.workExperience} years
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Domain:</span>
              <span className="detail-value">
                {getDomainName(candidate.domain)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Job Title:</span>
              <span className="detail-value">
                {getJobTitle(candidate.jobRole)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Applied On:</span>
              <span className="detail-value">
                {candidate.applicationDate
                  ? (() => {
                      try {
                        const date = new Date(candidate.applicationDate);
                        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
                      } catch (error) {
                        console.error("Error parsing application date:", error);
                        return "N/A";
                      }
                    })()
                  : "N/A"}
              </span>
            </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`status-badge ${currentStatus.toLowerCase()}`}>
                      {currentStatus.replace(/_/g, " ")}
                    </span>
                  </span>
          </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">
                    {candidate.last_updated
                      ? (() => {
                          try {
                            const date = new Date(candidate.last_updated);
                            return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString() + ' ' + date.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });
                          } catch (error) {
                            console.error("Error parsing last updated date:", error);
                            return "N/A";
                          }
                        })()
                      : "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Interview Count:</span>
                  <span className="detail-value">
                    {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">AI Evaluated:</span>
                  <span className="detail-value">
                    {interviews.some((i) => i.ai_result) ? (
                      <span className="status-indicator evaluated">Yes</span>
                    ) : (
                      <span className="status-indicator pending">No</span>
                    )}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Manual Evaluated:</span>
                  <span className="detail-value">
                    {interviews.some((i) => i.evaluation) ? (
                      <span className="status-indicator evaluated">Yes</span>
                    ) : (
                      <span className="status-indicator pending">No</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hire Recommendation - Right side */}
            {interviews.some((i) => i.ai_result) && (
              <div className="hire-recommendation-section">
                <div className="hire-recommendation-card">
                  <div className="hire-status-row">
                    <span className="label">Hire Status:</span>
                    <span className={`value recommendation ${interviews.find(i => i.ai_result)?.ai_result.hire_recommendation ? "recommended" : "not-recommended"}`}>
                      {interviews.find(i => i.ai_result)?.ai_result.hire_recommendation ? "RECOMMENDED" : "NOT RECOMMENDED"}
                    </span>
                  </div>
                  {interviews.find(i => i.ai_result)?.ai_result.total_score !== undefined && (
                    <div className="score-row">
                      <span className="label">Score:</span>
                      <span className={`value score-value ${interviews.find(i => i.ai_result)?.ai_result.total_score >= 8 ? "high-score" : interviews.find(i => i.ai_result)?.ai_result.total_score >= 6 ? "medium-score" : "low-score"}`}>
                        {interviews.find(i => i.ai_result)?.ai_result.total_score?.toFixed(1) || "N/A"}/10
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <hr className="details-divider" />
          <h3>POC Details</h3>
          <div className="poc-details-section">
            <p>
              <strong>POC Email:</strong> {candidate.poc || "N/A"}
            </p>
          </div>
        </div>

        {/* AI Evaluation Results Section - Matching Image Design */}
        <div className="evaluation-section card">
          {interviews.length > 0 && (
            <div className="ai-evaluation-results">
              <div className="evaluation-header-section">
                <h3 className="evaluation-title">AI Evaluation Results</h3>
                {interviews.find(i => i.ai_result)?.ai_result?.overall_rating && (
                  <span className={`overall-rating-badge ${interviews.find(i => i.ai_result)?.ai_result.overall_rating?.toLowerCase() || "fair"}`}>
                    {interviews.find(i => i.ai_result)?.ai_result.overall_rating?.toUpperCase() || "FAIR"}
                  </span>
                )}
              </div>
              
              {interviews
                .map((interview) => {
                  try {
                    const aiResult = interview.ai_result;
                    const qaData = interview.questions_and_answers || [];

                    // If no AI result, show a basic evaluation card with proctoring button
                    if (!aiResult) {
                      return (
                        <div key={interview.id || interview.session_key || 'unknown'} className="evaluation-card">
                          <h4 className="card-title">Interview Evaluation</h4>
                          <div className="evaluation-content">
                            <p>AI evaluation in progress or not available.</p>

                            {/* Proctoring Warnings Report - Download Link */}
                            {(interview.id || interview.session_key) && (
                              <div className="evaluation-card proctoring-report-card" style={{ marginTop: '15px' }}>
                                <h4 className="card-title">Proctoring Warnings Report</h4>
                                <div className="proctoring-download-section">
                                  <button
                                    onClick={async () => {
                                      try {
                                        // Build API URL with session_key or interview_id
                                        let apiUrl = `${baseURL}/api/evaluation/proctoring-pdf-url/`;
                                        const params = new URLSearchParams();

                                        if (interview.session_key) {
                                          params.append('session_key', interview.session_key);
                                        } else if (interview.id) {
                                          params.append('interview_id', interview.id);
                                        }

                                        if (params.toString()) {
                                          apiUrl += '?' + params.toString();
                                        }

                                        // Fetch GCS URL from backend API
                                        const response = await fetch(apiUrl, {
                                          method: 'GET',
                                          headers: {
                                            'Authorization': `Token ${authToken}`,
                                            'Content-Type': 'application/json',
                                          },
                                        });

                                        const data = await response.json();

                                        if (data.success && data.gcs_url) {
                                          // Open GCS URL directly from database - no processing, no cleaning
                                          window.open(data.gcs_url, '_blank', 'noopener,noreferrer');
                                        } else {
                                          alert(data.error || 'Failed to get proctoring PDF URL');
                                        }
                                      } catch (error) {
                                        console.error('Error fetching proctoring PDF URL:', error);
                                        alert('Error: Failed to fetch proctoring PDF URL. Please try again.');
                                      }
                                    }}
                                    className="proctoring-download-link"
                                    style={{
                                      cursor: 'pointer',
                                      border: 'none',
                                      background: 'none',
                                      padding: 0,
                                      font: 'inherit',
                                      color: 'inherit',
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                  >
                                    <span className="download-icon">≡ƒôä</span>
                                    <span>Download Proctoring Warnings Report</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    // Normalize question types for consistent grouping
                    const technicalQuestions = sortQAPairs(
                      qaData
                      .filter(qa => {
                        const normalizedType = (qa.question_type || '').toUpperCase();
                        const normalizedLevel = (qa.question_level || '').toUpperCase();
                        return (
                          normalizedType === 'TECHNICAL' ||
                          normalizedType === 'BEHAVIORAL' ||
                          normalizedType === 'INTRODUCTION' ||
                          normalizedType === 'CLOSING' ||
                          normalizedLevel === 'CANDIDATE_QUESTION' ||
                          normalizedType === ''
                        );
                      })
                    );
                    const codingQuestions = sortQAPairs(
                      qaData.filter(qa => (qa.question_type || '').toUpperCase() === 'CODING')
                    );
                    
                    // Calculate TECHNICAL metrics - use AI evaluation data (based on actual answer correctness analysis)
                    const technicalTotalQuestions = technicalQuestions.length || 0;
                    
                    // Use AI-provided correct/incorrect counts from AI analysis (not just answer presence)
                    let technicalCorrectAnswers = 0;
                    let technicalIncorrectAnswers = 0;
                    let technicalAccuracy = 0;
                    
                    // CRITICAL: Use LLM analysis results from QUESTION CORRECTNESS ANALYSIS
                    // Priority 1: Use technical_questions_correct and technical_questions_attempted (most accurate)
                    if (aiResult.technical_questions_correct !== undefined && aiResult.technical_questions_attempted !== undefined) {
                      // These come directly from LLM's QUESTION CORRECTNESS ANALYSIS section
                      technicalCorrectAnswers = Math.round(aiResult.technical_questions_correct || 0);
                      const technicalAttempted = Math.round(aiResult.technical_questions_attempted || 0);
                      technicalIncorrectAnswers = Math.max(0, technicalAttempted - technicalCorrectAnswers);
                      technicalAccuracy = technicalAttempted > 0 
                        ? (technicalCorrectAnswers / technicalAttempted * 100) 
                        : 0;
                      console.log(`Γ£à Using LLM analysis (technical_questions_*): ${technicalCorrectAnswers}/${technicalAttempted} correct`);
                    }
                    // Priority 2: Use questions_correct and questions_attempted (backward compatibility)
                    else if (aiResult.questions_correct !== undefined && aiResult.questions_attempted !== undefined) {
                      // Use AI evaluation data - these are based on actual answer correctness analysis
                      // AI analyzes each answer and determines if it's correct or incorrect
                      technicalCorrectAnswers = Math.round(aiResult.questions_correct || 0);
                      const technicalAttempted = Math.round(aiResult.questions_attempted || 0);
                      technicalIncorrectAnswers = Math.max(0, technicalAttempted - technicalCorrectAnswers);
                      technicalAccuracy = technicalAttempted > 0 
                        ? (technicalCorrectAnswers / technicalAttempted * 100) 
                        : 0;
                      console.log(`Γ£à Using LLM analysis (questions_*): ${technicalCorrectAnswers}/${technicalAttempted} correct`);
                    } 
                    // Priority 3: Calculate from accuracy percentage if available
                    else if (aiResult.technical_accuracy_percentage !== undefined && aiResult.technical_questions_attempted !== undefined) {
                      const technicalAttempted = Math.round(aiResult.technical_questions_attempted || 0);
                      technicalAccuracy = aiResult.technical_accuracy_percentage || 0;
                      technicalCorrectAnswers = Math.round((technicalAccuracy / 100) * technicalAttempted);
                      technicalIncorrectAnswers = Math.max(0, technicalAttempted - technicalCorrectAnswers);
                      console.log(`Γ£à Using LLM analysis (from accuracy %): ${technicalCorrectAnswers}/${technicalAttempted} correct`);
                    }
                    else if (aiResult.accuracy_percentage !== undefined && aiResult.questions_attempted !== undefined) {
                      // Calculate from accuracy percentage if available
                      const technicalAttempted = Math.round(aiResult.questions_attempted || 0);
                      technicalAccuracy = aiResult.accuracy_percentage || 0;
                      technicalCorrectAnswers = Math.round((technicalAccuracy / 100) * technicalAttempted);
                      technicalIncorrectAnswers = Math.max(0, technicalAttempted - technicalCorrectAnswers);
                      console.log(`Γ£à Using LLM analysis (from accuracy %): ${technicalCorrectAnswers}/${technicalAttempted} correct`);
                    } 
                    // Final fallback: count from technical_questions if they have is_correct flag from AI analysis
                    else {
                      // Fallback: count from technical_questions if they have is_correct flag from AI analysis
                      const technicalWithCorrectness = technicalQuestions.filter(qa => qa.is_correct === true);
                      technicalCorrectAnswers = technicalWithCorrectness.length;
                      technicalIncorrectAnswers = technicalTotalQuestions - technicalCorrectAnswers;
                      technicalAccuracy = technicalTotalQuestions > 0 
                        ? (technicalCorrectAnswers / technicalTotalQuestions * 100) 
                        : 0;
                      console.warn(`ΓÜá∩╕Å Using fallback calculation: ${technicalCorrectAnswers}/${technicalTotalQuestions} correct (LLM analysis not available)`);
                    }
                    
                    // Calculate CODING metrics - use test results if available
                    const codingTotalQuestions = codingQuestions.length || 0;
                    let codingCorrectAnswers = 0;
                    let codingIncorrectAnswers = 0;
                    let codingAccuracy = 0;
                    
                    // For coding questions, ONLY count as correct if ALL test cases passed
                    codingQuestions.forEach(qa => {
                      // For coding questions, we ONLY count as correct if all test cases passed
                      // Priority: 1) code_submission.passed_all_tests (must be true), 2) check test case results from output_log
                      let isCorrect = false;
                      
                      // Check if code submission exists and all tests passed
                      if (qa.code_submission && qa.code_submission.passed_all_tests === true) {
                        isCorrect = true;
                      } else if (qa.code_submission && qa.code_submission.output_log) {
                        // Parse output_log to check if all test cases passed
                        const outputLog = qa.code_submission.output_log;
                        // Check if output_log contains test case results
                        const allPassedPattern = /(\d+)\/(\d+)\s+test.*passed/i;
                        const match = outputLog.match(allPassedPattern);
                        if (match) {
                          const passed = parseInt(match[1] || 0);
                          const total = parseInt(match[2] || 0);
                          // Only correct if ALL test cases passed (passed === total)
                          isCorrect = (total > 0 && passed === total);
                        }
                        // Also check for "all tests passed" indicators
                        if (!isCorrect && (outputLog.includes('all tests passed') || outputLog.includes('all_passed: true'))) {
                          isCorrect = true;
                        }
                      }
                      // Note: We intentionally ignore qa.is_correct flag for coding questions
                      // because correctness should be determined by test case results only
                      
                      if (isCorrect) {
                        codingCorrectAnswers++;
                      } else if (qa.answer && qa.answer !== 'No code submitted' && qa.answer !== 'no answer provided' && qa.answer !== 'None') {
                        // If there's an answer but not all tests passed, count as incorrect
                        codingIncorrectAnswers++;
                      }
                    });
                    codingAccuracy = codingTotalQuestions > 0 
                      ? (codingCorrectAnswers / codingTotalQuestions * 100) 
                      : 0;
                    
                    // Overall metrics (for display purposes, but we'll show separate sections)
                    const totalQuestions = technicalTotalQuestions + codingTotalQuestions;
                    const correctAnswers = technicalCorrectAnswers + codingCorrectAnswers;
                    const incorrectAnswers = totalQuestions - correctAnswers;
                    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100) : 0;
                    const totalCompletionTime = aiResult.total_completion_time || 54.6;
                    
                    // Section scores (AI returns 0-100 scale, use directly as percentage)
                    // Note: AI scores are already in 0-100 scale, so use them directly
                    const technicalScore = aiResult.technical_score || 0;
                    const behavioralScore = aiResult.behavioral_score || 0;
                    const codingScore = aiResult.coding_score || 0;
                    const communicationScore = aiResult.communication_score || 0;
                    const problemSolvingScore = aiResult.problem_solving_score || 0;
                    
                    // Overall rating
                    const overallRating = aiResult.overall_rating || 'FAIR';
                    
                    // Strengths and weaknesses - try array fields first, then parse from string
                    const strengths = aiResult.strengths_array || parseJsonField(aiResult.strengths || '');
                    const weaknesses = aiResult.weaknesses_array || parseJsonField(aiResult.weaknesses || '');
                    
                    // Question accuracy chart data - TECHNICAL ONLY
                    const technicalAccuracyChartData = [
                      { name: 'Correct', value: technicalCorrectAnswers, color: '#4CAF50' },
                      { name: 'Incorrect', value: technicalIncorrectAnswers, color: '#F44336' }
                    ];
                    
                    // Coding accuracy chart data
                    const codingAccuracyChartData = [
                      { name: 'Correct', value: codingCorrectAnswers, color: '#4CAF50' },
                      { name: 'Incorrect', value: codingIncorrectAnswers, color: '#F44336' }
                    ];
                    
                    // Section scores data for bar chart
                    const sectionScoresData = [
                      { name: 'Technical', score: technicalScore, fullScore: 100 },
                      { name: 'Behavioral', score: behavioralScore, fullScore: 100 },
                      { name: 'Coding', score: codingScore, fullScore: 100 },
                      { name: 'Communication', score: communicationScore, fullScore: 100 },
                      { name: 'Problem Solving', score: problemSolvingScore, fullScore: 100 },
                    ];
                    
                    return (
                      <div key={interview.id} className="ai-evaluation-wrapper">
                        <div className="ai-evaluation-layout">
                          {/* Left Column - Metrics Grid */}
                          <div className="ai-evaluation-left">
                            {/* Row 1: Performance Metrics */}
                            <div className="metrics-row-1">
                              {/* Technical Performance Metrics Card */}
                              <div className="evaluation-card performance-metrics-card">
                                <h4 className="card-title">Technical Performance Metrics</h4>
                                <div className="metrics-grid">
                                  <div className="metric-circle">
                                    <div className="circle-chart" style={{ 
                                      background: `conic-gradient(#2196F3 0% ${technicalTotalQuestions > 0 ? (technicalTotalQuestions/12)*100 : 0}%, #e0e0e0 ${technicalTotalQuestions > 0 ? (technicalTotalQuestions/12)*100 : 0}% 100%)`
                                    }}>
                                      <span className="circle-value">
                                        {aiResult.questions_attempted !== undefined 
                                          ? Math.round(aiResult.questions_attempted) 
                                          : (aiResult.technical_questions_attempted !== undefined 
                                              ? Math.round(aiResult.technical_questions_attempted)
                                              : technicalTotalQuestions)}
                                      </span>
                                    </div>
                                    <div className="circle-label">Questions Attempted</div>
                                  </div>
                                  <div className="metric-circle">
                                    <div className="circle-chart" style={{ 
                                      background: `conic-gradient(#4CAF50 0% ${technicalTotalQuestions > 0 ? (technicalCorrectAnswers/technicalTotalQuestions)*100 : 0}%, #e0e0e0 ${technicalTotalQuestions > 0 ? (technicalCorrectAnswers/technicalTotalQuestions)*100 : 0}% 100%)`
                                    }}>
                                      <span className="circle-value">{technicalCorrectAnswers}</span>
                                    </div>
                                    <div className="circle-label">Questions Correct</div>
                                  </div>
                                  <div className="metric-circle">
                                    <div className="circle-chart" style={{ 
                                      background: `conic-gradient(#7B2CBF 0% ${technicalAccuracy}%, #e0e0e0 ${technicalAccuracy}% 100%)`
                                    }}>
                                      <span className="circle-value">{technicalAccuracy.toFixed(0)}%</span>
                                    </div>
                                    <div className="circle-label">Accuracy (%)</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Coding Performance Metrics Card */}
                              {codingTotalQuestions > 0 && (
                                <div className="evaluation-card performance-metrics-card">
                                  <h4 className="card-title">Coding Performance Metrics</h4>
                                  <div className="metrics-grid">
                                    <div className="metric-circle">
                                      <div className="circle-chart" style={{ 
                                        background: `conic-gradient(#2196F3 0% ${codingTotalQuestions > 0 ? (codingTotalQuestions/12)*100 : 0}%, #e0e0e0 ${codingTotalQuestions > 0 ? (codingTotalQuestions/12)*100 : 0}% 100%)`
                                      }}>
                                        <span className="circle-value">{codingTotalQuestions}</span>
                                      </div>
                                      <div className="circle-label">Questions Attempted</div>
                                    </div>
                                    <div className="metric-circle">
                                      <div className="circle-chart" style={{ 
                                        background: `conic-gradient(#4CAF50 0% ${codingTotalQuestions > 0 ? (codingCorrectAnswers/codingTotalQuestions)*100 : 0}%, #e0e0e0 ${codingTotalQuestions > 0 ? (codingCorrectAnswers/codingTotalQuestions)*100 : 0}% 100%)`
                                      }}>
                                        <span className="circle-value">{codingCorrectAnswers}</span>
                                      </div>
                                      <div className="circle-label">Questions Correct</div>
                                    </div>
                                    <div className="metric-circle">
                                      <div className="circle-chart" style={{ 
                                        background: `conic-gradient(#7B2CBF 0% ${codingAccuracy}%, #e0e0e0 ${codingAccuracy}% 100%)`
                                      }}>
                                        <span className="circle-value">{codingAccuracy.toFixed(0)}%</span>
                                      </div>
                                      <div className="circle-label">Accuracy (%)</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Row 2: Time Metrics and Detailed Section Scores */}
                            <div className="metrics-row-2">
                              {/* Time Metrics Card */}
                              <div className="evaluation-card time-metrics-card">
                                <h4 className="card-title">Time Metrics</h4>
                                <div className="time-metrics-content">
                                  <div className="time-metric">
                                    <div className="time-value-box" style={{ backgroundColor: '#FFEBEE' }}>
                                      <div className="time-icon">ΓÅ▒∩╕Å</div>
                                      <div className="time-value">{totalCompletionTime.toFixed(1)}min</div>
                                    </div>
                                    <div className="time-label">Total Completion Time</div>
                                    <div className="time-total">Total: {totalCompletionTime.toFixed(1)} minutes</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Detailed Section Scores Card */}
                              <div className="evaluation-card detailed-scores-card">
                                <h4 className="card-title">Detailed Section Scores</h4>
                                <div className="detailed-scores-list">
                                  {sectionScoresData.map((section, idx) => (
                                    <div key={idx} className="detailed-score-item">
                                      <div className="score-label">{section.name}</div>
                                      <div className="score-value">{((section.score/100) * 10).toFixed(1)}/10</div>
                                      <div className="progress-bar-horizontal">
                                        <div 
                                          className="progress-fill" 
                                          style={{ 
                                            width: `${section.score}%`, 
                                            backgroundColor: section.score >= 60 ? '#2196F3' : '#FF9800' 
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Other Cards Below (Strengths, Improvement, Summary, Proctoring) */}
                            <div className="other-cards-grid">
                              {/* Strengths Card */}
                              <div className="evaluation-card strengths-card">
                                <h4 className="card-title">
                                  <span className="card-icon">Γ£à</span> Strengths
                                </h4>
                                <div className="strengths-list">
                                  {strengths.length > 0 ? (
                                    strengths.map((strength, idx) => (
                                      <div key={idx} className="strength-tag">{strength}</div>
                                    ))
                                  ) : (
                                    <div className="strength-tag">Strong analytical thinking</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Areas for Improvement Card */}
                              <div className="evaluation-card improvement-card">
                                <h4 className="card-title">
                                  <span className="card-icon">≡ƒöº</span> Areas for Improvement
                                </h4>
                                <div className="improvement-list">
                                  {weaknesses.length > 0 ? (
                                    weaknesses.map((weakness, idx) => (
                                      <div key={idx} className="improvement-tag">{weakness}</div>
                                    ))
                                  ) : (
                                    <div className="improvement-tag">Could improve on time management</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Summary Card - 4 Point Summary */}
                              <div className="evaluation-card summary-card">
                                <h4 className="card-title">Summary</h4>
                                <div className="summary-points-list" style={{ marginTop: '15px' }}>
                                  {/* Technical Summary */}
                                  <div className="summary-point-item" style={{ marginBottom: '15px', paddingLeft: '24px', position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '0', top: '2px', color: '#2196F3', fontSize: '18px', fontWeight: 'bold' }}>ΓÇó</span>
                                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', fontSize: '15px' }}>Technical Summary:</div>
                                    <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', paddingLeft: '0' }}>
                                      {aiResult.technical_analysis || (technicalScore > 0 ? `Technical performance: ${(technicalScore / 10).toFixed(1)}/10. ${technicalScore >= 70 ? 'Strong technical knowledge demonstrated.' : technicalScore >= 50 ? 'Moderate technical knowledge.' : 'Technical knowledge needs improvement.'}` : 'Technical evaluation not available.')}
                                    </div>
                                  </div>
                                  
                                  {/* Coding Summary */}
                                  <div className="summary-point-item" style={{ marginBottom: '15px', paddingLeft: '24px', position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '0', top: '2px', color: '#2196F3', fontSize: '18px', fontWeight: 'bold' }}>ΓÇó</span>
                                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', fontSize: '15px' }}>Coding Summary:</div>
                                    <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', paddingLeft: '0' }}>
                                      {aiResult.coding_analysis || (codingScore > 0 ? `Coding performance: ${(codingScore / 10).toFixed(1)}/10. ${codingScore >= 70 ? 'Strong coding skills demonstrated.' : codingScore >= 50 ? 'Moderate coding skills.' : 'Coding skills need improvement.'}` : codingTotalQuestions > 0 ? 'Coding evaluation completed but analysis not available.' : 'No coding questions were part of this interview.')}
                                    </div>
                                  </div>
                                  
                                  {/* Grammar/Communication Summary */}
                                  <div className="summary-point-item" style={{ marginBottom: '15px', paddingLeft: '24px', position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '0', top: '2px', color: '#2196F3', fontSize: '18px', fontWeight: 'bold' }}>ΓÇó</span>
                                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', fontSize: '15px' }}>Grammar/Communication Summary:</div>
                                    <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', paddingLeft: '0' }}>
                                      {(() => {
                                        // Try to get communication analysis from behavioral_analysis or create from communication_score
                                        if (aiResult.behavioral_analysis && aiResult.behavioral_analysis.trim()) {
                                          return aiResult.behavioral_analysis;
                                        } else if (communicationScore > 0) {
                                          const commScore = (communicationScore / 10).toFixed(1);
                                          if (communicationScore >= 80) {
                                            return `Communication score: ${commScore}/10. Excellent communication skills with clear articulation, proper grammar, and effective expression.`;
                                          } else if (communicationScore >= 60) {
                                            return `Communication score: ${commScore}/10. Good communication skills with minor grammar issues.`;
                                          } else if (communicationScore >= 40) {
                                            return `Communication score: ${commScore}/10. Communication skills need improvement. Some grammar and clarity issues observed.`;
                                          } else {
                                            return `Communication score: ${commScore}/10. Poor communication skills with significant grammar and clarity issues.`;
                                          }
                                        } else {
                                          return 'Communication evaluation not available.';
                                        }
                                      })()}
                                    </div>
                                  </div>

                                  {/* Proctoring PDF URL - Added to Summary */}
                                  {(() => {
                                    console.log('[DEBUG] AI Result proctoring_pdf_gcs_url:', aiResult.proctoring_pdf_gcs_url);
                                    console.log('[DEBUG] Full AI Result keys:', Object.keys(aiResult));
                                    return aiResult.proctoring_pdf_gcs_url;
                                  })() && (
                                    <div className="summary-point-item" style={{ marginBottom: '15px', paddingLeft: '24px', position: 'relative' }}>
                                      <span style={{ position: 'absolute', left: '0', top: '2px', color: '#FF9800', fontSize: '18px', fontWeight: 'bold' }}>≡ƒôï</span>
                                      <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', fontSize: '15px' }}>Proctoring PDF Report:</div>
                                      <div style={{
                                        color: '#666',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        paddingLeft: '0',
                                        fontFamily: 'monospace',
                                        backgroundColor: '#f8f9fa',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #e9ecef',
                                        wordBreak: 'break-all'
                                      }}>
                                        {aiResult.proctoring_pdf_gcs_url}
                                      </div>
                                      <div style={{
                                        marginTop: '4px',
                                        fontSize: '11px',
                                        color: '#888',
                                        fontStyle: 'italic'
                                      }}>
                                        Direct link to proctoring report from database
                                      </div>
                                    </div>
                                  )}

                                  {/* Select/Reject Reason */}
                                  <div className="summary-point-item" style={{ marginBottom: '0', paddingLeft: '24px', position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '0', top: '2px', color: aiResult.hire_recommendation ? '#4CAF50' : '#F44336', fontSize: '18px', fontWeight: 'bold' }}>ΓÇó</span>
                                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', fontSize: '15px' }}>
                                      {aiResult.hire_recommendation ? 'Select Reason:' : 'Reject Reason:'}
                                    </div>
                                    <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', paddingLeft: '0' }}>
                                      {(() => {
                                        // Build select/reject reason from available data
                                        if (aiResult.hiring_recommendation && aiResult.hiring_recommendation.trim()) {
                                          return aiResult.hiring_recommendation;
                                        } else if (aiResult.detailed_feedback && aiResult.detailed_feedback.trim()) {
                                          return aiResult.detailed_feedback;
                                        } else {
                                          // Build reason from scores
                                          const totalScore = aiResult.total_score || 0;
                                          const reasons = [];
                                          
                                          if (technicalScore >= 70) reasons.push('strong technical knowledge');
                                          if (codingScore >= 70) reasons.push('excellent coding skills');
                                          if (communicationScore >= 70) reasons.push('good communication');
                                          
                                          if (aiResult.hire_recommendation) {
                                            if (reasons.length > 0) {
                                              return `Recommended for selection based on: ${reasons.join(', ')}. Overall score: ${totalScore.toFixed(1)}/10.`;
                                            } else {
                                              return `Recommended for selection. Overall score: ${totalScore.toFixed(1)}/10.`;
                                            }
                                          } else {
                                            const issues = [];
                                            if (technicalScore < 50) issues.push('weak technical knowledge');
                                            if (codingScore > 0 && codingScore < 50) issues.push('poor coding skills');
                                            if (communicationScore < 50) issues.push('communication issues');
                                            
                                            if (issues.length > 0) {
                                              return `Not recommended due to: ${issues.join(', ')}. Overall score: ${totalScore.toFixed(1)}/10.`;
                                            } else {
                                              return `Not recommended. Overall score: ${totalScore.toFixed(1)}/10.`;
                                            }
                                          }
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Proctoring PDF URL Display - from AI evaluation result */}
                              {aiResult && aiResult.proctoring_pdf_gcs_url && (
                                <div className="evaluation-card proctoring-pdf-url-card" style={{ marginTop: '15px' }}>
                                  <h4 className="card-title">Proctoring PDF URL</h4>
                                  <div className="proctoring-pdf-url-section">
                                    <div style={{
                                      padding: '12px',
                                      backgroundColor: '#f8f9fa',
                                      border: '1px solid #e9ecef',
                                      borderRadius: '6px',
                                      fontFamily: 'monospace',
                                      fontSize: '14px',
                                      wordBreak: 'break-all',
                                      color: '#495057'
                                    }}>
                                      {aiResult.proctoring_pdf_gcs_url}
                                    </div>
                                    <div style={{
                                      marginTop: '8px',
                                      fontSize: '12px',
                                      color: '#6c757d',
                                      fontStyle: 'italic'
                                    }}>
                                      Proctoring PDF URL from evaluation database
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Proctoring Warnings Report - Download Link */}
                              {(interview.id || interview.session_key) && (
                                <div className="evaluation-card proctoring-report-card">
                                  <h4 className="card-title">Proctoring Warnings Report</h4>
                                  <div className="proctoring-download-section">
                                    {/* Always visible Proctoring PDF button */}
                                    <button
                                      onClick={async () => {
                                        try {
                                          // Build API URL with session_key or interview_id
                                          let apiUrl = `${baseURL}/api/evaluation/proctoring-pdf-url/`;
                                          const params = new URLSearchParams();

                                          if (interview.session_key) {
                                            params.append('session_key', interview.session_key);
                                          } else if (interview.id) {
                                            params.append('interview_id', interview.id);
                                          }

                                          if (params.toString()) {
                                            apiUrl += '?' + params.toString();
                                          }

                                          // Fetch GCS URL from backend API
                                          const response = await fetch(apiUrl, {
                                            method: 'GET',
                                            headers: {
                                              'Authorization': `Token ${authToken}`,
                                              'Content-Type': 'application/json',
                                            },
                                          });

                                          const data = await response.json();

                                          console.log('[DEBUG] Proctoring PDF API response:', data);

                                          if (data.success && data.gcs_url) {
                                            console.log('[DEBUG] Opening GCS URL:', data.gcs_url);
                                            // Open GCS URL directly from database - no processing, no cleaning
                                            window.open(data.gcs_url, '_blank', 'noopener,noreferrer');
                                          } else {
                                            alert(data.error || 'No proctoring PDF available for this interview. The report may still be generating or the interview may not have proctoring enabled.');
                                          }
                                        } catch (error) {
                                          console.error('Error fetching proctoring PDF URL:', error);
                                          alert('Error: Failed to fetch proctoring PDF URL. The report may not be available yet.');
                                        }
                                      }}
                                      className="proctoring-download-link"
                                      style={{
                                        cursor: 'pointer',
                                        padding: '10px 16px',
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '500',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '10px',
                                        transition: 'background-color 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
                                    >
                                      <span className="download-icon">≡ƒôä</span>
                                      <span>Open Proctoring PDF</span>
                                    </button>
                                    {aiResult && aiResult.proctoring_warnings && aiResult.proctoring_warnings.length > 0 && (
                                      <div className="proctoring-warning-info">
                                        <strong>Total Warnings: {aiResult.proctoring_warnings.length}</strong>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Proctoring PDF URL Display */}
                              {(interview.id || interview.session_key) && (
                                <div className="evaluation-card proctoring-pdf-url-card" style={{ marginTop: '15px' }}>
                                  <h4 className="card-title">Proctoring PDF URL</h4>
                                  <div className="proctoring-pdf-url-section">
                                    <div style={{
                                      padding: '12px',
                                      backgroundColor: '#f8f9fa',
                                      border: '1px solid #e9ecef',
                                      borderRadius: '6px',
                                      fontFamily: 'monospace',
                                      fontSize: '14px',
                                      wordBreak: 'break-all',
                                      color: '#495057'
                                    }}>
                                      {(() => {
                                        const key = interview.session_key || interview.id;
                                        const isLoading = proctoringPdfLoading[key];
                                        const pdfUrl = proctoringPdfUrls[key];

                                        if (isLoading) {
                                          return <span style={{ color: '#6c757d' }}>Loading PDF URL...</span>;
                                        }

                                        return pdfUrl || 'No proctoring PDF URL available';
                                      })()}
                                    </div>
                                    <div style={{
                                      marginTop: '8px',
                                      fontSize: '12px',
                                      color: '#6c757d',
                                      fontStyle: 'italic'
                                    }}>
                                      This URL is fetched from the evaluation_proctoringpdf database table
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Q&A Script + AI Evaluation PDF Report - Download Link */}
                              <div className="evaluation-card qa-evaluation-report-card">
                                <h4 className="card-title">Q&A Script + AI Evaluation Report</h4>
                                <div className="qa-evaluation-download-section">
                                  <a 
                                    href={`${baseURL}/ai/transcript_pdf?${interview.session_key ? `session_key=${interview.session_key}` : `session_id=${interview.id}`}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="proctoring-download-link"
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      padding: '10px 16px',
                                      backgroundColor: '#2196F3',
                                      color: 'white',
                                      textDecoration: 'none',
                                      borderRadius: '6px',
                                      fontWeight: '500',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
                                  >
                                    <span className="download-icon" style={{ fontSize: '18px' }}>≡ƒôï</span>
                                    <span>Download Q&A Script + AI Evaluation PDF</span>
                                  </a>
                                  <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                                    <p style={{ margin: '0' }}>This PDF includes:</p>
                                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                                      <li>Complete question and answer transcript</li>
                                      <li>AI evaluation and analysis</li>
                                      <li>Coding challenge results (if applicable)</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering evaluation for interview:', interview.id, error);
                    return (
                      <div key={interview.id} className="evaluation-error">
                        <p className="error-text">Error loading evaluation data. Please try refreshing.</p>
                      </div>
                    );
                  }
                })}
            </div>
          )}

          {/* No Evaluation Message with Debug Info */}
          {interviews.length === 0 && (
            <div className="no-evaluation-message">
              <p className="no-data">{`${
                currentStatus === "INTERVIEW_COMPLETED"
                  ? "Evaluation in progress..."
                  : "No evaluation available"
              }`}</p>
              <details style={{ marginTop: '10px', fontSize: '0.9em', color: '#666', cursor: 'pointer' }}>
                <summary style={{ cursor: 'pointer', padding: '5px' }}>≡ƒöì Debug Info (Click to expand)</summary>
                <pre style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '0.85em',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(interviews.map(i => ({
                    id: i.id,
                    status: i.status,
                    has_ai_result: !!i.ai_result,
                    ai_result_type: typeof i.ai_result,
                    ai_result_is_null: i.ai_result === null,
                    ai_result_is_undefined: i.ai_result === undefined,
                    ai_result_keys: i.ai_result ? Object.keys(i.ai_result) : null,
                    ai_result_total_score: i.ai_result?.total_score,
                    ai_result_overall_score: i.ai_result?.overall_score,
                  })), null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

      <div className="candidate-details-right-panel">
        <div className="status-card">
          <div className="status-header">
            <h3>Status</h3>
            <span className={`status-badge ${currentStatus.toLowerCase()}`}>
              {currentStatus.replace(/_/g, " ")}
            </span>
          </div>

          <div className="status-progress-bar">
            {(() => {
              // Always show both evaluation steps in sequence
              const statusStages = [
                "NEW",
                "INTERVIEW_SCHEDULED",
                "INTERVIEW_COMPLETED",
                "AI_EVALUATED",
                "MANUAL_EVALUATED",
                "HIRE",
              ];

              const statusLabels = [
                "New",
                "Schedule Interview",
                "Interview Completed",
                "AI Evaluated",
                "Manual Evaluated",
                "Hire",
              ];

              const currentIndex = statusStages.indexOf(currentStatus);
              const nextAction = getNextAction(currentStatus);

              return statusLabels.map((label, index) => {
                const stage = statusStages[index];
                
                // Status step logic
                let isCompleted = false;
                let isCurrent = false;
                let isNextAction = false;
                let isClickable = false;
                let isRecommended = false;
                let displayLabel = label;
                
                if (stage === "HIRE") {
                  // Special handling for the hire step
                  if (currentStatus === "HIRED" || currentStatus === "REJECTED") {
                    // If candidate is hired or rejected, show the final status
                    displayLabel = currentStatus === "HIRED" ? "Hired" : "Rejected";
                    isCompleted = true;
                    isCurrent = true;
                    isClickable = false;
                  } else {
                    // Show "Hire" as the next action
                    isNextAction = nextAction && nextAction.status === "HIRE";
                    isClickable = isNextAction;
                    isRecommended = isNextAction;
                  }
                } else {
                  // Regular status steps
                  isCompleted = index < currentIndex;
                  isCurrent = index === currentIndex;
                  isNextAction = nextAction && statusStages[index] === nextAction.status;
                  
                  // Special handling for AI_EVALUATED - make it non-clickable when completed
                  if (stage === "AI_EVALUATED") {
                    const hasAIEvaluation = interviews.some((i) => i.ai_result);
                    if (hasAIEvaluation) {
                      isCompleted = true;
                      isClickable = false; // AI evaluation is not clickable
                      isCurrent = false; // Never current, always completed
                    } else {
                      isClickable = false; // AI evaluation is never clickable
                      isCompleted = false; // Show as incomplete if no AI results
                    }
                  } else if (stage === "MANUAL_EVALUATED") {
                    // Manual evaluation is always clickable as next action, even if AI evaluation is not complete
                  isClickable = isNextAction || isCompleted;
                  } else {
                    isClickable = isNextAction || isCompleted;
                  }
                  
                  isRecommended = isNextAction;
                }

                // Determine additional CSS classes based on status
                let additionalClasses = "";
                if (stage === "HIRE") {
                  if (currentStatus === "HIRED") {
                    additionalClasses = "hired";
                  } else if (currentStatus === "REJECTED") {
                    additionalClasses = "rejected";
                  }
                }

                return (
                  <div
                    key={stage}
                    className={`status-step ${isCompleted ? "completed" : ""} ${
                      isCurrent ? "current" : ""
                    } ${isClickable ? "clickable" : ""} ${isRecommended ? "recommended" : ""} ${additionalClasses}`}
                    onClick={() => {
                      if (!isClickable || !shouldShowActions) return;

                      if (stage === "INTERVIEW_SCHEDULED") {
                        handleStatusUpdate("schedule_interview");
                      } else if (stage === "INTERVIEW_COMPLETED") {
                        handleStatusUpdate("complete_interview");
                      } else if (stage === "AI_EVALUATED") {
                        // AI evaluation is not clickable - handled automatically
                        return;
                      } else if (stage === "MANUAL_EVALUATED") {
                        handleStatusUpdate("manual_evaluate");
                      } else if (stage === "HIRE") {
                        handleStatusUpdate("hire_reject");
                      } else if (isCompleted) {
                        const next = getNextAction(stage);
                        if (next) {
                          handleStatusUpdate(next.id);
                        }
                      }
                    }}
                  >
                    <div className="status-circle">{index + 1}</div>
                    <div className="status-label">{displayLabel}</div>
                    {index < statusStages.length - 1 && (
                      <div className="status-connector"></div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="interview-section card">
          {interviewsLoading ? (
            <BeatLoader color="var(--color-primary-dark)" size={8} />
          ) : interviews.length > 0 ? (
            interviews.map((interview, index) => (
              <div key={interview.id}>
                <div className="interview-header">
                  <h4>Interview Details - Round {interview.interview_round}</h4>
                  <span className={`interview-status ${interview.status.toLowerCase()}`}>
                    {interview.status}
                  </span>
                </div>
                
                <div className="interview-basic-info">
                  {/* Verification ID Image - Show only if verification was successful */}
                  {interview.verification_id_image && (
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                      <p style={{ marginBottom: '10px', fontWeight: 'bold', color: '#4CAF50' }}>
                        Γ£à Identity Verification Successful
                      </p>
                      <div style={{ textAlign: 'center' }}>
                        <img 
                          src={interview.verification_id_image} 
                          alt="Verification ID" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '400px', 
                            borderRadius: '8px',
                            border: '2px solid #4CAF50',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                          Verification ID Image
                        </p>
                      </div>
                    </div>
                  )}
                  <p>
                    <strong>Date:</strong>{" "}
                    {interview.started_at
                      ? new Date(interview.started_at).toLocaleDateString('en-US', {
                          timeZone: 'Asia/Kolkata'  // Force IST timezone for date display
                        })
                      : "TBD"}
                  </p>
                  <p>
                    <strong>Slot:</strong>{" "}
                    {(() => {
                      console.log("=== CANDIDATE DETAILS DEBUG ===");
                      console.log("Candidate ID:", candidate.id);
                      console.log("Candidate Name:", candidate.full_name);
                      console.log("Interview ID:", interview.id);
                      console.log("Full interview object:", interview);
                      console.log("Interview slot_details:", interview.slot_details);
                      console.log("Interview schedule:", interview.schedule);
                      console.log("Interview started_at:", interview.started_at);
                      console.log("Interview ended_at:", interview.ended_at);
                      
                      // Try different possible field names
                      const slotData = interview.slot_details || interview.schedule || interview.slot;
                      console.log("Slot data found:", slotData);
                      
                      // Also check if we can get slot data from the candidate's interviews
                      console.log("All candidate interviews:", candidate.interviews);
                      console.log("Current interview index:", interviews.findIndex(i => i.id === interview.id));
                      
                      // Check if there's a schedule relationship
                      if (interview.schedule) {
                        console.log("Interview schedule details:", interview.schedule);
                        if (interview.schedule.slot) {
                          console.log("Schedule slot details:", interview.schedule.slot);
                        }
                      }
                      
                      // CRITICAL: ALWAYS use interview.started_at/ended_at for time display
                      // These are proper DateTime objects set from slot times in IST, converted to UTC, then displayed in IST
                      // DO NOT use slot_details.start_time/end_time as they are raw TimeField values without timezone info
                      
                      // Check if started_at/ended_at exist - these are the ONLY source of truth
                      if (interview.started_at && interview.ended_at) {
                        try {
                          // Parse the datetime strings - they come as ISO 8601 strings from API
                          const startDate = new Date(interview.started_at);
                          const endDate = new Date(interview.ended_at);
                          
                          // Validate dates are valid
                          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            console.error("Invalid date values:", interview.started_at, interview.ended_at);
                            throw new Error("Invalid date");
                          }
                          
                          // Force display in IST (Asia/Kolkata) timezone - this is the ONLY source of truth
                          const startTimeIST = startDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'  // Force IST timezone display
                          });
                          
                          const endTimeIST = endDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'  // Force IST timezone display
                          });
                          
                          console.log("Displaying time from started_at/ended_at:", startTimeIST, "-", endTimeIST);
                          return `${startTimeIST} - ${endTimeIST}`;
                        } catch (error) {
                          console.error("Error formatting interview time from started_at:", error, {
                            started_at: interview.started_at,
                            ended_at: interview.ended_at
                          });
                          // Continue to fallback but log the error
                        }
                      } else {
                        console.warn("interview.started_at or ended_at is missing!", {
                          started_at: interview.started_at,
                          ended_at: interview.ended_at
                        });
                      }
                      
                      // Fallback ONLY if started_at/ended_at are not available (shouldn't happen for scheduled interviews)
                      if (slotData && slotData.start_time && slotData.end_time) {
                        console.warn("Using slot_details as fallback - interview.started_at/ended_at should be set!");
                        try {
                          // If we must use slot_details, format the time string directly
                          if (typeof slotData.start_time === 'string' && slotData.start_time.includes(':')) {
                            const formatTime = (timeStr) => {
                              return formatTimeTo12Hour(timeStr);
                            };
                            
                            const startTimeFormatted = formatTime(slotData.start_time);
                            const endTimeFormatted = formatTime(slotData.end_time);
                            
                            return `${startTimeFormatted} - ${endTimeFormatted}`;
                          }
                        } catch (error) {
                          console.error("Error formatting slot time:", error);
                          return "Invalid time format";
                        }
                      }
                      
                      return "N/A";
                    })()}
                  </p>
                </div>
                
                {/* Interview Action Buttons - Only show for scheduled interviews */}
                {interview.status?.toLowerCase() === 'scheduled' && (
                  <div className="interview-actions-container">
                    <div className="interview-actions">
                      <button 
                        className="edit-interview-btn" 
                        onClick={() => handleEditInterview(interview)}
                        title="Edit Interview"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </button>
                      <button 
                        className="delete-interview-btn" 
                        onClick={() => handleDeleteInterview(interview)}
                        title="Delete Interview"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Interview Video Recording Section */}
                {interview.interview_video && (
                  <div className="recording-section" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#333' }}>≡ƒô╣ Complete Interview Video</h4>
                    <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                      Full interview recording with camera, TTS questions, and candidate speech
                    </p>
                    <div className="video-player-container" style={{ width: '100%', maxWidth: '800px' }}>
                      <VideoPlayerWithErrorHandling 
                        videoUrl={interview.interview_video}
                        baseURL={baseURL}
                      />
                    </div>
                  </div>
                )}
                
                {/* Legacy Video Recording Section */}
                {interview.ai_result?.recording_video && (
                  <div className="recording-section">
                    <h4>Interview Recording</h4>
                    <div className="video-player-container">
                      <video
                        controls
                        className="video-player"
                        preload="metadata"
                      >
                        <source src={`${baseURL}${interview.ai_result.recording_video}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    {interview.ai_result.recording_created_at && (
                      <p className="recording-metadata">
                        <strong>Recorded:</strong>{" "}
                        {new Date(interview.ai_result.recording_created_at).toLocaleDateString() + ' ' + new Date(interview.ai_result.recording_created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Questions & Answers Section - Below Interview Details */}
                {(() => {
                  const qaData = sortQAPairs(interview.questions_and_answers || []);
                  if (qaData.length === 0) return null;
                  
                  // Get sequential conversation (like PDF format) from first Q&A item if available
                  const sequentialConversation = qaData[0]?._sequential_conversation || [];
                  
                  // Group questions by type (case-insensitive)
                  const codingQuestions = qaData.filter(
                    (qa) => (qa.question_type || '').toUpperCase() === 'CODING'
                  );
                  const technicalQuestions = qaData.filter(
                    (qa) => (qa.question_type || '').toUpperCase() !== 'CODING'
                  );
                  
                  return (
                    <div className="qa-section-below-interview">
                      <h4 className="qa-section-title">Questions & Answers - Round {interview.interview_round || 'AI Interview'}</h4>
                      <div className="qa-list-container">
                        {/* Technical Questions Section - Sequential Script Format (like PDF) */}
                        {sequentialConversation.length > 0 ? (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="qa-section-divider" style={{ marginBottom: '20px' }}>
                              <h5 className="qa-section-label">Technical Questions</h5>
                            </div>
                            <div style={{ 
                              backgroundColor: '#f9f9f9', 
                              padding: '20px', 
                              borderRadius: '8px',
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              lineHeight: '1.8',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word'
                            }}>
                              {sequentialConversation.map((msg, index) => (
                                <div key={`msg-${index}`} style={{ marginBottom: '12px' }}>
                                  <div style={{ 
                                    marginBottom: '6px', 
                                    fontWeight: '600', 
                                    color: msg.role === 'interviewer' ? '#2196F3' : '#4CAF50'
                                  }}>
                                    {msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}:
                                  </div>
                                  <div style={{ 
                                    marginBottom: '12px', 
                                    paddingLeft: '15px', 
                                    color: '#333' 
                                  }}>
                                    {msg.text || (msg.role === 'candidate' ? 'No answer provided' : '')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : technicalQuestions.length > 0 ? (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="qa-section-divider" style={{ marginBottom: '20px' }}>
                              <h5 className="qa-section-label">Technical Questions</h5>
                            </div>
                            <div style={{ 
                              backgroundColor: '#f9f9f9', 
                              padding: '20px', 
                              borderRadius: '8px',
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              lineHeight: '1.8',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word'
                            }}>
                            {technicalQuestions.map((qa, index) => (
                                <div key={qa.id || `tech-${index}`} style={{ marginBottom: '15px' }}>
                                  <div style={{ marginBottom: '8px', fontWeight: '600', color: '#2196F3' }}>
                                    Interviewer:
                                  </div>
                                  <div style={{ marginBottom: '12px', paddingLeft: '15px', color: '#333' }}>
                                    {qa.question_text}
                                  </div>
                                  <div style={{ marginBottom: '8px', fontWeight: '600', color: '#4CAF50' }}>
                                    Candidate:
                                  </div>
                                  <div style={{ marginBottom: '15px', paddingLeft: '15px', color: '#333' }}>
                                      {qa.answer || 'No answer provided'}
                                    </div>
                                  {index < technicalQuestions.length - 1 && (
                                    <div style={{ 
                                      borderTop: '1px solid #e0e0e0', 
                                      marginTop: '15px', 
                                      marginBottom: '15px' 
                                    }}></div>
                                  )}
                                    </div>
                              ))}
                                </div>
                              </div>
                        ) : null}
                        
                        {/* Coding Questions Section - Continuous Script Format */}
                        {codingQuestions.length > 0 && (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="qa-section-divider" style={{ marginBottom: '20px' }}>
                              <h5 className="qa-section-label">Coding Questions</h5>
                            </div>
                            <div style={{ 
                              backgroundColor: '#f9f9f9', 
                              padding: '20px', 
                              borderRadius: '8px',
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              lineHeight: '1.8',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word'
                            }}>
                            {codingQuestions.map((qa, index) => (
                                <div key={qa.id || `coding-${index}`} style={{ marginBottom: '15px' }}>
                                  <div style={{ marginBottom: '8px', fontWeight: '600', color: '#2196F3' }}>
                                    Interviewer:
                                </div>
                                  <div style={{ marginBottom: '12px', paddingLeft: '15px', color: '#333' }}>
                                    {qa.question_text}
                                  </div>
                                  <div style={{ marginBottom: '8px', fontWeight: '600', color: '#4CAF50' }}>
                                    Candidate:
                                  </div>
                                  <div style={{ marginBottom: '15px', paddingLeft: '15px', color: '#333' }}>
                                    {qa.answer && qa.answer !== 'No code submitted' ? (
                                      <pre style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        padding: '12px', 
                                        borderRadius: '4px',
                                        overflow: 'auto',
                                        fontSize: '13px',
                                        margin: 0
                                      }}>
                                        {qa.answer}
                                      </pre>
                                    ) : (
                                      <span>{qa.answer || 'No code submitted'}</span>
                                    )}
                                  </div>
                                  {index < codingQuestions.length - 1 && (
                                    <div style={{ 
                                      borderTop: '1px solid #e0e0e0', 
                                      marginTop: '15px', 
                                      marginBottom: '15px' 
                                    }}></div>
                                  )}
                                    </div>
                              ))}
                                </div>
                              </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
              </div>
            ))
          ) : (
            <p className="no-data">No interviews scheduled</p>
          )}
        </div>
      </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={handleModalClose}
          onUpdateStatus={() => {
            // Refresh candidate data when status is updated
            dispatch(fetchCandidates());
          }}
          action={selectedAction}
          candidate={candidate}
          interviews={interviews}
          onSubmitEvaluation={handleEvaluationSubmit}
          onInterviewScheduled={() => {
            // Refresh both interview data and candidate data when interview is scheduled
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
          onEvaluationSubmitted={() => {
            // Refresh both interview data and candidate data when evaluation is submitted
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
        />
      )}

      {/* Edit Interview Modal */}
      {showEditInterviewModal && editingInterview && (
        <StatusUpdateModal
          isOpen={showEditInterviewModal}
          onClose={() => {
            setShowEditInterviewModal(false);
            setEditingInterview(null);
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
          action="schedule_interview"
          candidate={candidate}
          interviews={interviews}
          isEditMode={true}
          editingInterview={editingInterview}
        />
      )}

      {/* Edit Evaluation Modal */}
      {showEditEvaluationModal && editingEvaluation && (
        <StatusUpdateModal
          isOpen={showEditEvaluationModal}
          onClose={() => {
            setShowEditEvaluationModal(false);
            setEditingEvaluation(null);
            fetchInterviews();
            dispatch(fetchCandidates());
          }}
          action="evaluate"
          candidate={candidate}
          interviews={interviews}
          isEditMode={true}
          editingEvaluation={editingEvaluation}
        />
      )}

      {/* Delete Confirmation Modal - Matching DataTable Style */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{deleteType === 'interview' ? "Delete Interview" : "Delete Evaluation"}</h3>
            <p>
              {deleteType === 'interview' 
                ? "Are you sure you want to delete this interview? This will also release the slot and cannot be undone."
                : "Are you sure you want to delete this evaluation? This action cannot be undone."
              }
            </p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteType(null);
                  setItemToDelete(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={deleteType === 'interview' ? confirmDeleteInterview : confirmDeleteEvaluation} 
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateDetails;
