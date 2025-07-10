import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./slices/menuSlice";
import campaignReducer from "./slices/campaignSlice";
import contactReducer from "./slices/contactSlice";
import categoryReducer from "./slices/categorySlice"; // Import the new reducer

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    campaigns: campaignReducer,
    contact: contactReducer,
    categories: categoryReducer, // Add the new reducer here
  },
});