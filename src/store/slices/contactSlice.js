import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Async thunk for fetching contact info
export const fetchContactInfo = createAsyncThunk(
  'contact/fetchContactInfo',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'contacts'));
      
      if (querySnapshot.docs.length > 0) {
        const contactData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        };
        return contactData;
      } else {
        // Return default contact info if no data found
        return {
          name: "Shah's Eatery",
          address: "Övre Husargatan 25B, 413 14, Göteborg, Sverige",
          phone: "+46734770107",
          email: "shahseatery@gmail.com",
          businessHours:
            "Monday - Friday: 11:00 AM - 10:00 PM\nSaturday: 12:00 PM - 11:00 PM\nSunday: 12:00 PM - 9:00 PM",
          socialMedia: {
            facebook: "",
            instagram: "",
            twitter: "",
          },
        };
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  contactInfo: null,
  loading: false,
  error: null,
  lastFetched: null,
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    setContactInfo: (state, action) => {
      state.contactInfo = action.payload;
      state.lastFetched = Date.now();
    },
    clearError: (state) => {
      state.error = null;
    },
    updateContactInfo: (state, action) => {
      if (state.contactInfo) {
        state.contactInfo = { ...state.contactInfo, ...action.payload };
      }
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
        state.contactInfo = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchContactInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Set default contact info on error
        state.contactInfo = {
          name: "Shah's Eatery",
          address: "Övre Husargatan 25B, 413 14, Göteborg, Sverige",
          phone: "+46734770107",
          email: process.env.REACT_APP_CONTACT_EMAIL || "",
          businessHours:
            "Monday - Friday: 11:00 AM - 10:00 PM\nSaturday: 12:00 PM - 11:00 PM\nSunday: 12:00 PM - 9:00 PM",
          socialMedia: {
            facebook: "",
            instagram: "",
            twitter: "",
          },
        };
      });
  },
});

export const { setContactInfo, clearError, updateContactInfo } = contactSlice.actions;
export default contactSlice.reducer;