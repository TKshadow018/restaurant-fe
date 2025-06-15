import { createSelector } from '@reduxjs/toolkit';

const selectMenuState = (state) => state.menu;

export const selectFilteredMenuItems = createSelector(
  [selectMenuState],
  (menuState) => {
    const { menuItems, searchTerm, filterCategory, filterAvailability } = menuState;
    
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesAvailability =
        filterAvailability === 'all' ||
        (filterAvailability === 'available' && item.available) ||
        (filterAvailability === 'unavailable' && !item.available);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }
);

export const selectMenuCategories = createSelector(
  [selectMenuState],
  (menuState) => {
    const categories = ['All'];
    const uniqueCategories = [...new Set(menuState.menuItems.map(item => item.category))];
    return categories.concat(uniqueCategories.filter(cat => cat)); // Remove empty categories
  }
);