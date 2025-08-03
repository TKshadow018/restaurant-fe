import { configureStore } from '@reduxjs/toolkit';
import contactReducer from '@/store/slices/contactSlice';
import menuReducer from '@/store/slices/menuSlice';
import CampaignReducer from '@/store/slices/campaignSlice';
import categoryReducer from '@/store/slices/categorySlice';
import adminReducer from '@/store/slices/adminSlice';

export const store = configureStore({
    reducer: {
        contact: contactReducer,
        menu: menuReducer,
        campaigns: CampaignReducer,
        categories: categoryReducer,
        admin: adminReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'contact/setContactInfo',
                    'menu/setMenuItems',
                    'menu/fetchMenuItems/fulfilled',
                    'admin/fetchUsers/fulfilled',
                    'admin/fetchOrders/fulfilled',
                    'admin/fetchFoods/fulfilled'
                ],
                ignoredPaths: [
                    'contact.contactInfo.createdAt',
                    'contact.contactInfo.updatedAt',
                    'menu.menuItems.createdAt',
                    'menu.menuItems.updatedAt',
                    'admin.users.items.createdAt',
                    'admin.users.items.joinedAt',
                    'admin.users.items.lastLogin',
                    'admin.orders.items.createdAt',
                    'admin.orders.items.updatedAt',
                    'admin.foods.items.createdAt',
                    'admin.foods.items.updatedAt'
                ],
            },
        }),
});
