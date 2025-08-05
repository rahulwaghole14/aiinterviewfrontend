// src/redux/slices/candidatesSlice.js
import { createSlice } from '@reduxjs/toolkit';// Import initial data

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState: {
    allCandidates: [], // Ensure it's an array even if initialCandidates is undefined
  },
  reducers: {
    addCandidate: (state, action) => {
      // Ensure state.allCandidates is an array before pushing
      if (!Array.isArray(state.allCandidates)) {
        state.allCandidates = [];
      }
      state.allCandidates.push(action.payload);
    },
    // Modified updateCandidateStatus to handle comprehensive updates
    updateCandidateStatus: (state, action) => {
      const { id, newStatus, updatedData } = action.payload;
      const candidate = (state.allCandidates || []).find(c => c.id === id); // Safety check
      if (candidate) {
        candidate.status = newStatus;
        candidate.lastUpdated = new Date().toISOString().slice(0, 10); // Update last updated date

        // Merge updatedData if provided (for interviewDetails, evaluation, aptitude etc.)
        if (updatedData) {
          // This will overwrite or add properties like interviewDetails or evaluation
          Object.assign(candidate, updatedData);
        }
      }
    },
    deleteCandidate: (state, action) => {
      // The action.payload is the ID of the candidate to delete
      state.allCandidates = (state.allCandidates || []).filter(candidate => candidate.id !== action.payload); // Safety check
    },
    updateCandidate: (state, action) => {
      const { id, updatedData } = action.payload;
      const index = (state.allCandidates || []).findIndex(c => c.id === id);
      if (index !== -1) {
        // Merge existing data with updatedData
        state.allCandidates[index] = { ...state.allCandidates[index], ...updatedData };
      }
    },
    setCandidates: (state, action) => { // New reducer to set all candidates
      state.allCandidates = action.payload;
    },
  },
});

export const { addCandidate, updateCandidateStatus, deleteCandidate, updateCandidate, setCandidates } = candidatesSlice.actions;
export default candidatesSlice.reducer;