import { format, parseISO, isValid, eachDayOfInterval } from 'date-fns';
import { CALORIE_FACTORS, NUTRIENT_METADATA } from './nutrientUtils';

/**
 * Calculates daily average or total for a nutrient across log entries
 * @param {Array} logs - Array of food logs
 * @param {string} nutrientId - ID of the nutrient to calculate
 * @param {string} logType - Type of logs to include ('consumed', 'avoided', 'prepped')
 * @param {Date} startDate - Start date for calculation
 * @param {Date} endDate - End date for calculation
 * @param {boolean} showTotal - Whether to show total or daily average (default: false)
 * @returns {number} Average daily or total intake
 */
export const calculateDailyAverage = (logs, nutrientId, logType = 'consumed', startDate, endDate, showTotal = true) => {
  // Filter logs by type
  const filteredLogs = logs.filter(log => log.logType === logType);
  
  if (!filteredLogs.length) return 0;
  
  // Calculate days in range
  let daysCount = 1;
  if (!showTotal && startDate && endDate) {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (isValid(start) && isValid(end)) {
      const days = eachDayOfInterval({ start, end });
      daysCount = days.length;
    }
  }
  
  // Sum up nutrient values
  const total = filteredLogs.reduce((sum, log) => {
    // Marking valueFound with underscore since it's used mainly for debugging
    let _valueFound = false;
    let valueAdded = 0;
    
    // First try direct properties on the log object itself
    // This ensures backward compatibility
    if (nutrientId === '1008' && log.calories !== undefined) {
      valueAdded = parseFloat(log.calories) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1003' && log.protein !== undefined) {
      valueAdded = parseFloat(log.protein) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1004' && log.fat !== undefined) {
      valueAdded = parseFloat(log.fat) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1005' && log.carbs !== undefined) {
      valueAdded = parseFloat(log.carbs) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    
    // Check minerals in direct properties
    if (nutrientId === '1087' && log.calcium !== undefined) {
      valueAdded = parseFloat(log.calcium) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1089' && log.iron !== undefined) {
      valueAdded = parseFloat(log.iron) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1090' && log.magnesium !== undefined) {
      valueAdded = parseFloat(log.magnesium) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1091' && log.phosphorus !== undefined) {
      valueAdded = parseFloat(log.phosphorus) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1092' && log.potassium !== undefined) {
      valueAdded = parseFloat(log.potassium) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1093' && log.sodium !== undefined) {
      valueAdded = parseFloat(log.sodium) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1095' && log.zinc !== undefined) {
      valueAdded = parseFloat(log.zinc) || 0;
      _valueFound = true;
      return sum + valueAdded;
    }
    
    // Check for nutrient in the nutrients map
    if (log.nutrients) {
      // Direct match with object value structure - using string key
      const strId = nutrientId.toString();
      
      if (log.nutrients[strId]) {
        if (typeof log.nutrients[strId] === 'object' && log.nutrients[strId].value !== undefined) {
          valueAdded = parseFloat(log.nutrients[strId].value) || 0;
          _valueFound = true;
          return sum + valueAdded;
        } else if (typeof log.nutrients[strId] !== 'object') {
          // Direct match with scalar value
          valueAdded = parseFloat(log.nutrients[strId]) || 0;
          _valueFound = true;
          return sum + valueAdded;
        }
      }
      
      // Try with number key just in case
      const numId = parseInt(nutrientId);
      if (log.nutrients[numId]) {
        if (typeof log.nutrients[numId] === 'object' && log.nutrients[numId].value !== undefined) {
          valueAdded = parseFloat(log.nutrients[numId].value) || 0;
          _valueFound = true;
          return sum + valueAdded;
        } else if (typeof log.nutrients[numId] !== 'object') {
          valueAdded = parseFloat(log.nutrients[numId]) || 0;
          _valueFound = true;
          return sum + valueAdded;
        }
      }
      
      // Try to find the nutrient in a different format
      for (const [_key, value] of Object.entries(log.nutrients)) {
        // Match by nutrient ID in object
        if (value && typeof value === 'object') {
          if (value.id === strId || value.id === numId) {
            valueAdded = parseFloat(value.value || value.amount) || 0;
            _valueFound = true;
            return sum + valueAdded;
          }
          
          // Match by nutrient name
          const metadata = NUTRIENT_METADATA[numId];
          if (metadata && value.name === metadata.name) {
            valueAdded = parseFloat(value.value || value.amount) || 0;
            _valueFound = true;
            return sum + valueAdded;
          }
        }
      }
    }
    
    // Check if there's a nutrientsArray (legacy format)
    if (Array.isArray(log.nutrientsArray)) {
      const nutrient = log.nutrientsArray.find(n => 
        n.id === nutrientId || n.id === parseInt(nutrientId) ||
        (n.name && NUTRIENT_METADATA[parseInt(nutrientId)] && n.name === NUTRIENT_METADATA[parseInt(nutrientId)].name)
      );
      
      if (nutrient) {
        valueAdded = parseFloat(nutrient.value || nutrient.amount) || 0;
        _valueFound = true;
        return sum + valueAdded;
      }
    }
    
    return sum;
  }, 0);
  // Return either the total or the daily average based on showTotal parameter
  return parseFloat((showTotal ? total : total / daysCount).toFixed(1));
};

/**
 * Calculates calorie breakdown from macronutrients
 * @param {Array} logs - Array of food logs
 * @param {string} logType - Type of logs to include
 * @returns {Object} Calorie breakdown by macronutrient
 */
export const getCalorieBreakdown = (logs, logType = 'consumed') => {
  const filteredLogs = logs.filter(log => log.logType === logType);
  
  if (!filteredLogs.length) {
    return { proteinPercent: 0, fatPercent: 0, carbsPercent: 0 };
  }
  
  let totalProtein = 0;
  let totalFat = 0; 
  let totalCarbs = 0;
  
  filteredLogs.forEach(log => {
    let proteinFound = false;
    let fatFound = false;
    let carbsFound = false;

    // Priority 1: Direct properties
    if (log.protein !== undefined) {
      totalProtein += parseFloat(log.protein) || 0;
      proteinFound = true;
    }
    if (log.fat !== undefined) {
      totalFat += parseFloat(log.fat) || 0;
      fatFound = true;
    }
    if (log.carbs !== undefined) {
      totalCarbs += parseFloat(log.carbs) || 0;
      carbsFound = true;
    }

    // Priority 2: Check for nutrient in the nutrients map
    if (log.nutrients) {
      // Protein (ID: 1003)
      if (!proteinFound && log.nutrients['1003']) {
        if (typeof log.nutrients['1003'] === 'object' && log.nutrients['1003'].value !== undefined) {
          totalProtein += parseFloat(log.nutrients['1003'].value) || 0;
        } else if (typeof log.nutrients['1003'] !== 'object') {
          totalProtein += parseFloat(log.nutrients['1003']) || 0;
        }
        proteinFound = true; // Mark as found even if value was 0 or unparseable
      }

      // Fat (ID: 1004)
      if (!fatFound && log.nutrients['1004']) {
         if (typeof log.nutrients['1004'] === 'object' && log.nutrients['1004'].value !== undefined) {
          totalFat += parseFloat(log.nutrients['1004'].value) || 0;
        } else if (typeof log.nutrients['1004'] !== 'object') {
          totalFat += parseFloat(log.nutrients['1004']) || 0;
        }
        fatFound = true;
      }

      // Carbs (ID: 1005)
      if (!carbsFound && log.nutrients['1005']) {
         if (typeof log.nutrients['1005'] === 'object' && log.nutrients['1005'].value !== undefined) {
          totalCarbs += parseFloat(log.nutrients['1005'].value) || 0;
        } else if (typeof log.nutrients['1005'] !== 'object') {
          totalCarbs += parseFloat(log.nutrients['1005']) || 0;
        }
        carbsFound = true;
      }
    }

    // Priority 3: Check nutrientsArray (legacy format)
     if (Array.isArray(log.nutrientsArray)) {
        if (!proteinFound) {
          const proteinNutrient = log.nutrientsArray.find(n => n.id === '1003' || n.id === 1003);
          if (proteinNutrient) {
            totalProtein += parseFloat(proteinNutrient.value || proteinNutrient.amount) || 0;
            proteinFound = true;
          }
        }
        if (!fatFound) {
           const fatNutrient = log.nutrientsArray.find(n => n.id === '1004' || n.id === 1004);
           if (fatNutrient) {
             totalFat += parseFloat(fatNutrient.value || fatNutrient.amount) || 0;
             fatFound = true;
           }
        }
        if (!carbsFound) {
          const carbNutrient = log.nutrientsArray.find(n => n.id === '1005' || n.id === 1005);
          if (carbNutrient) {
            totalCarbs += parseFloat(carbNutrient.value || carbNutrient.amount) || 0;
            carbsFound = true;
          }
        }
     }
  });
  
  // Calculate calories from each macronutrient
  const proteinCalories = totalProtein * CALORIE_FACTORS.Protein;
  const fatCalories = totalFat * CALORIE_FACTORS['Total Fat'];
  const carbCalories = totalCarbs * CALORIE_FACTORS.Carbohydrates;
  
  const totalCalories = proteinCalories + fatCalories + carbCalories;
  
  if (totalCalories === 0) {
    return { proteinPercent: 0, fatPercent: 0, carbsPercent: 0 };
  }
  
  return {
    proteinPercent: Math.round((proteinCalories / totalCalories) * 100),
    fatPercent: Math.round((fatCalories / totalCalories) * 100),
    carbsPercent: Math.round((carbCalories / totalCalories) * 100)
  };
};

/**
 * Groups logs by date for time series charts
 * @param {Array} logs - Array of food logs
 * @param {string} nutrientId - ID of the nutrient to track
 * @param {string} logType - Type of logs to include
 * @returns {Object} Object with dates and corresponding nutrient values
 */
export const getTimeSeriesData = (logs, nutrientId, logType = 'consumed') => {
  const filteredLogs = logs.filter(log => log.logType === logType);
  
  // Group logs by date
  const groupedByDate = filteredLogs.reduce((acc, log) => {
    const dateStr = format(new Date(log.logDate || log.date), 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(log);
    return acc;
  }, {});
  
  // Calculate daily totals
  const result = Object.keys(groupedByDate).map(date => {
    const dailyLogs = groupedByDate[date];
    
    // Sum nutrient value for the day
    let dailyValue = 0;
    dailyLogs.forEach(log => {
      let valueFound = false;
      let valueAdded = 0;

      // Priority 1: Direct properties on the log object itself
      const directPropValue = getDirectPropertyValue(log, nutrientId);
      if (directPropValue !== undefined) {
          valueAdded = parseFloat(directPropValue) || 0;
          valueFound = true;
      }

      // Priority 2: Check for nutrient in the nutrients map
      if (!valueFound && log.nutrients) {
          const strId = nutrientId.toString();
          const numId = parseInt(nutrientId);

          // Direct match with object value structure - using string key
          if (log.nutrients[strId]) {
              if (typeof log.nutrients[strId] === 'object' && log.nutrients[strId].value !== undefined) {
                  valueAdded = parseFloat(log.nutrients[strId].value) || 0;
                  valueFound = true;
              } else if (typeof log.nutrients[strId] !== 'object') {
                  // Direct match with scalar value
                  valueAdded = parseFloat(log.nutrients[strId]) || 0;
                  valueFound = true;
              }
          }

          // Try with number key if not found yet
          if (!valueFound && log.nutrients[numId]) {
              if (typeof log.nutrients[numId] === 'object' && log.nutrients[numId].value !== undefined) {
                  valueAdded = parseFloat(log.nutrients[numId].value) || 0;
                  valueFound = true;
              } else if (typeof log.nutrients[numId] !== 'object') {
                  valueAdded = parseFloat(log.nutrients[numId]) || 0;
                  valueFound = true;
              }
          }

          // Try to find the nutrient in a different format within map if not found yet
          if (!valueFound) {
              for (const [_key, value] of Object.entries(log.nutrients)) {
                  if (value && typeof value === 'object') {
                      // Match by nutrient ID in object
                      if (value.id === strId || value.id === numId) {
                          valueAdded = parseFloat(value.value || value.amount) || 0;
                          valueFound = true;
                          break; // Found it
                      }
                      // Match by nutrient name (assuming NUTRIENT_METADATA is available/imported)
                      // const metadata = NUTRIENT_METADATA[numId]; // Might need import
                      // if (metadata && value.name === metadata.name) {
                      //     valueAdded = parseFloat(value.value || value.amount) || 0;
                      //     valueFound = true;
                      //     break; // Found it
                      // }
                  }
              }
          }
      }

      // Priority 3: Check if there's a nutrientsArray (legacy format)
      if (!valueFound && Array.isArray(log.nutrientsArray)) {
          const nutrient = log.nutrientsArray.find(n =>
              n.id === nutrientId || n.id === parseInt(nutrientId)
              // (n.name && NUTRIENT_METADATA[parseInt(nutrientId)] && n.name === NUTRIENT_METADATA[parseInt(nutrientId)].name) // Name matching needs import
          );
          if (nutrient) {
              valueAdded = parseFloat(nutrient.value || nutrient.amount) || 0;
              valueFound = true;
          }
      }

      dailyValue += valueAdded; // Add the value found (or 0 if not found)
    });
    
    return {
      date,
      value: parseFloat(dailyValue.toFixed(1))
    };
  });
  
  // Sort by date
  return result.sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Extracts filter options from logs
 * @param {Array} logs - Array of food logs
 * @returns {Object} Filter options
 */
export const getFilterOptions = (logs) => {
  // Ensure logs is an array
  if (!logs || !Array.isArray(logs)) {
    return {
      brandOwners: [],
      brandNames: [],
      foodCategories: [],
      ingredients: []
    };
  }
  
  const options = {
    brandOwners: [],
    brandNames: [],
    foodCategories: [],
    ingredients: []
  };
  
  logs.forEach(log => {
    // Extract brand owners
    if (log.brandOwner && !options.brandOwners.includes(log.brandOwner)) {
      options.brandOwners.push(log.brandOwner);
    }
    
    // Extract brand names
    if (log.brandName && !options.brandNames.includes(log.brandName)) {
      options.brandNames.push(log.brandName);
    }
    
    // Extract food categories
    if (log.brandedFoodCategory && !options.foodCategories.includes(log.brandedFoodCategory)) {
      options.foodCategories.push(log.brandedFoodCategory);
    }
    
    // Extract ingredients (more complex)
    if (Array.isArray(log.parsedIngredients)) {
      log.parsedIngredients.forEach(ingredient => {
        if (!options.ingredients.includes(ingredient)) {
          options.ingredients.push(ingredient);
        }
      });
    } else if (log.ingredients) {
      // Simple approach - just extract words that are likely ingredients
      const words = log.ingredients.split(/[,;()[\]]/);
      words.forEach(word => {
        const trimmed = word.trim();
        if (trimmed.length > 3 && !options.ingredients.includes(trimmed)) {
          options.ingredients.push(trimmed);
        }
      });
    }
  });
  
  // Sort options alphabetically
  options.brandOwners.sort();
  options.brandNames.sort();
  options.foodCategories.sort();
  options.ingredients.sort();
  
  return options;
};

// Helper function to get direct property value based on nutrientId
const getDirectPropertyValue = (log, nutrientId) => {
    switch (nutrientId.toString()) {
        case '1008': return log.calories;
        case '1003': return log.protein;
        case '1004': return log.fat;
        case '1005': return log.carbs;
        case '1087': return log.calcium;
        case '1089': return log.iron;
        case '1090': return log.magnesium;
        case '1091': return log.phosphorus;
        case '1092': return log.potassium;
        case '1093': return log.sodium;
        case '1095': return log.zinc;
        // Add other direct properties if they exist
        default: return undefined;
    }
}; 