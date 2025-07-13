import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Import 'doc' and 'getDoc' instead of collection/getDocs
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Async thunk for fetching contact info
export const fetchContactInfo = createAsyncThunk(
  'contact/fetchContactInfo',
  async (_, { rejectWithValue }) => {
    try {
      // Target the specific 'main' document, just like ContactManagement.js
      const docRef = doc(db, 'contacts', 'main');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const sanitizedData = {
          ...data,
          updatedAt: data.updatedAt?.toDate().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString(),
        };
        console.log('Fetched contact info:', sanitizedData);
        
        return { id: docSnap.id, ...sanitizedData };
      } else {
        // This will now correctly report that the specific 'main' document is missing.
        return rejectWithValue('The main contact document has not been created yet.');
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  info: null, // Use null to better check if data has been fetched
  loading: false,
  error: null,
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    setContactInfo: (state, action) => {
      state.info = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContactInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.info = action.payload;
      })
      .addCase(fetchContactInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export the newly created actions
export const { setContactInfo, clearError } = contactSlice.actions;

export default contactSlice.reducer;