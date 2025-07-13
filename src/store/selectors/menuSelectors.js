import { createSelector } from '@reduxjs/toolkit';

const selectMenuState = (state) => state.menu;

export const selectFilteredMenuItems = createSelector(
  [selectMenuState],
  (menuState) => {
    const { menuItems, searchTerm, filterCategory, filterAvailability } = menuState;
    
    return menuItems.filter((item) => {
      // Handle multilingual search
      const getSearchableText = (textObj) => {
        if (typeof textObj === 'string') return textObj;
        if (!textObj) return '';
        return `${textObj.swedish || ''} ${textObj.english || ''}`;
      };

      const searchableContent = `${getSearchableText(item.name)} ${getSearchableText(item.description)}`;
      const matchesSearch = searchableContent.toLowerCase().includes(searchTerm.toLowerCase());
      
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