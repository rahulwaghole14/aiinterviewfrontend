// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './reducers/searchReducer';
import candidatesReducer from './slices/candidatesSlice';
import clientsReducer from './slices/clientsSlice';
import jobsReducer from './slices/jobsSlice';
import userReducer from './slices/userSlice'; // Import the new user slice

const store = configureStore({
  reducer: {
    search: searchReducer,
    candidates: candidatesReducer,
    clients: clientsReducer,
    jobs: jobsReducer,
    user: userReducer, // Add the user reducer
  },
});

export default store;

