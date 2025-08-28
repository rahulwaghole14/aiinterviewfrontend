// src/redux/slices/companiesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { baseURL } from '../../data';

// Async thunk to fetch companies
export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Fetching companies with token:', token ? 'Token exists' : 'No token');
      console.log('API URL:', `${baseURL}/api/companies/`);
      
      const response = await fetch(`${baseURL}/api/companies/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`, // Use auth token
        },
      });

      console.log('Companies response status:', response.status);
      console.log('Companies response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Companies API Error:', errorData);
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      console.log('Companies API response:', data);
      
      // Add a userType field for consistent filtering in HiringAgency.jsx
      const mappedData = data.map(company => ({ ...company, userType: 'Company' }));
      console.log('Mapped companies data:', mappedData);
      return mappedData;
    } catch (error) {
      console.error('Exception in fetchCompanies:', error);
      return rejectWithValue(error.message);
    }
  }
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState: {
    companies: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default companiesSlice.reducer;
