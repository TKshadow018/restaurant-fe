const fs = require('fs');
const path = require('path');

// Read the current menu file
const menuPath = path.join(__dirname, 'src', 'data', 'menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

const swedishItems = menuData.swedish;
const englishItems = menuData.english;

// Create merged items array
const mergedItems = [];

// Assuming items are in the same order in both arrays
for (let i = 0; i < swedishItems.length && i < englishItems.length; i++) {
  const swedishItem = swedishItems[i];
  const englishItem = englishItems[i];
  
  // Parse price string to create price array structure
  const parsePriceString = (priceStr) => {
    if (priceStr.includes('/')) {
      const prices = priceStr.replace(' SEK', '').split('/');
      return [
        { volume: "small", price: prices[0] },
        { volume: "medium", price: prices[1] },
        { volume: "large", price: prices[2] }
      ];
    } else {
      return [{ volume: "normal", price: priceStr.replace(' SEK', '') }];
    }
  };
  
  const mergedItem = {
    available: swedishItem.available,
    category: englishItem.category, // Use English category
    createdAt: swedishItem.createdAt,
    image: swedishItem.image,
    name: {
      swedish: swedishItem.name,
      english: englishItem.name
    },
    description: {
      swedish: swedishItem.description,
      english: englishItem.description
    },
    price: parsePriceString(swedishItem.price),
    subCategory: englishItem.subCategory, // Use English subCategory
    updatedAt: swedishItem.updatedAt
  };
  
  mergedItems.push(mergedItem);
}

// Create the new menu structure
const newMenuData = mergedItems;

// Write the merged menu to a new file
const outputPath = path.join(__dirname, 'src', 'data', 'menu-merged.json');
fs.writeFileSync(outputPath, JSON.stringify(newMenuData, null, 2));

console.log(`Merged menu created with ${mergedItems.length} items`);
console.log('Output saved to:', outputPath);
