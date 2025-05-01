import { createContext, useState, useContext, useEffect } from 'react';

const CompareContext = createContext();

export const MAX_COMPARE_ITEMS = 3;

export const CompareProvider = ({ children }) => {
  const [compareItems, setCompareItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('compareItems');
    if (savedItems) {
      try {
        setCompareItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Failed to parse compare items from localStorage:', error);
        localStorage.removeItem('compareItems');
      }
    }
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    localStorage.setItem('compareItems', JSON.stringify(compareItems));
  }, [compareItems]);

  const addCompareItem = (food) => {
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      return false;
    }
    
    // Check if item already exists
    if (compareItems.some(item => item.fdcId === food.fdcId)) {
      return false;
    }
    
    setCompareItems([...compareItems, food]);
    return true;
  };

  const removeCompareItem = (fdcId) => {
    setCompareItems(compareItems.filter(item => item.fdcId !== fdcId));
  };

  const clearCompareItems = () => {
    setCompareItems([]);
  };

  const isInCompare = (fdcId) => {
    return compareItems.some(item => item.fdcId === fdcId);
  };

  const value = {
    compareItems,
    addCompareItem,
    removeCompareItem,
    clearCompareItems,
    isInCompare
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  return useContext(CompareContext);
}; 