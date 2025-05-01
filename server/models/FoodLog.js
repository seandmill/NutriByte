const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodId: {
    type: String,
    required: true
  },
  foodName: {
    type: String,
    required: true
  },
  // Base serving size in grams/ml
  servingSize: {
    type: Number,
    required: true
  },
  servingUnit: {
    type: String,
    required: true
  },
  // Enhanced serving information
  quantity: {
    type: Number,
    default: 1
  },
  servingType: {
    type: String,
    default: 'g' // Default to grams if no household measure
  },
  servingAmount: {
    type: Number,
    default: 1 // Default to 1 unit if not specified
  },
  // Keep for UI purposes
  servingDescription: {
    type: String
  },
  // Food metadata
  dataType: {
    type: String // e.g., "Branded", "Survey (FNDDS)", "Foundation", etc.
  },
  foodClass: {
    type: String // e.g., "Branded"
  },
  brandOwner: {
    type: String
  },
  brandName: {
    type: String
  },
  brandedFoodCategory: {
    type: String
  },
  ingredients: {
    type: String // Full ingredients string
  },
  // Parsed ingredients for allergen/dietary restriction filtering
  parsedIngredients: {
    type: [String], // Array of individual ingredients
    default: []
  },
  logType: {
    type: String,
    enum: ['consumed', 'prepped', 'avoided'],
    default: 'consumed'
  },
  logDate: {
    type: Date
  },
  // Store nutrients with their IDs
  nutrients: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Keep specific macro fields for easier querying
  calories: {
    type: Number,
    default: 0
  },
  protein: {
    type: Number,
    default: 0
  },
  fat: {
    type: Number,
    default: 0
  },
  carbs: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FoodLog', foodLogSchema); 