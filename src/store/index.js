import { configureStore } from '@reduxjs/toolkit';
import contactReducer from '@/store/slices/contactSlice';
import menuReducer from '@/store/slices/menuSlice';
import CampaignReducer from '@/store/slices/campaignSlice';

export const store = configureStore({
    reducer: {
        contact: contactReducer,
        menu: menuReducer,
        campaigns: CampaignReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'contact/setContactInfo',
                    'menu/setMenuItems',
                    'menu/fetchMenuItems/fulfilled'
                ],
                ignoredPaths: [
                    'contact.contactInfo.createdAt',
                    'contact.contactInfo.updatedAt',
                    'menu.menuItems.createdAt',
                    'menu.menuItems.updatedAt'
                ],
            },
        }),
});
