import { describe, it, expect } from '@jest/globals';
import { extractNutrients, formatNutrientValue } from '../../utils/nutrientUtils.js';

describe('nutrientUtils', () => {
  describe('extractNutrients', () => {
    it('should extract nutrients from food data', () => {
      // Arrange
      const mockFoodData = {
        foodNutrients: [
          { nutrientId: 1008, value: 95 },
          { nutrientId: 1003, value: 0.5 },
          { nutrientId: 1005, value: 25 },
          { nutrientId: 1004, value: 0.3 },
          { nutrientId: 1079, value: 4.4 }
        ],
        servingSize: 100,
        servingSizeUnit: 'g',
        householdServingFullText: '1 medium apple'
      };
      
      // Act
      const result = extractNutrients(mockFoodData);
      
      // Assert
      expect(result).toHaveProperty('nutrients');
      expect(result).toHaveProperty('servingInfo');
      expect(result.servingInfo.size).toBe(100);
      expect(result.servingInfo.unit).toBe('g');
      expect(result.servingInfo.householdServing).toBe('1 medium apple');
      
      // Check that nutrients are properly categorized
      expect(result.nutrients.macronutrients).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1008, name: 'Energy', value: 95 }),
          expect.objectContaining({ id: 1003, name: 'Protein', value: 0.5 }),
          expect.objectContaining({ id: 1005, name: 'Carbohydrates', value: 25 }),
          expect.objectContaining({ id: 1004, name: 'Total Fat', value: 0.3 }),
          expect.objectContaining({ id: 1079, name: 'Dietary Fiber', value: 4.4 })
        ])
      );
    });
    
    it('should return empty object when foodData is null', () => {
      const result = extractNutrients(null);
      expect(result).toEqual({});
    });
    
    it('should adjust values based on serving size when useServingSize is true', () => {
      const mockFoodData = {
        foodNutrients: [
          { nutrientId: 1008, value: 50 }
        ],
        servingSize: 200,
        servingSizeUnit: 'g'
      };
      
      const result = extractNutrients(mockFoodData, true);
      
      // 50 * (200/100) = 100
      expect(result.nutrients.macronutrients[0].value).toBe(100);
    });
    
    it('should not adjust values when useServingSize is false', () => {
      const mockFoodData = {
        foodNutrients: [
          { nutrientId: 1008, value: 50 }
        ],
        servingSize: 200,
        servingSizeUnit: 'g'
      };
      
      const result = extractNutrients(mockFoodData, false);
      
      expect(result.nutrients.macronutrients[0].value).toBe(50);
    });
  });
  
  describe('formatNutrientValue', () => {
    it('should format nutrient value with unit', () => {
      expect(formatNutrientValue(10, 'g')).toBe('10.0g');
      expect(formatNutrientValue(5.5, 'mg')).toBe('5.5mg');
      expect(formatNutrientValue(100, 'kcal')).toBe('100.0kcal');
    });
    
    it('should return 0 for zero values', () => {
      expect(formatNutrientValue(0, 'g')).toBe('0');
      expect(formatNutrientValue(null, 'g')).toBe('0');
      expect(formatNutrientValue(undefined, 'g')).toBe('0');
    });
  });
}); 