# NutriByte Test Suite

This directory contains the test suites for the NutriByte application, organized by component type. The tests utilize Jest as the test runner and React Testing Library for component testing.

## Test Structure

```
tests/
├── components/        # Tests for reusable UI components
│   └── NutrientCard.test.jsx  # Tests for the NutrientCard component
├── pages/             # Tests for page components
│   └── Dashboard.test.jsx     # Tests for the Dashboard page
├── utils/             # Tests for utility functions
│   ├── analyticsUtils.test.js # Tests for analytics utility functions
│   └── nutrientUtils.test.js  # Tests for nutrient calculation utilities
└── __mocks__/         # Mock implementations for testing
```

## Testing Philosophy

Our testing approach follows these principles:

1. **Component Testing**: Test React components in isolation to verify their rendering and behavior.
2. **Utility Testing**: For utility functions, focus on input/output testing with various scenarios.
3. **Mock Dependencies**: External dependencies are mocked to ensure tests are predictable and don't rely on external services.
4. **Snapshots Sparingly**: Use snapshots only when necessary, preferring explicit assertions for most tests.
5. **Code Style Consistency**: All tests follow the same code style as the main codebase (double quotes, proper spacing).

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test -- src/tests/components/NutrientCard.test.jsx
```

## Test Utilities

- `setupTests.js`: Contains global Jest configuration and polyfills
- Jest DOM extensions are available for more expressive DOM assertions

## Test Examples

### Component Test Example

```jsx
// From NutrientCard.test.jsx
describe("NutrientCard Component", () => {
  it("displays the correct nutrient title", () => {
    render(<NutrientCard title="Calories" value={500} unit="kcal" />);
    expect(screen.getByTestId("nutrient-title")).toHaveTextContent("Calories");
  });
});
```

### Utility Test Example

```javascript
// From analyticsUtils.test.js
describe("calculateDailyAverage", () => {
  test("should calculate total calories correctly for consumed logs", () => {
    const totalCalories = calculateDailyAverage(
      sampleLogs,
      "1008",
      "consumed",
      startDate,
      endDate,
      true
    );
    expect(totalCalories).toBe(1350);
  });
});
```

## Best Practices

1. Keep test files alongside the components they test for easier navigation
2. Use descriptive test names that explain the expected behavior
3. Test both happy paths and edge cases
4. Avoid testing implementation details; focus on behavior
5. Use `data-testid` attributes for test-specific element selection
6. Maintain consistency in test structure and naming conventions
