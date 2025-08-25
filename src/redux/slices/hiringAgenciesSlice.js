// src/redux/slices/hiringAgenciesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { baseURL } from '../../data';

// Async thunk to fetch hiring agencies
export const fetchHiringAgencies = createAsyncThunk(
  'hiringAgencies/fetchHiringAgencies',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      console.log('Current user data:', userData);
      console.log('Auth token exists:', !!token);
      
      if (!token) {
        console.error('No authentication token found');
        return rejectWithValue('Authentication required');
      }

      console.log('Fetching hiring agencies from:', `${baseURL}/api/hiring_agency/`);
      
      const response = await fetch(`${baseURL}/api/hiring_agency/`, {  
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Error response from API:', {
          status: response.status,
          statusText: response.statusText,
          responseData,
          headers: Object.fromEntries(response.headers.entries())
        });
        return rejectWithValue(responseData.detail || 'Failed to fetch hiring agencies');
      }

      console.log('Successfully fetched hiring agencies:', responseData);
      return Array.isArray(responseData) 
        ? responseData.map(agency => ({ ...agency, userType: 'Hiring Agency' })) 
        : [];
    } catch (error) {
      console.error('Exception in fetchHiringAgencies:', error);
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

const hiringAgenciesSlice = createSlice({
  name: 'hiringAgencies',
  initialState: {
    hiringAgencies: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHiringAgencies.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHiringAgencies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hiringAgencies = action.payload || [];
      })
      .addCase(fetchHiringAgencies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load hiring agencies';
        console.error('Redux state error:', state.error);
      });
  },
});

export default hiringAgenciesSlice.reducer;
