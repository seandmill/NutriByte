import {
  calculateDailyAverage,
  getCalorieBreakdown,
  getTimeSeriesData,
  getFilterOptions,
} from "../../utils/analyticsUtils";

// --- Sample Log Data ---

const sampleLogs = [
  // Log 1: Basic format, consumed
  {
    _id: "log1",
    logType: "consumed",
    date: new Date("2023-10-26T10:00:00Z"),
    logDate: "2023-10-26T10:00:00Z", // For getTimeSeriesData compatibility
    calories: 300,
    protein: 20,
    fat: 10,
    carbs: 30,
    nutrients: {
      // Mixed scalar and object values
      1008: 300, // Calories
      1003: { id: "1003", name: "Protein", value: 20, unit: "g" }, // Protein
      1004: 10, // Fat
      1005: {
        id: "1005",
        name: "Carbohydrate, by difference",
        value: 30,
        unit: "g",
      }, // Carbs
      1087: 150, // Calcium (Scalar)
      1089: { id: "1089", name: "Iron, Fe", value: 5, unit: "mg" }, // Iron
    },
    brandOwner: "Good Food Co.",
    brandName: "Good Brand",
    brandedFoodCategory: "Meals",
    ingredients: "Chicken, Rice, Broccoli, Sauce",
  },
  // Log 2: Nutrient map only, consumed
  {
    _id: "log2",
    logType: "consumed",
    date: new Date("2023-10-27T12:00:00Z"),
    logDate: "2023-10-27T12:00:00Z",
    nutrients: {
      // String keys, Object values
      1008: { id: "1008", name: "Energy", value: 500, unit: "kcal" },
      1003: { id: "1003", name: "Protein", value: 30, unit: "g" },
      1004: { id: "1004", name: "Total lipid (fat)", value: 25, unit: "g" },
      1005: {
        id: "1005",
        name: "Carbohydrate, by difference",
        value: 40,
        unit: "g",
      },
      1087: { id: "1087", name: "Calcium, Ca", value: 200, unit: "mg" },
      1093: { id: "1093", name: "Sodium, Na", value: 600, unit: "mg" },
    },
    brandOwner: "Healthy Eats Inc.",
    brandName: "Healthy Choice",
    brandedFoodCategory: "Snacks",
    parsedIngredients: ["Oats", "Honey", "Nuts"],
  },
  // Log 3: Legacy format, consumed, same day as log 1
  {
    _id: "log3",
    logType: "consumed",
    date: new Date("2023-10-26T18:00:00Z"),
    logDate: "2023-10-26T18:00:00Z",
    calories: 400, // Direct property
    nutrientsArray: [
      // Legacy array
      { id: "1003", name: "Protein", value: 25 },
      { id: "1004", name: "Fat", value: 15 },
      { id: "1005", name: "Carbs", value: 45 },
      { id: 1087, name: "Calcium", value: 100 }, // Number ID
    ],
    brandOwner: "Good Food Co.", // Duplicate owner
    brandName: "Super Snack",
    brandedFoodCategory: "Snacks", // Duplicate category
    ingredients: "Flour; Sugar; Eggs",
  },
  // Log 4: Avoided log
  {
    _id: "log4",
    logType: "avoided",
    date: new Date("2023-10-28T09:00:00Z"),
    logDate: "2023-10-28T09:00:00Z",
    nutrients: {
      1008: { value: 600 },
      1003: { value: 10 },
      1004: { value: 30 },
      1005: { value: 70 },
    },
    brandOwner: "Tasty Treats",
    brandName: "Sugar Bomb",
    brandedFoodCategory: "Desserts",
  },
  // Log 5: Prepped log
  {
    _id: "log5",
    logType: "prepped",
    date: new Date("2023-10-28T14:00:00Z"),
    logDate: "2023-10-28T14:00:00Z",
    nutrients: {
      1008: { value: 350 },
      1003: { value: 40 },
      1004: { value: 12 },
      1005: { value: 20 },
      1087: 50, // Calcium
    },
    brandOwner: "Meal Prep Pro",
    brandName: "Chicken & Veg",
    brandedFoodCategory: "Meals",
  },
  // Log 6: No nutrients object, only direct props
  {
    _id: "log6",
    logType: "consumed",
    date: new Date("2023-10-29T08:00:00Z"),
    logDate: "2023-10-29T08:00:00Z",
    calories: 150,
    protein: 5,
    fat: 8,
    carbs: 15,
    calcium: 80, // Direct calcium prop
    iron: 2,
  },
];

const emptyLogs = [];
const startDate = new Date("2023-10-26T00:00:00Z");
const endDate = new Date("2023-10-28T23:59:59Z"); // 3 day range

// --- Test Suites ---

