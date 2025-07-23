// src/redux/slices/candidatesSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { initialCandidates } from '../../data'; // Import initial data

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState: {
    allCandidates: initialCandidates,
  },
  reducers: {
    addCandidate: (state, action) => {
      state.allCandidates.push(action.payload);
    },
    updateCandidateStatus: (state, action) => {
      const { id, newStatus } = action.payload;
      const candidate = state.allCandidates.find(c => c.id === id);
      if (candidate) {
        candidate.status = newStatus;
        candidate.lastUpdated = new Date().toISOString().slice(0, 10); // Update last updated date
      }
    },
    deleteCandidate: (state, action) => {
      const id = action.payload;
      state.allCandidates = state.allCandidates.filter(c => c.id !== id);
    },
    // You can add more reducers here if needed
  },
});

export const { addCandidate, updateCandidateStatus, deleteCandidate } = candidatesSlice.actions;
export default candidatesSlice.reducer;
