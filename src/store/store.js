import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./slices/menuSlice";
import campaignReducer from "./slices/campaignSlice";
import contactReducer from "./slices/contactSlice";
import categoryReducer from "./slices/categorySlice";
import adminReducer from "./slices/adminSlice";

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    campaigns: campaignReducer,
    contact: contactReducer,
    categories: categoryReducer,
    admin: adminReducer,
  },
});