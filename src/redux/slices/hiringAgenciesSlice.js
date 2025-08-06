// src/redux/slices/hiringAgenciesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { baseURL } from '../../data';

// Async thunk to fetch hiring agencies
export const fetchHiringAgencies = createAsyncThunk(
  'hiringAgencies/fetchHiringAgencies',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/api/hiring_agency/`, {
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
      return data.map(agency => ({ ...agency, userType: 'Hiring Agency' }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const hiringAgenciesSlice = createSlice({
  name: 'hiringAgencies',
  initialState: {
    hiringAgencies: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHiringAgencies.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchHiringAgencies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hiringAgencies = action.payload;
      })
      .addCase(fetchHiringAgencies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default hiringAgenciesSlice.reducer;
