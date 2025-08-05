// src/redux/slices/interviewsSlice.js
import { createSlice } from '@reduxjs/toolkit'; // Import initial data

const interviewsSlice = createSlice({
  name: 'interviews',
  initialState: {
    allInterviews: [],
  },
  reducers: {
    addInterview: (state, action) => {
      state.allInterviews.push(action.payload);
    },
    updateInterviewStatus: (state, action) => {
      const { id, newStatus } = action.payload;
      const interview = state.allInterviews.find(i => i.id === id);
      if (interview) {
        interview.status = newStatus;
      }
    },
    // Add other reducers if needed, e.g., deleteInterview, editInterview
  },
});

export const { addInterview, updateInterviewStatus } = interviewsSlice.actions;
export default interviewsSlice.reducer;
