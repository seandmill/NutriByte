// Nutrient IDs and their corresponding names/units/icons/DV
export const NUTRIENT_METADATA = {
  // Macronutrients - Icons represent general energy/building blocks
  1003: { name: 'Protein', unit: 'g', category: 'macronutrients', icon: 'FitnessCenter', dv: 50 },
  1004: { name: 'Total Fat', unit: 'g', category: 'macronutrients', icon: 'Opacity', dv: 78 }, // Opacity as oil drop
  1005: { name: 'Carbohydrates', unit: 'g', category: 'macronutrients', icon: 'Grain', dv: 275 },
  1008: { name: 'Energy', unit: 'kcal', category: 'macronutrients', icon: 'LocalFireDepartment', dv: 2000 }, // Fire icon for calories
  2000: { name: 'Total Sugars', unit: 'g', category: 'macronutrients', icon: 'Cake', dv: 50 }, // Includes added sugars limit for DV basis
  1079: { name: 'Dietary Fiber', unit: 'g', category: 'macronutrients', icon: 'Grass', dv: 28 }, // Eco/plant icon for fiber
  1235: { name: 'Added Sugars', unit: 'g', category: 'macronutrients', icon: 'AddCircleOutline' }, // No specific DV, part of Total Sugars

  // Minerals - Icons represent structure/elements
  1087: { name: 'Calcium', unit: 'mg', category: 'minerals', icon: 'Calcium', dv: 1300 }, // Specific Calcium icon
  1089: { name: 'Iron', unit: 'mg', category: 'minerals', icon: 'Hardware', dv: 18 }, // Anvil/tool icon for Iron
  1090: { name: 'Magnesium', unit: 'mg', category: 'minerals', icon: 'Spa' }, // Spa/relax icon?
  1091: { name: 'Phosphorus', unit: 'mg', category: 'minerals', icon: 'Science' }, // Science beaker
  1092: { name: 'Potassium', unit: 'mg', category: 'minerals', icon: 'Bolt', dv: 4700 }, // Bolt for K+ ion
  1093: { name: 'Sodium', unit: 'mg', category: 'minerals', icon: 'AcUnit', dv: 2300 }, // Crystal/salt icon
  1095: { name: 'Zinc', unit: 'mg', category: 'minerals', icon: 'Shield', dv: 11 }, // Shield for immune support
  1098: { name: 'Copper', unit: 'mg', category: 'minerals', icon: 'SettingsEthernet' }, // Wires like copper wires
  1103: { name: 'Selenium', unit: 'µg', category: 'minerals', icon: 'BubbleChart' }, // Abstract dots

  // Vitamins - Icons represent health/specific sources
  1104: { name: 'Vitamin A', unit: 'IU', category: 'vitamins', icon: 'Visibility', dv: 5000 }, // Eye icon
  1105: { name: 'Retinol', unit: 'µg', category: 'vitamins', icon: 'VisibilityOutlined' },
  1106: { name: 'Vitamin A, RAE', unit: 'µg', category: 'vitamins', icon: 'RemoveRedEye' }, // Using RAE for DV: 900mcg
  1107: { name: 'Carotene, beta', unit: 'µg', category: 'vitamins', icon: 'ColorLens' }, // Color palette for pigment
  1108: { name: 'Carotene, alpha', unit: 'µg', category: 'vitamins', icon: 'Palette' },
  1109: { name: 'Vitamin E', unit: 'mg', category: 'vitamins', icon: 'OilBarrel', dv: 15 }, // Oil/lipid soluble
  1114: { name: 'Vitamin D', unit: 'µg', category: 'vitamins', icon: 'WbSunny', dv: 20 }, // Sun icon
  1120: { name: 'Cryptoxanthin', unit: 'µg', category: 'vitamins', icon: 'FilterVintage' }, // Flower/plant source?
  1122: { name: 'Lycopene', unit: 'µg', category: 'vitamins', icon: 'LocalFlorist' }, // Tomato/flower?
  1123: { name: 'Lutein + Zeaxanthin', unit: 'µg', category: 'vitamins', icon: 'NaturePeople' }, // Nature/plants?
  1162: { name: 'Vitamin C', unit: 'mg', category: 'vitamins', icon: 'HealthAndSafety', dv: 90 }, // Health icon
  1165: { name: 'Thiamin', unit: 'mg', category: 'vitamins', icon: 'DirectionsBike' }, // Energy metabolism?
  1166: { name: 'Riboflavin', unit: 'mg', category: 'vitamins', icon: 'ElectricBolt' }, // Energy?
  1167: { name: 'Niacin', unit: 'mg', category: 'vitamins', icon: 'NetworkCheck' }, // Circulation?
  1175: { name: 'Vitamin B6', unit: 'mg', category: 'vitamins', icon: 'Psychology', dv: 1.7 }, // Brain function?
  1177: { name: 'Folate', unit: 'µg', category: 'vitamins', icon: 'PregnantWoman', dv: 400 }, // Pregnancy association
  1178: { name: 'Vitamin B12', unit: 'µg', category: 'vitamins', icon: 'Memory', dv: 2.4 }, // Memory/nerve icon
  1180: { name: 'Choline', unit: 'mg', category: 'vitamins', icon: 'Egg' }, // Egg source
  1183: { name: 'Vitamin K', unit: 'µg', category: 'vitamins', icon: 'Bloodtype', dv: 120 }, // Blood clotting

  // Lipids - Icons relate to fats/heart
  1253: { name: 'Cholesterol', unit: 'mg', category: 'lipids', icon: 'MonitorHeart', dv: 300 }, // Heart monitor
  1257: { name: 'Trans Fat', unit: 'g', category: 'lipids', icon: 'Block' }, // Generally advised against
  1258: { name: 'Saturated Fat', unit: 'g', category: 'lipids', icon: 'DoNotDisturbOn', dv: 20 }, // Limit intake icon
  1292: { name: 'Monounsaturated Fat', unit: 'g', category: 'lipids', icon: 'FavoriteBorder' }, // Heart healthy?
  1293: { name: 'Polyunsaturated Fat', unit: 'g', category: 'lipids', icon: 'Spa' } // Plant/relaxing?
};

