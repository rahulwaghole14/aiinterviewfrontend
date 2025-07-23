// src/redux/slices/jobsSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { initialJobs } from '../../data'; // Import initial job data

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    allJobs: initialJobs,
  },
  reducers: {
    addJob: (state, action) => {
      // Ensure state.allJobs is an array before pushing
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
    // Add other reducers if needed
  },
});

export const { addJob, updateJob, deleteJob } = jobsSlice.actions;
export default jobsSlice.reducer;
