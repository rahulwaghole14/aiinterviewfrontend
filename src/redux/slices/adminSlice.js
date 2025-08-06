// src/redux/slices/adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Dummy data for admin users
const dummyAdmins = [
  { id: 'admin1', name: 'Admin User 1', contactPerson: 'Super Admin', email: 'admin1@example.com', phone: '123-000-1111', status: 'Active', userType: 'Admin', lastUpdated: '2023-11-01' },
  { id: 'admin2', name: 'Admin User 2', contactPerson: 'System Admin', email: 'admin2@example.com', phone: '123-000-2222', status: 'Active', userType: 'Admin', lastUpdated: '2023-11-05' },
];

// Async thunk to "fetch" admin users (using dummy data)
export const fetchAdmins = createAsyncThunk(
  'admin/fetchAdmins',
  async (_, { rejectWithValue }) => {
    // Simulate an API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return dummyAdmins;
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    admins: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmins.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.admins = action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default adminSlice.reducer;