// Group nutrients by category
export const NUTRIENT_CATEGORIES = {
  macronutrients: 'Macronutrients',
  minerals: 'Minerals',
  vitamins: 'Vitamins',
  lipids: 'Lipids'
};

// Calorie conversion factors (kcal per gram)
export const CALORIE_FACTORS = {
  Protein: 4,
  'Total Fat': 9,
  Carbohydrates: 4
};

/**
 * Extracts and organizes nutrients from food data
 * @param {Object} foodData - The food data object from the API
 * @param {boolean} useServingSize - Whether to adjust values to serving size (default: true)
 * @returns {Object} Organized nutrient data
 */
export const extractNutrients = (foodData, useServingSize = true) => {
  if (!foodData?.foodNutrients) return {};

  const nutrients = {};
  const servingSize = foodData.servingSize || 100;
  const servingSizeUnit = foodData.servingSizeUnit || 'g';
  const householdServing = foodData.householdServingFullText || '';

  // Group nutrients by category
  Object.keys(NUTRIENT_CATEGORIES).forEach(category => {
    nutrients[category] = [];
  });

  foodData.foodNutrients.forEach(nutrient => {
    const id = nutrient.nutrientId || nutrient.nutrient?.id;
    const metadata = NUTRIENT_METADATA[id];
    
    if (metadata) {
      const value = nutrient.amount || nutrient.value || 0;
      const adjustedValue = useServingSize ? (value * servingSize) / 100 : value;
      
      nutrients[metadata.category].push({
        id,
        name: metadata.name,
        value: Number(adjustedValue.toFixed(2)),
        unit: metadata.unit,
        percentDailyValue: nutrient.percentDailyValue
      });
    }
  });

  return {
    nutrients,
    servingInfo: {
      size: servingSize,
      unit: servingSizeUnit,
      householdServing
    }
  };
};

/**
 * Formats nutrient value with appropriate unit
 * @param {number} value - The nutrient value
 * @param {string} unit - The unit of measurement
 * @returns {string} Formatted string
 */
export const formatNutrientValue = (value, unit) => {
  if (value === 0 || !value) return '0';
  return `${value.toFixed(1)}${unit}`;
};

/**
 * Gets serving size description
 * @param {Object} servingInfo - Serving size information
 * @returns {string} Formatted serving size description
 */
export const getServingSizeDescription = (servingInfo) => {
  const { size, unit, householdServing } = servingInfo;
  if (householdServing) {
    return `${householdServing} (${size}${unit})`;
  }
  return `${size}${unit}`;
}; 