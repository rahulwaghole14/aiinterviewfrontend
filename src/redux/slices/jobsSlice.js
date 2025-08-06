// src/redux/slices/jobsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { baseURL } from '../../data'; // Assuming baseURL is defined here

// Async Thunk for fetching jobs
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (_, { rejectWithValue }) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return rejectWithValue('Authentication token not found.');
      }

      const response = await fetch(`${baseURL}/api/jobs/`, {
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
      // Map API data to match existing structure or extend it
      const formattedJobs = data.map(job => ({
        id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        domain: job.domain, // This will be the domain ID
        spoc_email: job.spoc_email,
        hiring_manager_email: job.hiring_manager_email,
        current_team_size_info: job.current_team_size_info,
        number_to_hire: job.number_to_hire,
        position_level: job.position_level,
        current_process: job.current_process,
        tech_stack_details: job.tech_stack_details,
        jd_file: job.jd_file,
        jd_link: job.jd_link,
        created_at: job.created_at,
      }));
      return formattedJobs;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunk for fetching domains
export const fetchDomains = createAsyncThunk(
  'jobs/fetchDomains',
  async (_, { rejectWithValue }) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return rejectWithValue('Authentication token not found.');
      }

      const response = await fetch(`${baseURL}/api/jobs/domains/`, {
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
      return data;
    } catch (error) {
      console.error("Error fetching domains:", error);
      return rejectWithValue(error.message);
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    allJobs: [],
    domains: [],
    jobsStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    domainsStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    jobsError: null,
    domainsError: null,
  },
  reducers: {
    setJobs: (state, action) => {
      state.allJobs = action.payload;
    },
    addJob: (state, action) => {
      if (!Array.isArray(state.allJobs)) {
        state.allJobs = [];
      }
      state.allJobs.push(action.payload);
    },
    updateJob: (state, action) => {
      const { id, updatedData } = action.payload;
      const jobIndex = state.allJobs.findIndex(job => job.id === id);
      if (jobIndex !== -1) {
        state.allJobs[jobIndex] = { ...state.allJobs[jobIndex], ...updatedData };
      }
    },
    deleteJob: (state, action) => {
      const idToDelete = action.payload;
      state.allJobs = state.allJobs.filter(job => job.id !== idToDelete);
    },
    setDomains: (state, action) => { // New reducer to set domains
      state.domains = action.payload;
    },
    addDomain: (state, action) => { // New reducer to add a single domain
      state.domains.push(action.payload);
    },
    updateDomain: (state, action) => { // New reducer to update a domain
      const { id, updatedData } = action.payload;
      const domainIndex = state.domains.findIndex(domain => domain.id === id);
      if (domainIndex !== -1) {
        state.domains[domainIndex] = { ...state.domains[domainIndex], ...updatedData };
      }
    },
    deleteDomain: (state, action) => { // New reducer to delete a domain
      const idToDelete = action.payload;
      state.domains = state.domains.filter(domain => domain.id !== idToDelete);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.jobsStatus = 'loading';
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.jobsStatus = 'succeeded';
        state.allJobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.jobsStatus = 'failed';
        state.jobsError = action.payload;
      })
      .addCase(fetchDomains.pending, (state) => {
        state.domainsStatus = 'loading';
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.domainsStatus = 'succeeded';
        state.domains = action.payload;
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.domainsStatus = 'failed';
        state.domainsError = action.payload;
      });
  },
});

export const { setJobs, addJob, updateJob, deleteJob, setDomains, addDomain, updateDomain, deleteDomain } = jobsSlice.actions;
export default jobsSlice.reducer;
