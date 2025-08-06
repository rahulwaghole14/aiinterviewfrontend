// src/redux/slices/recruitersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { baseURL } from '../../data';

// Async thunk to fetch recruiters
export const fetchRecruiters = createAsyncThunk(
  'recruiters/fetchRecruiters',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/api/companies/recruiters/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`, // Use auth token
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      // Add a userType field for consistent filtering in HiringAgency.jsx
      return data.map(recruiter => ({ ...recruiter, userType: 'Recruiter' }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const recruitersSlice = createSlice({
  name: 'recruiters',
  initialState: {
    recruiters: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecruiters.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecruiters.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.recruiters = action.payload;
      })
      .addCase(fetchRecruiters.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default recruitersSlice.reducer;
