import React, { createContext, useContext, useState } from 'react';

const FoodContext = createContext();

export const FoodProvider = ({ children }) => {
  const [foods, setFoods] = useState([]);

  const addFood = (food) => {
    setFoods(prev => [...prev, food]);
  };

  const updateFood = (id, updatedFood) => {
    setFoods(prev => prev.map(food => 
      food.id === id ? { ...food, ...updatedFood } : food
    ));
  };

  const deleteFood = (id) => {
    setFoods(prev => prev.filter(food => food.id !== id));
  };

  return (
    <FoodContext.Provider value={{
      foods,
      setFoods, // Add this line
      addFood,
      updateFood,
      deleteFood
    }}>
      {children}
    </FoodContext.Provider>
  );
};

export const useFood = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
};