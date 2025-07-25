// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './reducers/searchReducer';
import candidatesReducer from './slices/candidatesSlice';
// Removed interviewsReducer as interview data is now part of candidates
import clientsReducer from './slices/clientsSlice';
import jobsReducer from './slices/jobsSlice'; // Import the new jobs slice

const store = configureStore({
  reducer: {
    search: searchReducer,
    candidates: candidatesReducer,
    // Removed interviews reducer
    clients: clientsReducer,
    jobs: jobsReducer, // Add the jobs reducer
  },
});

export default store; // Export as default