describe("analyticsUtils", () => {
  describe("calculateDailyAverage", () => {
    // Test cases for calculateDailyAverage will go here
    test("should calculate total calories correctly for consumed logs", () => {
      // Example: calculate total calories from sampleLogs
      const totalCalories = calculateDailyAverage(
        sampleLogs,
        "1008",
        "consumed",
        startDate,
        endDate,
        true
      );
      // Expected: 300 (log1) + 500 (log2) + 400 (log3) + 150 (log6) = 1350
      expect(totalCalories).toBe(1350);
    });

    test("should calculate average daily calcium correctly for consumed logs", () => {
      // This variable 'avgCalcium' is declared but not used, let's remove or comment the declaration
      // const avgCalcium = calculateDailyAverage(sampleLogs, '1087', 'consumed', startDate, endDate, false);
      // Expected: (150 (log1) + 200 (log2) + 100 (log3) + 80 (log6)) / 3 days = 530 / 3 = 176.66... -> 176.7
      // Note: Log 6 is on 10-29, outside the 3 day range of startDate/endDate. Range includes 26, 27, 28.
      // Let's recalculate for the 3-day window:
      // Day 26: 150 (log1) + 100 (log3) = 250
      // Day 27: 200 (log2) = 200
      // Day 28: 0
      // Total = 450. Avg = 450 / 3 days = 150.0
      // Update date range to include log 6
      const endDateExtended = new Date("2023-10-29T23:59:59Z"); // 4 day range
      const avgCalciumExtended = calculateDailyAverage(
        sampleLogs,
        "1087",
        "consumed",
        startDate,
        endDateExtended,
        false
      );
      // Total = 150 (log1) + 200 (log2) + 100 (log3) + 80 (log6) = 530
      // Avg = 530 / 4 days = 132.5
      expect(avgCalciumExtended).toBe(132.5);
    });

    test("should calculate total protein correctly for avoided logs", () => {
      const totalProteinAvoided = calculateDailyAverage(
        sampleLogs,
        "1003",
        "avoided",
        startDate,
        endDate,
        true
      );
      // Expected: 10 (log4)
      expect(totalProteinAvoided).toBe(10);
    });

    test("should return 0 if no logs match the type", () => {
      const result = calculateDailyAverage(
        sampleLogs,
        "1008",
        "nonexistent",
        startDate,
        endDate,
        true
      );
      expect(result).toBe(0);
    });

    test("should return 0 for empty logs array", () => {
      const result = calculateDailyAverage(
        emptyLogs,
        "1008",
        "consumed",
        startDate,
        endDate,
        true
      );
      expect(result).toBe(0);
    });
  });

  describe("getCalorieBreakdown", () => {
    // Test cases for getCalorieBreakdown will go here
    test("should calculate calorie breakdown percentages correctly for consumed logs", () => {
      const breakdown = getCalorieBreakdown(sampleLogs, "consumed");
      // Totals for consumed logs (log1, log2, log3, log6):
      // Protein: 20 + 30 + 25 + 5 = 80g -> 80 * 4 = 320 kcal
      // Fat: 10 + 25 + 15 + 8 = 58g -> 58 * 9 = 522 kcal
      // Carbs: 30 + 40 + 45 + 15 = 130g -> 130 * 4 = 520 kcal
      // Total Calories from macros: 320 + 522 + 520 = 1362 kcal (Note: slight diff from calorie sum due to factors)
      // Protein % = (320 / 1362) * 100 ~= 23.49 -> 23
      // Fat % = (522 / 1362) * 100 ~= 38.33 -> 38
      // Carbs % = (520 / 1362) * 100 ~= 38.18 -> 38
      // Check rounding: 23 + 38 + 38 = 99. Need to be careful about rounding. Let's recalculate.
      // Let's manually check the function logic with CALORIE_FACTORS (Protein: 4, Fat: 9, Carbs: 4)
      // Protein Cals = 80 * 4 = 320
      // Fat Cals = 58 * 9 = 522
      // Carb Cals = 130 * 4 = 520
      // Total Cals = 320 + 522 + 520 = 1362
      // Protein % = Math.round((320 / 1362) * 100) = Math.round(23.49) = 23
      // Fat % = Math.round((522 / 1362) * 100) = Math.round(38.33) = 38
      // Carb % = Math.round((520 / 1362) * 100) = Math.round(38.18) = 38
      expect(breakdown).toEqual({
        proteinPercent: 23,
        fatPercent: 38,
        carbsPercent: 38,
      });
    });

    test("should return all zeros if no matching logs", () => {
      const breakdown = getCalorieBreakdown(sampleLogs, "nonexistent");
      expect(breakdown).toEqual({
        proteinPercent: 0,
        fatPercent: 0,
        carbsPercent: 0,
      });
    });

    test("should return all zeros for empty logs array", () => {
      const breakdown = getCalorieBreakdown(emptyLogs, "consumed");
      expect(breakdown).toEqual({
        proteinPercent: 0,
        fatPercent: 0,
        carbsPercent: 0,
      });
    });

    test("should return all zeros if total calories from macros are zero", () => {
      const zeroMacroLogs = [
        {
          logType: "consumed",
          date: new Date(),
          nutrients: { 1003: 0, 1004: 0, 1005: 0 },
        },
      ];
      const breakdown = getCalorieBreakdown(zeroMacroLogs, "consumed");
      expect(breakdown).toEqual({
        proteinPercent: 0,
        fatPercent: 0,
        carbsPercent: 0,
      });
    });
  });

  describe("getTimeSeriesData", () => {
    // Test cases for getTimeSeriesData will go here
    test("should group consumed calories by date and sort", () => {
      const timeSeries = getTimeSeriesData(sampleLogs, "1008", "consumed");
      // Expected:
      // 2023-10-26: 300 (log1) + 400 (log3) = 700
      // 2023-10-27: 500 (log2) = 500
      // 2023-10-29: 150 (log6) = 150
      expect(timeSeries).toEqual([
        { date: "2023-10-26", value: 700 },
        { date: "2023-10-27", value: 500 },
        { date: "2023-10-29", value: 150 },
      ]);
    });

    test("should group consumed calcium by date and sort", () => {
      const timeSeries = getTimeSeriesData(sampleLogs, "1087", "consumed");
      // Expected:
      // 2023-10-26: 150 (log1) + 100 (log3) = 250
      // 2023-10-27: 200 (log2) = 200
      // 2023-10-29: 80 (log6) = 80
      expect(timeSeries).toEqual([
        { date: "2023-10-26", value: 250 },
        { date: "2023-10-27", value: 200 },
        { date: "2023-10-29", value: 80 },
      ]);
    });

    test("should return empty array if no matching logs", () => {
      const timeSeries = getTimeSeriesData(sampleLogs, "1008", "nonexistent");
      expect(timeSeries).toEqual([]);
    });

    test("should return empty array for empty logs array", () => {
      const timeSeries = getTimeSeriesData(emptyLogs, "1008", "consumed");
      expect(timeSeries).toEqual([]);
    });
  });

  describe("getFilterOptions", () => {
    test("should extract unique and sorted filter options from logs", () => {
      const options = getFilterOptions(sampleLogs);

      expect(options.brandOwners).toEqual([
        "Good Food Co.",
        "Healthy Eats Inc.",
        "Meal Prep Pro",
        "Tasty Treats",
      ]);
      expect(options.brandNames).toEqual(
        [
          "Good Brand",
          "Healthy Choice",
          "Super Snack",
          "Sugar Bomb",
          "Chicken & Veg",
        ].sort()
      );
      expect(options.foodCategories).toEqual(["Desserts", "Meals", "Snacks"]);
      expect(options.ingredients).toEqual(
        [
          "Chicken",
          "Rice",
          "Broccoli",
          "Sauce",
          "Oats",
          "Honey",
          "Nuts",
          "Flour",
          "Sugar",
          "Eggs",
        ].sort()
      );
    });

    test("should return empty arrays if logs array is empty", () => {
      const options = getFilterOptions(emptyLogs);
      expect(options).toEqual({
        brandOwners: [],
        brandNames: [],
        foodCategories: [],
        ingredients: [],
      });
    });

    test("should return empty arrays if logs have no relevant fields", () => {
      const logsWithoutOptions = [
        { _id: "l1", logType: "consumed", date: new Date() },
        { _id: "l2", logType: "consumed", date: new Date() },
      ];
      const options = getFilterOptions(logsWithoutOptions);
      expect(options).toEqual({
        brandOwners: [],
        brandNames: [],
        foodCategories: [],
        ingredients: [],
      });
    });

    test("should handle logs missing ingredients or brand info gracefully", () => {
      const partialLogs = [
        {
          _id: "log1",
          logType: "consumed",
          date: new Date(),
          brandOwner: "Owner A",
        },
        {
          _id: "log2",
          logType: "consumed",
          date: new Date(),
          brandName: "Brand B",
        },
        {
          _id: "log3",
          logType: "consumed",
          date: new Date(),
          brandedFoodCategory: "Category C",
        },
        {
          _id: "log4",
          logType: "consumed",
          date: new Date(),
          ingredients: "Ingredient D",
        },
        {
          _id: "log5",
          logType: "consumed",
          date: new Date(),
          parsedIngredients: ["Ingredient E"],
        },
      ];
      const options = getFilterOptions(partialLogs);
      expect(options.brandOwners).toEqual(["Owner A"]);
      expect(options.brandNames).toEqual(["Brand B"]);
      expect(options.foodCategories).toEqual(["Category C"]);
      expect(options.ingredients).toEqual(["Ingredient D", "Ingredient E"]);
    });
  });
});
