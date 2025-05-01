import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Sub-schema for nutrient overrides (remains the same)
const NutrientOverrideSchema = new Schema({
    value: { type: Number, required: true },
    unit: { type: String, required: true }
}, { _id: false });

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // --- Embedded Configuration Fields ---
  targetCalories: {
      type: Number,
      default: 2000,
      min: 0
  },
  macroPercentages: {
      type: {
          protein: { type: Number, default: 20, min: 0, max: 100 },
          fat: { type: Number, default: 30, min: 0, max: 100 },
          carbs: { type: Number, default: 50, min: 0, max: 100 }
      },
      default: () => ({ protein: 20, fat: 30, carbs: 50 }),
      validate: [{
          validator: function(value) {
              if (!value) return true;
              const total = (value.protein || 0) + (value.fat || 0) + (value.carbs || 0);
              return Math.abs(total - 100) < 0.1;
          },
          message: props => `Macro percentages must sum to 100% (currently: ${(props.value.protein || 0) + (props.value.fat || 0) + (props.value.carbs || 0)}%)`
      }]
  },
  overriddenNutrients: {
      type: Map,
      of: NutrientOverrideSchema,
      default: {}
  }
  // -----------------------------------
});

export default model('User', userSchema); 