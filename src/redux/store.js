// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './reducers/searchReducer';
import candidatesReducer from './slices/candidatesSlice';
import jobsReducer from './slices/jobsSlice';
import userReducer from './slices/userSlice';
import companiesReducer from './slices/companiesSlice';
import hiringAgenciesReducer from './slices/hiringAgenciesSlice';
import recruitersReducer from './slices/recruitersSlice';
import adminReducer from './slices/adminSlice';
import dashboardReducer from './slices/dashboardSlice'; // Import the new dashboard slice

const store = configureStore({
  reducer: {
    search: searchReducer,
    candidates: candidatesReducer,
    jobs: jobsReducer,
    user: userReducer,
    dashboard: dashboardReducer, // Add the dashboard reducer
    companies: companiesReducer,
    hiringAgencies: hiringAgenciesReducer,
    recruiters: recruitersReducer,
    admin: adminReducer,
  },
});

export default store;
