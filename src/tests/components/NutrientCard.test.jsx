import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// Extract the NutrientCard component for testing
const NutrientCard = ({ title, value, unit }) => {
  // Daily Value reference amounts
  const NUTRIENT_DV = {
    calories: 2000,
    protein: 50,
    carbs: 275,
    fat: 78,
    fiber: 28
  };

  // Format nutrient value with unit
  const formatNutrientValue = (value, unit) => {
    if (value === 0 || !value) return '0';
    return `${value.toFixed(1)}${unit}`;
  };

  // Calculate % of daily value
  const nutrientKey = title.toLowerCase();
  const dvPercent = NUTRIENT_DV[nutrientKey] ? Math.min(100, Math.round((value / NUTRIENT_DV[nutrientKey]) * 100)) : 0;
  
  return (
    <div data-testid="nutrient-card" aria-label={`${title}: ${value}${unit}`}>
      <div data-testid="nutrient-title">{title}</div>
      <div data-testid="nutrient-value">{formatNutrientValue(value, unit)}</div>
      {dvPercent > 0 && (
        <div data-testid="nutrient-dv">{dvPercent}% DV</div>
      )}
    </div>
  );
};

describe('NutrientCard Component', () => {
  it('displays the correct nutrient title', () => {
    render(
      <NutrientCard 
        title="Calories" 
        value={500} 
        unit="kcal" 
      />
    );
    
    expect(screen.getByTestId('nutrient-title')).toHaveTextContent('Calories');
  });
  
  it('displays the formatted value with unit', () => {
    render(
      <NutrientCard 
        title="Protein" 
        value={25} 
        unit="g" 
      />
    );
    
    expect(screen.getByTestId('nutrient-value')).toHaveTextContent('25.0g');
  });
  
  it('displays the correct daily value percentage', () => {
    // Protein has a 50g daily value, so 25g should be 50%
    render(
      <NutrientCard 
        title="Protein" 
        value={25} 
        unit="g" 
      />
    );
    
    expect(screen.getByTestId('nutrient-dv')).toHaveTextContent('50% DV');
  });
  
  it('handles zero values correctly', () => {
    render(
      <NutrientCard 
        title="Calories" 
        value={0} 
        unit="kcal" 
      />
    );
    
    expect(screen.getByTestId('nutrient-value')).toHaveTextContent('0');
    // No DV should be shown for zero values
    expect(screen.queryByTestId('nutrient-dv')).not.toBeInTheDocument();
  });
}); 