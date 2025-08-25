// src/redux/slices/candidatesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { baseURL } from '../../data'; // Assuming baseURL is defined here

// Async Thunk for fetching candidates
export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async (_, { rejectWithValue, getState }) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return rejectWithValue('Authentication token not found. Please log in.');
      }

      const response = await fetch(`${baseURL}/api/candidates/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const allJobs = getState().jobs.allJobs; // Get all jobs from jobs slice for mapping

      // Filter candidates based on user role and company/email (if user data is available)
      const loggedInUser = getState().user.user;
      let fetchedCandidates = data;

      if (loggedInUser) {
        const userRole = loggedInUser.role;
        const userEmail = loggedInUser.email;
        const userCompany = loggedInUser.company_name;

        if (userRole === 'COMPANY') {
          fetchedCandidates = fetchedCandidates.filter(candidate => {
            // Handle type consistency when comparing job IDs
            const job = allJobs.find(j => String(j.id) === String(candidate.job_title));
            return job && job.company_name === userCompany;
          });
        } else if (userRole === 'HIRING_AGENCY' || userRole === 'RECRUITER') {
          fetchedCandidates = fetchedCandidates.filter(candidate => candidate.poc_email === userEmail);
        }
      }

      // Format the candidates data for consistency with frontend
      const formattedCandidates = fetchedCandidates.map(candidate => ({
        id: candidate.id,
        name: candidate.full_name || '-',
        email: candidate.email || '-',
        phone: candidate.phone_number || '-',
        domain: candidate.domain || '-', // This is the domain ID
        jobRole: candidate.job_title || '-', // This is the job ID
        poc: candidate.poc_email || '-',
        workExperience: candidate.experience_years || 0,
        status: candidate.status || 'NEW',
        lastUpdated: candidate.last_updated,
        applicationDate: candidate.created_at,
        resumes: candidate.resume_file ? [{ name: candidate.resume_file.split('/').pop(), url: candidate.resume_file }] : [],
        interviewDetails: candidate.interview_details || null,
        evaluation: candidate.evaluation_details || null,
        aptitude: candidate.aptitude_details || null,
        brChats: candidate.br_chats || [],
      }));
      return formattedCandidates;
    } catch (error) {
      console.error("Error fetching candidates:", error);
      return rejectWithValue(error.message);
    }
  }
);

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState: {
    allCandidates: [],
    candidatesStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    candidatesError: null,
  },
  reducers: {
    addCandidate: (state, action) => {
      if (!Array.isArray(state.allCandidates)) {
        state.allCandidates = [];
      }
      state.allCandidates.push(action.payload);
    },
    updateCandidateStatus: (state, action) => {
      const { id, newStatus, updatedData } = action.payload;
      const candidate = (state.allCandidates || []).find(c => c.id === id);
      if (candidate) {
        candidate.status = newStatus;
        candidate.lastUpdated = new Date().toISOString().slice(0, 10);

        if (updatedData) {
          Object.assign(candidate, updatedData);
        }
      }
    },
    deleteCandidate: (state, action) => {
      const idToDelete = action.payload;
      state.allCandidates = (state.allCandidates || []).filter(candidate => candidate.id !== idToDelete);
    },
    updateCandidate: (state, action) => {
      const { id, updatedData } = action.payload;
      const index = (state.allCandidates || []).findIndex(c => c.id === id);
      if (index !== -1) {
        state.allCandidates[index] = { ...state.allCandidates[index], ...updatedData };
      }
    },
    setCandidates: (state, action) => {
      state.allCandidates = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.candidatesStatus = 'loading';
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.candidatesStatus = 'succeeded';
        state.allCandidates = action.payload;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.candidatesStatus = 'failed';
        state.candidatesError = action.payload;
      });
  },
});

export const { addCandidate, updateCandidateStatus, deleteCandidate, updateCandidate, setCandidates } = candidatesSlice.actions;
export default candidatesSlice.reducer;
