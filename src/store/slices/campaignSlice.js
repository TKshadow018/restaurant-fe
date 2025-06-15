import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const fetchCampaigns = createAsyncThunk('campaigns/fetchCampaigns', async () => {
  const snapshot = await getDocs(collection(db, 'campaigns'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default campaignSlice.reducer;