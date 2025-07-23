// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './reducers/searchReducer';
import candidatesReducer from './slices/candidatesSlice';
import interviewsReducer from './slices/interviewsSlice';
import clientsReducer from './slices/clientsSlice';
import jobsReducer from './slices/jobsSlice'; // Import the new jobs slice

const store = configureStore({
  reducer: {
    search: searchReducer,
    candidates: candidatesReducer,
    interviews: interviewsReducer,
    clients: clientsReducer,
    jobs: jobsReducer, // Add the jobs reducer
  },
});

export default store; // Export as default
