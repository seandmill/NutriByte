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
  
  // Special debug for minerals - particularly calcium
  if (nutrientId === '1087') { // Calcium
    console.log(`----- Debug for Calcium (${nutrientId}) -----`);
    console.log(`Found ${filteredLogs.length} logs for type ${logType}`);
    
    filteredLogs.forEach((log, idx) => {
      console.log(`Log ${idx} nutrient keys:`, log.nutrients ? Object.keys(log.nutrients) : 'No nutrients object');
      
      if (log.nutrients) {
        // Log if we have calcium in this entry
        const hasDirectKey = Object.prototype.hasOwnProperty.call(log.nutrients, '1087');
        console.log(`Has direct calcium key: ${hasDirectKey}`);
        
        if (hasDirectKey) {
          console.log(`Calcium value:`, log.nutrients['1087']);
          console.log(`Calcium value type:`, typeof log.nutrients['1087']);
          
          if (typeof log.nutrients['1087'] === 'object') {
            console.log(`Calcium value.value:`, log.nutrients['1087'].value);
            console.log(`Calcium parsed value:`, parseFloat(log.nutrients['1087'].value));
          }
        }
      }
      
      // Also check for direct calcium property
      if (log.calcium !== undefined) {
        console.log(`Direct calcium property:`, log.calcium);
      }
    });
  }
  
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
  const total = filteredLogs.reduce((sum, log, idx) => {
    let valueFound = false;
    let valueAdded = 0;
    
    // First try direct properties on the log object itself
    // This ensures backward compatibility
    if (nutrientId === '1008' && log.calories !== undefined) {
      valueAdded = parseFloat(log.calories) || 0;
      valueFound = true;
      if (nutrientId === '1087') console.log(`Log ${idx}: Found via calories property: ${valueAdded}`);
      return sum + valueAdded;
    }
    if (nutrientId === '1003' && log.protein !== undefined) {
      valueAdded = parseFloat(log.protein) || 0;
      valueFound = true;
      if (nutrientId === '1087') console.log(`Log ${idx}: Found via protein property: ${valueAdded}`);
      return sum + valueAdded;
    }
    if (nutrientId === '1004' && log.fat !== undefined) {
      valueAdded = parseFloat(log.fat) || 0;
      valueFound = true;
      if (nutrientId === '1087') console.log(`Log ${idx}: Found via fat property: ${valueAdded}`);
      return sum + valueAdded;
    }
    if (nutrientId === '1005' && log.carbs !== undefined) {
      valueAdded = parseFloat(log.carbs) || 0;
      valueFound = true;
      if (nutrientId === '1087') console.log(`Log ${idx}: Found via carbs property: ${valueAdded}`);
      return sum + valueAdded;
    }
    
    // Check minerals in direct properties
    if (nutrientId === '1087' && log.calcium !== undefined) {
      valueAdded = parseFloat(log.calcium) || 0;
      valueFound = true;
      if (nutrientId === '1087') console.log(`Log ${idx}: Found via direct calcium property: ${valueAdded}`);
      return sum + valueAdded;
    }
    if (nutrientId === '1089' && log.iron !== undefined) {
      valueAdded = parseFloat(log.iron) || 0;
      valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1090' && log.magnesium !== undefined) {
      valueAdded = parseFloat(log.magnesium) || 0;
      valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1091' && log.phosphorus !== undefined) {
      valueAdded = parseFloat(log.phosphorus) || 0;
      valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1092' && log.potassium !== undefined) {
      valueAdded = parseFloat(log.potassium) || 0;
      valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1093' && log.sodium !== undefined) {
      valueAdded = parseFloat(log.sodium) || 0;
      valueFound = true;
      return sum + valueAdded;
    }
    if (nutrientId === '1095' && log.zinc !== undefined) {
      valueAdded = parseFloat(log.zinc) || 0;
      valueFound = true;
      return sum + valueAdded;
    }
    
    // Check for nutrient in the nutrients map
    if (log.nutrients) {
      // Direct match with object value structure - using string key
      const strId = nutrientId.toString();
      
      if (log.nutrients[strId]) {
        if (typeof log.nutrients[strId] === 'object' && log.nutrients[strId].value !== undefined) {
          valueAdded = parseFloat(log.nutrients[strId].value) || 0;
          valueFound = true;
          if (nutrientId === '1087') console.log(`Log ${idx}: Found via direct object access with string key: ${valueAdded}`);
          return sum + valueAdded;
        } else if (typeof log.nutrients[strId] !== 'object') {
          // Direct match with scalar value
          valueAdded = parseFloat(log.nutrients[strId]) || 0;
          valueFound = true;
          if (nutrientId === '1087') console.log(`Log ${idx}: Found via direct scalar access: ${valueAdded}`);
          return sum + valueAdded;
        }
      }
      
      // Try with number key just in case
      const numId = parseInt(nutrientId);
      if (log.nutrients[numId]) {
        if (typeof log.nutrients[numId] === 'object' && log.nutrients[numId].value !== undefined) {
          valueAdded = parseFloat(log.nutrients[numId].value) || 0;
          valueFound = true;
          if (nutrientId === '1087') console.log(`Log ${idx}: Found via direct object access with number key: ${valueAdded}`);
          return sum + valueAdded;
        } else if (typeof log.nutrients[numId] !== 'object') {
          valueAdded = parseFloat(log.nutrients[numId]) || 0;
          valueFound = true;
          if (nutrientId === '1087') console.log(`Log ${idx}: Found via direct scalar access with number key: ${valueAdded}`);
          return sum + valueAdded;
        }
      }
      
      // Try to find the nutrient in a different format
      for (const [_key, value] of Object.entries(log.nutrients)) {
        // Match by nutrient ID in object
        if (value && typeof value === 'object') {
          if (value.id === strId || value.id === numId) {
            valueAdded = parseFloat(value.value || value.amount) || 0;
            valueFound = true;
            if (nutrientId === '1087') console.log(`Log ${idx}: Found via object ID match: ${valueAdded}`);
            return sum + valueAdded;
          }
          
          // Match by nutrient name
          const metadata = NUTRIENT_METADATA[numId];
          if (metadata && value.name === metadata.name) {
            valueAdded = parseFloat(value.value || value.amount) || 0;
            valueFound = true;
            if (nutrientId === '1087') console.log(`Log ${idx}: Found via name match: ${valueAdded}`);
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
        valueFound = true;
        if (nutrientId === '1087') console.log(`Log ${idx}: Found via nutrientsArray: ${valueAdded}`);
        return sum + valueAdded;
      }
    }
    
    if (nutrientId === '1087' && !valueFound) {
      console.log(`Log ${idx}: No calcium value found in this log`);
    }
    
    return sum;
  }, 0);
  
  if (nutrientId === '1087') {
    console.log(`Total calcium: ${total}, days: ${daysCount}, daily average: ${parseFloat((total / daysCount).toFixed(1))}`);
  }
  
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
    // Check for nutrient in the nutrients map
    if (log.nutrients) {
      // Protein (ID: 1003)
      if (log.nutrients['1003']) {
        if (typeof log.nutrients['1003'] === 'object') {
          totalProtein += parseFloat(log.nutrients['1003'].value) || 0;
        } else {
          totalProtein += parseFloat(log.nutrients['1003']) || 0;
        }
      } else {
        totalProtein += log.protein || 0;
      }
      
      // Fat (ID: 1004)
      if (log.nutrients['1004']) {
        if (typeof log.nutrients['1004'] === 'object') {
          totalFat += parseFloat(log.nutrients['1004'].value) || 0;
        } else {
          totalFat += parseFloat(log.nutrients['1004']) || 0;
        }
      } else {
        totalFat += log.fat || 0;
      }
      
      // Carbs (ID: 1005)
      if (log.nutrients['1005']) {
        if (typeof log.nutrients['1005'] === 'object') {
          totalCarbs += parseFloat(log.nutrients['1005'].value) || 0;
        } else {
          totalCarbs += parseFloat(log.nutrients['1005']) || 0;
        }
      } else {
        totalCarbs += log.carbs || 0;
      }
    } else {
      // Fallback to specific nutrient fields
      totalProtein += log.protein || 0;
      totalFat += log.fat || 0;
      totalCarbs += log.carbs || 0;
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
      // Check for direct nutrient value in specific properties
      if (nutrientId === '1008' && log.calories !== undefined) {
        dailyValue += (parseFloat(log.calories) || 0);
        return;
      }
      if (nutrientId === '1003' && log.protein !== undefined) {
        dailyValue += (parseFloat(log.protein) || 0);
        return;
      }
      if (nutrientId === '1004' && log.fat !== undefined) {
        dailyValue += (parseFloat(log.fat) || 0);
        return;
      }
      if (nutrientId === '1005' && log.carbs !== undefined) {
        dailyValue += (parseFloat(log.carbs) || 0);
        return;
      }
      
      // Check for nutrient in the nutrients map
      if (log.nutrients) {
        // Direct match with object value structure
        if (log.nutrients[nutrientId] && typeof log.nutrients[nutrientId] === 'object' && log.nutrients[nutrientId].value !== undefined) {
          dailyValue += (parseFloat(log.nutrients[nutrientId].value) || 0);
          return;
        }
        
        // Direct match with scalar value
        if (log.nutrients[nutrientId] && typeof log.nutrients[nutrientId] !== 'object') {
          dailyValue += (parseFloat(log.nutrients[nutrientId]) || 0);
          return;
        }
        
        // Try to find the nutrient in a different format
        for (const [_, value] of Object.entries(log.nutrients)) {
          // Match by nutrient ID in object
          if (value && typeof value === 'object' && (value.id === nutrientId || value.id === parseInt(nutrientId))) {
            dailyValue += (parseFloat(value.value) || 0);
            return;
          }
          
          // Match by nutrient name
          const metadata = NUTRIENT_METADATA[parseInt(nutrientId)];
          if (metadata && value && typeof value === 'object' && value.name === metadata.name) {
            dailyValue += (parseFloat(value.value) || 0);
            return;
          }
        }
      }
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
  
  // Debug any logs with calcium data
  const calciumLogs = logs.filter(log => 
    log.nutrients && Object.keys(log.nutrients).includes('1087')
  );
  
  console.log(`DEBUG: Found ${calciumLogs.length} logs with calcium data`);
  if (calciumLogs.length > 0) {
    console.log('DEBUG: Example calcium log:', JSON.stringify(calciumLogs[0], null, 2));
    console.log('DEBUG: Calcium value:', calciumLogs[0].nutrients['1087']);
    console.log('DEBUG: Calcium value type:', typeof calciumLogs[0].nutrients['1087']);
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