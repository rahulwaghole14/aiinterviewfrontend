// src/redux/slices/clientsSlice.js
import { createSlice } from '@reduxjs/toolkit'; // Import initial client data

const clientsSlice = createSlice({
  name: 'clients',
  initialState: {
    allClients: [],
  },
  reducers: {
    // Add reducers for clients if needed (e.g., addClient, updateClientStatus)
  },
});

export const { } = clientsSlice.actions; // No actions yet, but ready for future
export default clientsSlice.reducer;
