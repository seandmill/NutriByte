import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  ListItemIcon,
  LinearProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormGroup,
  Checkbox,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import * as MuiIcons from "@mui/icons-material";
import Layout from "../components/Layout.jsx";
import { getFoodDetails } from "@clientApi/foodApi.js";
import { getUserConfig } from "@clientApi/userApi.js";
import {
  extractNutrients,
  formatNutrientValue,
  NUTRIENT_CATEGORIES,
  NUTRIENT_METADATA,
  CALORIE_FACTORS,
} from "../utils/nutrientUtils.js";
import { createFoodLog } from "@clientApi/logApi.js";
import { addDays, getDay, endOfWeek, eachDayOfInterval } from "date-fns";

const getIcon = (iconName) => {
  const IconComponent = MuiIcons[iconName];
  return IconComponent ? <IconComponent /> : <MuiIcons.HelpOutline />;
};

const AllergenWarningBanner = ({ ingredients }) => {
  if (!ingredients) return null;

  // Define the "Big Nine" allergens with their common names in ingredients lists
  const bigNineAllergens = [
    {
      name: "Milk",
      severity: "high",
      keywords: [
        "milk",
        "dairy",
        "lactose",
        "whey",
        "casein",
        "cream",
        "butter",
        "cheese",
        "yogurt",
      ],
    },
    {
      name: "Eggs",
      severity: "high",
      keywords: [
        "egg",
        "albumin",
        "ovalbumin",
        "lysozyme",
        "globulin",
        "mayonnaise",
        "meringue",
      ],
    },
    {
      name: "Fish",
      severity: "high",
      keywords: [
        "fish",
        "cod",
        "salmon",
        "tuna",
        "anchovy",
        "bass",
        "trout",
        "halibut",
        "mahi",
        "tilapia",
      ],
    },
    {
      name: "Crustacean Shellfish",
      severity: "high",
      keywords: [
        "shellfish",
        "crab",
        "lobster",
        "shrimp",
        "prawn",
        "crayfish",
        "langoustine",
        "krill",
      ],
    },
    {
      name: "Tree Nuts",
      severity: "high",
      keywords: [
        "almond",
        "hazelnut",
        "walnut",
        "cashew",
        "pecan",
        "brazil nut",
        "pistachio",
        "macadamia",
        "pine nut",
        "chestnut",
      ],
    },
    {
      name: "Peanuts",
      severity: "high",
      keywords: ["peanut", "arachis", "goober", "groundnut"],
    },
    {
      name: "Wheat",
      severity: "high",
      keywords: [
        "wheat",
        "flour",
        "bread",
        "pasta",
        "semolina",
        "couscous",
        "bulgur",
        "farina",
        "seitan",
      ],
    },
    {
      name: "Soybeans",
      severity: "high",
      keywords: [
        "soy",
        "soya",
        "edamame",
        "tofu",
        "tempeh",
        "miso",
        "natto",
        "tamari",
      ],
    },
    {
      name: "Sesame",
      severity: "high",
      keywords: ["sesame", "tahini", "benne", "gingelly", "til"],
    },
  ];

  // Convert to lowercase for case-insensitive matching
  const ingredientsLower = ingredients.toLowerCase();

  // Find potential allergens in ingredients
  const detectedAllergens = bigNineAllergens.filter((allergen) =>
    allergen.keywords.some((keyword) =>
      ingredientsLower.includes(keyword.toLowerCase())
    )
  );

  if (detectedAllergens.length === 0) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        mt: 3,
        mb: 3,
        p: 2,
        bgcolor: "#ffebee",
        border: "1px solid #f44336",
        borderRadius: 2,
      }}
    >
      <Box display="flex" alignItems="center" mb={1.5}>
        <WarningIcon color="error" fontSize="large" sx={{ mr: 1.5 }} />
        <Typography variant="h6" color="error.dark" fontWeight="bold">
          Allergen Alert
        </Typography>
      </Box>

      <Typography variant="body1" paragraph>
        This product may contain the following allergens:
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {detectedAllergens.map((allergen) => (
          <Chip
            key={allergen.name}
            label={allergen.name}
            color="error"
            variant="filled"
            sx={{ fontWeight: "bold" }}
          />
        ))}
      </Box>

      <Typography variant="body2" color="text.secondary">
        Always verify allergen information directly with the manufacturer as
        ingredients and formulations may change.
      </Typography>
    </Paper>
  );
};

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logSuccess, setLogSuccess] = useState(false);
  const [servingAmount, setServingAmount] = useState(1);
  const [servingUnitInfo, setServingUnitInfo] = useState({
    size: 100,
    unit: "g",
    household: "",
  });
  const [currentGrams, setCurrentGrams] = useState(100);
  const [expandedPanel, setExpandedPanel] = useState("macronutrients");
  const [userNutrientOverrides, setUserNutrientOverrides] = useState({});
  const [userTargetCalories, setUserTargetCalories] = useState(2000); // Default value
  const [userMacroPercentages, setUserMacroPercentages] = useState({
    protein: 20,
    fat: 30,
    carbs: 50,
  }); // Default values

  // --- Meal Prep State ---
  const [mealPrepActive, setMealPrepActive] = useState(false);
  const [prepMode, setPrepMode] = useState("days"); // 'days', 'week', 'custom'
  const [prepDays, setPrepDays] = useState(7); // Default for 'Next X Days'
  const [prepWeeks, setPrepWeeks] = useState(1); // Default for 'Custom'
  const [prepSelectedDays, setPrepSelectedDays] = useState({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  }); // Default weekdays for 'Custom'
  // ----------------------

  // --- Loading/Error State for Logging ---
  const [isLogging, setIsLogging] = useState(false); // Add state for logging process

  // Helper function to create a date string without time/timezone issues
  const createDateOnlyString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Helper function to create a UTC noon date that will display as the same day in any timezone
  const createUTCNoonDate = (date) => {
    // Check if this is a date object or a string
    if (typeof date === "string") {
      // If it's a YYYY-MM-DD string, parse it directly to avoid timezone issues
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split("-").map(Number);
        // Create noon UTC on the exact date specified (month is 0-indexed)
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      }
    }

    // For date objects, use local components but adjust for timezone
    const userTimezoneOffset = date.getTimezoneOffset() * 60000; // in milliseconds
    const localDate = new Date(date.getTime() + userTimezoneOffset);

    // Extract date components from the timezone-adjusted date
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth();
    const day = localDate.getUTCDate();

    // Create noon UTC on the specified date
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  };

  // Extract logDate from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const logDateParam = queryParams.get("logDate");

  // Extract search query from URL parameters
  const searchQuery = queryParams.get("searchQuery");

  useEffect(() => {
    loadFoodDetails();
    loadUserConfig();
  }, [id]);

  const loadFoodDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFoodDetails(id);
      setFood(data);
      const initialServingSize = data.servingSize || 100;
      const initialServingUnit = data.servingSizeUnit || "g";
      const initialHouseholdServing = data.householdServingFullText || "";

      setServingUnitInfo({
        size: initialServingSize,
        unit: initialServingUnit,
        household: initialHouseholdServing,
      });
      if (initialHouseholdServing) {
        setServingAmount(1);
        setCurrentGrams(initialServingSize);
      } else {
        setServingAmount(initialServingSize);
        setCurrentGrams(initialServingSize);
      }
    } catch (error) {
      console.error("Failed to load food details:", error);
      setError("Failed to load food details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (servingUnitInfo.household) {
      const amount = Number(servingAmount) || 0;
      setCurrentGrams(amount * servingUnitInfo.size);
    } else {
      setCurrentGrams(Number(servingAmount) || 0);
    }
  }, [servingAmount, servingUnitInfo]);

  const loadUserConfig = async () => {
    try {
      const config = await getUserConfig();
      if (config.overriddenNutrients) {
        setUserNutrientOverrides(config.overriddenNutrients);
      }
      if (config.targetCalories) {
        setUserTargetCalories(config.targetCalories);
      }
      if (config.macroPercentages) {
        setUserMacroPercentages(config.macroPercentages);
      }
    } catch (error) {
      console.error("Failed to load user configuration:", error);
      // Don't set an error message here, just use defaults if this fails
    }
  };

  const handleLogFood = async () => {
    setIsLogging(true); // Start loading indicator
    setError(""); // Clear previous errors
    setLogSuccess(false);

    // Prepare base food data for logging
    const baseNutrientData = extractNutrients(food, false);
    const scaleFactor = (Number(currentGrams) || 0) / 100;

    // Create a more sophisticated nutrient map with IDs
    const scaledNutrients = {};
    const nutrientIdMap = {}; // To map names back to IDs

    // Process all nutrients with proper scaling and include IDs
    Object.values(baseNutrientData.nutrients || {})
      .flat()
      .forEach((n) => {
        // Ensure value is treated as number before scaling
        const scaledValue = ((Number(n.value) || 0) * scaleFactor).toFixed(2);
        // Store as name:id format for better analytics
        scaledNutrients[`${n.id}`] = {
          value: scaledValue,
          name: n.name,
          unit: n.unit,
        };
        // Also keep a mapping of names to IDs for compatibility with existing code
        nutrientIdMap[n.name] = n.id;
      });

    // Ensure we have the critical macros (even if they're zero)
    if (!nutrientIdMap["Energy"] && !nutrientIdMap["Calories"]) {
      // Find the Energy nutrient (ID 1008) and add it if available
      const energyNutrient = baseNutrientData.nutrients?.macronutrients?.find(
        (n) => n.id === 1008
      );
      if (energyNutrient) {
        const scaledValue = (
          (Number(energyNutrient.value) || 0) * scaleFactor
        ).toFixed(2);
        scaledNutrients["1008"] = {
          value: scaledValue,
          name: "Energy",
          unit: "kcal",
        };
        nutrientIdMap["Energy"] = 1008;
      } else {
        // Default to 0 if not found
        scaledNutrients["1008"] = {
          value: "0.00",
          name: "Energy",
          unit: "kcal",
        };
        nutrientIdMap["Energy"] = 1008;
      }
    }

    // Ensure required macros are always present with their IDs
    const requiredNutrients = [
      { name: "Protein", id: 1003 },
      { name: "Total Fat", id: 1004 },
      { name: "Carbohydrates", id: 1005 },
    ];

    requiredNutrients.forEach(({ name, id }) => {
      if (!nutrientIdMap[name]) {
        scaledNutrients[`${id}`] = {
          value: "0.00",
          name: name,
          unit: "g",
        };
        nutrientIdMap[name] = id;
      }
    });

    // Parse serving information directly from user inputs
    const stateServingAmount = Number(servingAmount) || 1; // Store the state value in a new variable
    let servingAmountPerUnit = 1; // A separate variable for the amount per unit
    let servingType = servingUnitInfo.unit;

    // If using household serving, extract the household unit
    if (servingUnitInfo.household) {
      // Try to extract servingType from household measurement (e.g., "cup" from "0.25 cup")
      const householdParts = servingUnitInfo.household.split(" ");
      if (householdParts.length > 1) {
        // Check if first part is a number (e.g., "0.25" in "0.25 cup")
        const firstPart = parseFloat(householdParts[0]);
        if (!isNaN(firstPart)) {
          servingAmountPerUnit = firstPart;
          servingType = householdParts.slice(1).join(" "); // Everything after the number
        } else {
          // If it's not a number, use the whole string as type
          servingType = servingUnitInfo.household;
        }
      } else {
        servingType = servingUnitInfo.household;
      }
    }

    // Create a display-friendly description for UI purposes only
    const servingDescription = servingUnitInfo.household
      ? `${stateServingAmount} ${servingUnitInfo.household}`
      : `${currentGrams}g`;

    const logPayloadBase = {
      foodId: food.fdcId,
      foodName: food.description,
      servingSize: Number(currentGrams) || 0,
      servingUnit: "g",
      quantity: stateServingAmount,
      servingAmount: servingAmountPerUnit,
      servingType,
      servingDescription,
      dataType: food.dataType || "",
      foodClass: food.foodClass || "",
      brandOwner: food.brandOwner || "",
      brandName: food.brandName || "",
      brandedFoodCategory: food.brandedFoodCategory || "",
      ingredients: food.ingredients || "",
      nutrients: scaledNutrients,
    };

    // If logDateParam is present, use it for the log date
    if (logDateParam && !mealPrepActive) {
      logPayloadBase.logDate = new Date(logDateParam);
    }

    if (mealPrepActive) {
      // --- Meal Prep Logic ---
      let targetDates = [];
      const today = new Date();
      // Adjust day mapping: date-fns Sunday=0, Monday=1...; Our state keys are 'sun', 'mon'...
      const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

      try {
        if (prepMode === "days") {
          if (prepDays > 0) {
            targetDates = eachDayOfInterval({
              start: today,
              end: addDays(today, prepDays - 1),
            });
          }
        } else if (prepMode === "week") {
          const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 }); // Assuming week starts Monday
          // Only include days from today onwards within this week
          targetDates = eachDayOfInterval({ start: today, end: endOfThisWeek });
        } else if (prepMode === "custom") {
          if (prepWeeks > 0) {
            const endDate = addDays(today, prepWeeks * 7 - 1); // Calculate end date based on weeks
            const intervalDays = eachDayOfInterval({
              start: today,
              end: endDate,
            });
            targetDates = intervalDays.filter((date) => {
              const dayOfWeek = dayMap[getDay(date)]; // Get 'mon', 'tue' etc.
              return prepSelectedDays[dayOfWeek]; // Check if selected in state
            });
          }
        }

        if (targetDates.length === 0) {
          throw new Error("No future dates selected for meal prep.");
        }

        console.log(
          `Preparing to log ${targetDates.length} meal prep entries...`
        );
        // Create log entries for each target date
        const logPromises = targetDates.map((date) => {
          const logDate = createUTCNoonDate(date);
          return createFoodLog({
            ...logPayloadBase,
            logType: "prepped",
            logDate,
          });
        });

        await Promise.all(logPromises);
        setLogSuccess(true);

        // Redirect to dashboard using today's date
        const dateForRedirect = createDateOnlyString(new Date());
        setTimeout(
          () =>
            navigate(
              `/dashboard?logDate=${encodeURIComponent(dateForRedirect)}`
            ),
          1500
        );
      } catch (prepError) {
        console.error("Meal prep logging failed:", prepError);
        setError(
          `Meal prep failed: ${
            prepError.message || "Please check configuration."
          }`
        );
      }
      // ----------------------
    } else {
      // --- Single Log Logic ---
      try {
        // Get the date we're using for the log
        const logDate = logDateParam
          ? createUTCNoonDate(logDateParam)
          : createUTCNoonDate(new Date());

        await createFoodLog({
          ...logPayloadBase,
          logType: "consumed", // Standard log is 'consumed'
          logDate, // Use the same date object
        });
        setLogSuccess(true);

        // Redirect to dashboard using the same date format that worked for logging
        // Use createDateOnlyString on the exact same date we used for logging
        const dateForRedirect = createDateOnlyString(new Date(logDate));
        setTimeout(
          () =>
            navigate(
              `/dashboard?logDate=${encodeURIComponent(dateForRedirect)}`
            ),
          1500
        );
      } catch (singleLogError) {
        console.error("Failed to log food:", singleLogError);
        setError("Failed to log food. Please try again.");
      }
      // -----------------------
    }
    setIsLogging(false); // End loading indicator
  };

  const handleServingAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || (!isNaN(value) && Number(value) >= 0)) {
      setServingAmount(value);
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  // Handler for custom day checkboxes
  const handlePrepDayChange = (event) => {
    setPrepSelectedDays({
      ...prepSelectedDays,
      [event.target.name]: event.target.checked,
    });
  };

  // --- Handle Avoid Food ---
  const handleAvoidFood = async () => {
    setIsLogging(true); // Reuse logging state for loading indication
    setError("");
    setLogSuccess(false); // Reset success message

    // Prepare nutrient data as if it were consumed
    const baseNutrientData = extractNutrients(food, false);
    const scaleFactor = (Number(currentGrams) || 0) / 100;

    // Create a more sophisticated nutrient map with IDs
    const scaledNutrients = {};
    const nutrientIdMap = {}; // To map names back to IDs

    // Process all nutrients with proper scaling and include IDs
    Object.values(baseNutrientData.nutrients || {})
      .flat()
      .forEach((n) => {
        // Ensure value is treated as number before scaling
        const scaledValue = ((Number(n.value) || 0) * scaleFactor).toFixed(2);
        // Store as name:id format for better analytics
        scaledNutrients[`${n.id}`] = {
          value: scaledValue,
          name: n.name,
          unit: n.unit,
        };
        // Also keep a mapping of names to IDs for compatibility with existing code
        nutrientIdMap[n.name] = n.id;
      });

    // Ensure we have the critical macros (even if they're zero)
    if (!nutrientIdMap["Energy"] && !nutrientIdMap["Calories"]) {
      // Find the Energy nutrient (ID 1008) and add it if available
      const energyNutrient = baseNutrientData.nutrients?.macronutrients?.find(
        (n) => n.id === 1008
      );
      if (energyNutrient) {
        const scaledValue = (
          (Number(energyNutrient.value) || 0) * scaleFactor
        ).toFixed(2);
        scaledNutrients["1008"] = {
          value: scaledValue,
          name: "Energy",
          unit: "kcal",
        };
        nutrientIdMap["Energy"] = 1008;
      } else {
        // Default to 0 if not found
        scaledNutrients["1008"] = {
          value: "0.00",
          name: "Energy",
          unit: "kcal",
        };
        nutrientIdMap["Energy"] = 1008;
      }
    }

    // Ensure required macros are always present with their IDs
    const requiredNutrients = [
      { name: "Protein", id: 1003 },
      { name: "Total Fat", id: 1004 },
      { name: "Carbohydrates", id: 1005 },
    ];

    requiredNutrients.forEach(({ name, id }) => {
      if (!nutrientIdMap[name]) {
        scaledNutrients[`${id}`] = {
          value: "0.00",
          name: name,
          unit: "g",
        };
        nutrientIdMap[name] = id;
      }
    });

    // Parse serving information directly from user inputs
    const stateServingAmount = Number(servingAmount) || 1; // Store the state value in a new variable
    let servingAmountPerUnit = 1; // A separate variable for the amount per unit
    let servingType = servingUnitInfo.unit;

    // If using household serving, extract the household unit
    if (servingUnitInfo.household) {
      // Try to extract servingType from household measurement (e.g., "cup" from "0.25 cup")
      const householdParts = servingUnitInfo.household.split(" ");
      if (householdParts.length > 1) {
        // Check if first part is a number (e.g., "0.25" in "0.25 cup")
        const firstPart = parseFloat(householdParts[0]);
        if (!isNaN(firstPart)) {
          servingAmountPerUnit = firstPart;
          servingType = householdParts.slice(1).join(" "); // Everything after the number
        } else {
          // If it's not a number, use the whole string as type
          servingType = servingUnitInfo.household;
        }
      } else {
        servingType = servingUnitInfo.household;
      }
    }

    // Create a display-friendly description for UI purposes only
    const servingDescription = servingUnitInfo.household
      ? `${stateServingAmount} ${servingUnitInfo.household}`
      : `${currentGrams}g`;

    const logPayloadBase = {
      foodId: food.fdcId,
      foodName: food.description,
      servingSize: Number(currentGrams) || 0,
      servingUnit: "g",
      quantity: stateServingAmount,
      servingAmount: servingAmountPerUnit,
      servingType,
      servingDescription,
      dataType: food.dataType || "",
      foodClass: food.foodClass || "",
      brandOwner: food.brandOwner || "",
      brandName: food.brandName || "",
      brandedFoodCategory: food.brandedFoodCategory || "",
      ingredients: food.ingredients || "",
      nutrients: scaledNutrients,
    };

    try {
      console.log("Logging avoided food...");
      // Get the date we're using for the log - use the same parameter as normal logs
      const logDate = logDateParam
        ? createUTCNoonDate(logDateParam)
        : createUTCNoonDate(new Date());

      await createFoodLog({
        ...logPayloadBase,
        logType: "avoided", // Set log type to avoided
        logDate,
      });
      // Display a specific success message for avoidance
      setLogSuccess("Food successfully marked as avoided!");

      // Redirect to dashboard using the same date from the logged food
      const dateForRedirect = createDateOnlyString(new Date(logDate));
      setTimeout(
        () =>
          navigate(`/dashboard?logDate=${encodeURIComponent(dateForRedirect)}`),
        1500
      );
    } catch (avoidError) {
      console.error("Failed to log avoided food:", avoidError);
      setError("Failed to record avoided food. Please try again.");
    }

    setIsLogging(false);
  };

  const handleBackToSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append("q", searchQuery);
    }
    if (logDateParam) {
      params.append("logDate", logDateParam);
    }
    navigate(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  if (loading) {
    return (
      <Layout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error && !food) {
    return (
      <Layout>
        <Container>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToSearch}
            sx={{ mb: 2 }}
          >
            {" "}
            Back{" "}
          </Button>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Layout>
    );
  }

  if (!food) {
    return (
      <Layout>
        <Container>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToSearch}
            sx={{ mb: 2 }}
          >
            {" "}
            Back{" "}
          </Button>
          <Alert severity="warning">Food data not available.</Alert>
        </Container>
      </Layout>
    );
  }

  const baseNutrientData = extractNutrients(food, false);
  const isZeroServing = !currentGrams || Number(currentGrams) <= 0;
  const displayScaleFactor = isZeroServing
    ? 0
    : (Number(currentGrams) || 0) / 100;

  // Calculate DV percent with user settings for macros
  const calculateDVPercent = (
    nutrientValue,
    nutrientUnit,
    dvAmount,
    dvUnit,
    nutrientId,
    nutrientName
  ) => {
    // Handle Energy/Calories (nutrient ID 1008)
    if (nutrientId === 1008) {
      return Math.min(
        100,
        Math.round((nutrientValue / userTargetCalories) * 100)
      );
    }

    // Special handling for macronutrients based on user's calories and macro percentages
    if (
      nutrientName &&
      ["Protein", "Total Fat", "Carbohydrates"].includes(nutrientName)
    ) {
      let effectiveDV;

      if (nutrientName === "Protein") {
        // Protein: calories * protein% / 4 calories per gram
        effectiveDV =
          (userTargetCalories * (userMacroPercentages.protein / 100)) /
          CALORIE_FACTORS.Protein;
      } else if (nutrientName === "Total Fat") {
        // Fat: calories * fat% / 9 calories per gram
        effectiveDV =
          (userTargetCalories * (userMacroPercentages.fat / 100)) /
          CALORIE_FACTORS["Total Fat"];
      } else if (nutrientName === "Carbohydrates") {
        // Carbs: calories * carbs% / 4 calories per gram
        effectiveDV =
          (userTargetCalories * (userMacroPercentages.carbs / 100)) /
          CALORIE_FACTORS.Carbohydrates;
      }

      if (effectiveDV && nutrientValue) {
        return Math.min(100, Math.round((nutrientValue / effectiveDV) * 100));
      }
    }

    // For non-macronutrients, check for custom overrides
    const override = userNutrientOverrides[nutrientId];
    const effectiveDV = override ? override.value : dvAmount;
    const effectiveDVUnit = override ? override.unit : dvUnit;

    if (!effectiveDV || !nutrientValue) return 0;

    let valueInDvUnit = nutrientValue;
    if (nutrientUnit === "mg" && effectiveDVUnit === "g") valueInDvUnit /= 1000;
    else if (nutrientUnit === "µg" && effectiveDVUnit === "mg")
      valueInDvUnit /= 1000;
    else if (nutrientUnit === "µg" && effectiveDVUnit === "g")
      valueInDvUnit /= 1000000;

    return Math.min(100, Math.round((valueInDvUnit / effectiveDV) * 100));
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box mb={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToSearch}
            sx={{ mb: 2 }}
          >
            Back to Search
          </Button>

          <Typography variant="h4" gutterBottom>
            {food.description || "N/A"}
          </Typography>
          {food.brandOwner && (
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              {food.brandOwner}
            </Typography>
          )}
          {food.ingredients && (
            <Typography
              variant="caption"
              color="textSecondary"
              display="block"
              sx={{ mt: 1 }}
            >
              Ingredients: {food.ingredients}
            </Typography>
          )}
        </Box>

        {food.ingredients && (
          <AllergenWarningBanner ingredients={food.ingredients} />
        )}

        {isLogging && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Processing log entry...
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {logSuccess && typeof logSuccess === "string" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {logSuccess} Redirecting...
          </Alert>
        )}
        {logSuccess &&
          typeof logSuccess === "boolean" &&
          logSuccess === true && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Food logged successfully! Redirecting...
            </Alert>
          )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, position: "sticky", top: "80px" }}>
              <Typography variant="h6" gutterBottom>
                Log Food Intake
              </Typography>
              <TextField
                type="number"
                label={
                  servingUnitInfo.household
                    ? servingUnitInfo.household
                    : servingUnitInfo.unit
                }
                value={servingAmount}
                onChange={handleServingAmountChange}
                fullWidth
                sx={{ mb: 2 }}
                inputProps={{ step: "0.1" }}
                helperText={
                  servingUnitInfo.household
                    ? `Equals ${(Number(currentGrams) || 0).toFixed(1)} ${
                        servingUnitInfo.unit
                      }`
                    : "Enter amount in grams"
                }
              />

              <Box
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                  mb: 2,
                  backgroundColor: mealPrepActive
                    ? "action.hover"
                    : "transparent",
                  opacity: isLogging ? 0.5 : 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={mealPrepActive}
                      onChange={(e) => setMealPrepActive(e.target.checked)}
                      disabled={isLogging}
                    />
                  }
                  label="Meal Prep Mode"
                  sx={{ mb: mealPrepActive ? 1 : 0 }}
                />
                {mealPrepActive && (
                  <Box pl={1}>
                    <RadioGroup
                      aria-label="meal-prep-mode"
                      value={prepMode}
                      onChange={(e) =>
                        !isLogging && setPrepMode(e.target.value)
                      }
                      name="meal-prep-mode-group"
                    >
                      <FormControlLabel
                        value="days"
                        control={<Radio size="small" disabled={isLogging} />}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            Next&nbsp;
                            <TextField
                              value={prepDays}
                              disabled={isLogging}
                              onChange={(e) =>
                                !isLogging &&
                                setPrepDays(
                                  Math.max(1, Number(e.target.value) || 1)
                                )
                              }
                              type="number"
                              size="small"
                              sx={{ width: "60px", mx: 0.5 }}
                              inputProps={{ min: 1 }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={() => setPrepMode("days")}
                            />
                            &nbsp;Days
                          </Box>
                        }
                      />

                      <FormControlLabel
                        value="week"
                        control={<Radio size="small" disabled={isLogging} />}
                        label="This Week (Rest of Week)"
                      />

                      <FormControlLabel
                        value="custom"
                        control={<Radio size="small" disabled={isLogging} />}
                        label="Custom Schedule"
                      />
                      {prepMode === "custom" && (
                        <Box sx={{ pl: 3, mt: 0.5, mb: 1 }}>
                          <FormGroup row sx={{ mb: 1 }}>
                            {Object.keys(prepSelectedDays).map((day) => (
                              <FormControlLabel
                                key={day}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={prepSelectedDays[day]}
                                    onChange={handlePrepDayChange}
                                    name={day}
                                    disabled={isLogging}
                                  />
                                }
                                label={
                                  day.charAt(0).toUpperCase() + day.slice(1, 3)
                                }
                                sx={{ mr: 0.5 }}
                              />
                            ))}
                          </FormGroup>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            For the Next&nbsp;
                            <TextField
                              value={prepWeeks}
                              disabled={isLogging}
                              onChange={(e) =>
                                !isLogging &&
                                setPrepWeeks(
                                  Math.max(1, Number(e.target.value) || 1)
                                )
                              }
                              type="number"
                              size="small"
                              sx={{ width: "60px", mx: 0.5 }}
                              inputProps={{ min: 1 }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            &nbsp;Weeks
                          </Box>
                        </Box>
                      )}
                    </RadioGroup>
                  </Box>
                )}
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleLogFood}
                disabled={
                  !servingAmount ||
                  Number(servingAmount) <= 0 ||
                  isLogging ||
                  (mealPrepActive &&
                    ((prepMode === "days" && prepDays <= 0) ||
                      (prepMode === "custom" && prepWeeks <= 0)))
                }
                sx={{ mb: 1 }}
              >
                {isLogging
                  ? "Logging..."
                  : mealPrepActive
                  ? "Log Meal Prep"
                  : "Log Food"}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                disabled={
                  isLogging || !servingAmount || Number(servingAmount) <= 0
                }
                onClick={handleAvoidFood}
              >
                Changed My Mind (Avoided)
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
              Nutrition Facts ({(Number(currentGrams) || 0).toFixed(0)}g)
            </Typography>
            {Object.entries(NUTRIENT_CATEGORIES).map(
              ([categoryKey, categoryName]) => {
                const baseNutrientsInCategory = baseNutrientData.nutrients?.[
                  categoryKey
                ]?.filter((n) => n.value > 0);

                if (
                  !baseNutrientsInCategory ||
                  baseNutrientsInCategory.length === 0
                ) {
                  return null;
                }

                const nutrientCards = baseNutrientsInCategory.map((n) => {
                  const metadata = NUTRIENT_METADATA[n.id] || {};
                  const scaledValue = n.value * displayScaleFactor;
                  const dvPercent = calculateDVPercent(
                    scaledValue,
                    n.unit,
                    metadata.dv,
                    metadata.unit,
                    n.id,
                    n.name
                  );
                  const calorieContribution =
                    metadata.category === "macronutrients" &&
                    CALORIE_FACTORS[n.name]
                      ? scaledValue * CALORIE_FACTORS[n.name]
                      : null;

                  // Determine if using custom settings
                  const isUsingCustomTarget =
                    n.id === 1008 || // Energy/Calories
                    n.name === "Protein" ||
                    n.name === "Total Fat" ||
                    n.name === "Carbohydrates" ||
                    userNutrientOverrides[n.id];

                  return {
                    ...n,
                    scaledValue,
                    icon: metadata.icon,
                    dvPercent,
                    calorieContribution,
                    isUsingCustomTarget,
                  };
                });

                return (
                  <Accordion
                    key={categoryKey}
                    expanded={expandedPanel === categoryKey}
                    onChange={handleAccordionChange(categoryKey)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{categoryName}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 1 }}>
                      <Grid container spacing={1}>
                        {nutrientCards.map((nutrient) => (
                          <Grid item xs={6} sm={4} md={3} key={nutrient.id}>
                            <Card
                              variant="outlined"
                              sx={{
                                height: "100%",
                                minHeight: "150px",
                                width: "100%",
                              }}
                            >
                              <CardContent
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  height: "100%",
                                  p: 1.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 1,
                                  }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      minWidth: "35px",
                                      color: "primary.main",
                                    }}
                                  >
                                    {getIcon(nutrient.icon)}
                                  </ListItemIcon>
                                  <Typography
                                    variant="subtitle2"
                                    component="div"
                                    sx={{ flexGrow: 1, minWidth: 0 }}
                                  >
                                    {nutrient.name}
                                  </Typography>
                                </Box>

                                <Typography
                                  variant="h6"
                                  component="div"
                                  align="center"
                                  sx={{
                                    mb: 1,
                                    flexGrow: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                  }}
                                >
                                  {formatNutrientValue(
                                    nutrient.scaledValue,
                                    nutrient.unit
                                  )}
                                  {nutrient.calorieContribution !== null &&
                                    !isZeroServing && (
                                      <Typography
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                      >
                                        (~
                                        {nutrient.calorieContribution.toFixed(
                                          0
                                        )}{" "}
                                        kcal)
                                      </Typography>
                                    )}
                                </Typography>

                                {!isZeroServing && nutrient.dvPercent > 0 ? (
                                  <Box sx={{ width: "100%", height: "24px" }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={nutrient.dvPercent}
                                      sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        mb: 0.5,
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      align="right"
                                    >
                                      {nutrient.dvPercent}% DV
                                      {nutrient.isUsingCustomTarget ? (
                                        <Tooltip title="Using your custom nutrient target">
                                          <span
                                            style={{
                                              marginLeft: 4,
                                              color: "primary.main",
                                            }}
                                          >
                                            ✓
                                          </span>
                                        </Tooltip>
                                      ) : (
                                        <Tooltip title="Using default recommended target">
                                          <span
                                            style={{
                                              marginLeft: 4,
                                              color: "text.secondary",
                                              fontSize: "0.75rem",
                                            }}
                                          >
                                            •
                                          </span>
                                        </Tooltip>
                                      )}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Box sx={{ height: "24px" }} />
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              }
            )}
            {Object.values(baseNutrientData.nutrients || {}).flat().length ===
              0 &&
              !loading && (
                <Typography color="textSecondary" sx={{ mt: 2 }}>
                  No nutrient data available for this item.
                </Typography>
              )}
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default FoodDetail;
