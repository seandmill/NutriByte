import { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  FormControl,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  ExpandMore as ExpandMoreIcon,
  ShowChart as ShowChartIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { format, parseISO, differenceInDays } from "date-fns";
import axios from "axios";

import Layout from "../components/Layout.jsx";
import { getFilteredFoodLogs } from "@clientApi/logApi.js";
import {
  getMineralsSummary,
  normalizeNutrientData,
  getCompleteNutrientData,
} from "@clientApi/analyticsApi.js";
import {
  calculateDailyAverage,
  getCalorieBreakdown,
  getTimeSeriesData,
  getFilterOptions,
} from "../utils/analyticsUtils.js";
import { NUTRIENT_METADATA, NUTRIENT_CATEGORIES } from "../utils/nutrientUtils.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Dashboard theme colors
const CHART_COLORS = {
  calories: "rgba(255, 99, 132, 0.8)",
  protein: "rgba(54, 162, 235, 0.8)",
  fat: "rgba(255, 206, 86, 0.8)",
  carbs: "rgba(75, 192, 192, 0.8)",
  fiber: "rgba(153, 102, 255, 0.8)",
  vitamins: "rgba(255, 159, 64, 0.8)",
  minerals: "rgba(231, 233, 237, 0.8)",
  caloriesLight: "rgba(255, 99, 132, 0.2)",
  proteinLight: "rgba(54, 162, 235, 0.2)",
  fatLight: "rgba(255, 206, 86, 0.2)",
  carbsLight: "rgba(75, 192, 192, 0.2)",
  fiberLight: "rgba(153, 102, 255, 0.2)",
};

// Scorecard Component
const ScoreCard = ({ title, value, unit, changePercent, icon }) => {
  // Calculate per-day average if we have a total
  const valueParts = value.toString().split(".");
  const total = parseInt(valueParts[0]);
  const daysWithLogs = value > 0 ? Math.ceil(total / (total / 30)) : 0; // Estimate based on typical daily values
  const dailyAvg = daysWithLogs > 0 ? (total / daysWithLogs).toFixed(1) : 0;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "120px",
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" color="text.secondary" fontWeight="medium">
          {title}
        </Typography>
        {icon}
      </Box>
      <Box sx={{ display: "flex", alignItems: "baseline" }}>
        <Typography
          variant="h3"
          component="div"
          fontWeight="bold"
          sx={{ flexGrow: 1 }}
        >
          {total}
          <Typography
            component="span"
            variant="subtitle1"
            fontWeight="normal"
            sx={{ ml: 0.5 }}
          >
            {unit}
          </Typography>
        </Typography>
        {changePercent !== undefined && (
          <Chip
            label={`${changePercent > 0 ? "+" : ""}${changePercent}%`}
            size="small"
            color={
              changePercent > 0
                ? "success"
                : changePercent < 0
                ? "error"
                : "default"
            }
            sx={{ ml: 1 }}
          />
        )}
      </Box>
      <Box sx={{ mt: 1 }}>
        <Typography
          variant="body2"
          component="div"
          fontStyle="italic"
          color="text.secondary"
        >
          {dailyAvg} {unit}/day over {daysWithLogs} days
        </Typography>
      </Box>
    </Paper>
  );
};

// LineChart Component for Trends
const TrendLineChart = ({
  title,
  data,
  labels,
  color,
  borderColor,
  fillColor,
}) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: borderColor || color,
        backgroundColor: fillColor || "rgba(255, 255, 255, 0.1)",
        borderWidth: 2,
        fill: !!fillColor,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h6"
        color="text.secondary"
        fontWeight="medium"
        sx={{ mb: 2 }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

// Composition Chart (Doughnut/Pie)
const CompositionChart = ({ title, data, labels, colors }) => {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h6"
        color="text.secondary"
        fontWeight="medium"
        sx={{ mb: 2 }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 250,
        }}
      >
        <Doughnut data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

// NutrientGroup Component (Accordion)
const NutrientGroup = ({
  categoryKey,
  categoryName,
  nutrients,
  logs,
  expanded,
  handleExpandChange,
  logType,
  startDate,
  endDate,
  directMineralData,
}) => {
  return (
    <Accordion
      expanded={expanded === categoryKey}
      onChange={handleExpandChange(categoryKey)}
      sx={{ mt: 1 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{categoryName}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {nutrients
            .map((nutrient) => {
              // Initialize variables for both calculation methods
              let average = 0;
              let timeSeriesData = getTimeSeriesData(
                logs,
                nutrient.id.toString(),
                logType
              );

              // Special handling for minerals using direct data
              if (categoryKey === "minerals" && directMineralData) {
                // Use direct mineral data for minerals
                const mineralName = nutrient.name.toLowerCase();
                if (directMineralData[mineralName] !== undefined) {
                  average = directMineralData[mineralName];
                } else {
                  // Use traditional calculation as fallback
                  average = calculateDailyAverage(
                    logs,
                    nutrient.id.toString(),
                    logType,
                    startDate,
                    endDate,
                    true
                  );
                }
              } else {
                // Use traditional calculation for non-minerals
                average = calculateDailyAverage(
                  logs,
                  nutrient.id.toString(),
                  logType,
                  startDate,
                  endDate,
                  true
                );
              }

              // Skip rendering nutrients with zero values
              if (average === 0) {
                return null;
              }

              return (
                <Grid item xs={12} md={6} key={nutrient.id}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {nutrient.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 1,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h5"
                        component="div"
                        fontWeight="medium"
                      >
                        {average}
                      </Typography>
                      <Typography
                        component="span"
                        variant="subtitle2"
                        sx={{ ml: 0.5, minWidth: "55px" }}
                      >
                        {nutrient.unit}/day
                      </Typography>
                      {nutrient.dv && (
                        <Box
                          sx={{
                            ml: "auto",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mr: 1, minWidth: "80px", textAlign: "right" }}
                          >
                            {Math.round((average / nutrient.dv) * 100)}% of DV
                          </Typography>
                          <Box
                            sx={{
                              width: 80,
                              height: 8,
                              borderRadius: 4,
                              background: "#eee",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${Math.min(
                                  100,
                                  Math.round((average / nutrient.dv) * 100)
                                )}%`,
                                height: "100%",
                                background: CHART_COLORS.calories,
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {timeSeriesData.length > 1 && (
                      <Box sx={{ height: 150 }}>
                        <Line
                          data={{
                            labels: timeSeriesData.map((d) =>
                              format(parseISO(d.date), "MMM d")
                            ),
                            datasets: [
                              {
                                label: nutrient.name,
                                data: timeSeriesData.map((d) => d.value),
                                borderColor: CHART_COLORS.calories,
                                backgroundColor: "transparent",
                                borderWidth: 2,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              x: {
                                display: true,
                                grid: {
                                  display: false,
                                },
                              },
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })
            .filter(Boolean)}{" "}
          {/* Filter out null items (zero values) */}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

const AnalyticsDashboard = () => {
  // State variables
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPanel, setExpandedPanel] = useState("minerals");

  // New state for direct mineral data
  const [mineralData, setMineralData] = useState(null);

  // Filter states
  const [startDate, setStartDate] = useState(() => {
    // Default to 30 days prior to today
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [logType, setLogType] = useState("consumed");
  const [selectedBrandOwners, setSelectedBrandOwners] = useState([]);
  const [selectedBrandNames, setSelectedBrandNames] = useState([]);
  const [selectedFoodCategories, setSelectedFoodCategories] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Filter options (populated from logs)
  const [filterOptions, setFilterOptions] = useState({
    brandOwners: [],
    brandNames: [],
    foodCategories: [],
    ingredients: [],
  });

  // Fetch logs and minerals when component mounts
  useEffect(() => {
    fetchLogs();
    fetchMinerals();
  }, []);

  // Apply filters when filter criteria change
  useEffect(() => {
    if (logs.length > 0) {
      applyFilters();
    }
  }, [
    logs,
    startDate,
    endDate,
    logType,
    selectedBrandOwners,
    selectedBrandNames,
    selectedFoodCategories,
    selectedIngredients,
  ]);

  // Fetch all logs
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      let response = [];
      let source = "unknown";

      // Try each data source in sequence until one works

      // 1. Try complete nutrient data first
      try {
        console.log("ATTEMPT 1: Trying getCompleteNutrientData...");
        const data = await getCompleteNutrientData();
        if (data && Array.isArray(data) && data.length > 0) {
          response = data;
          source = "complete nutrients";
          console.log(
            "✅ getCompleteNutrientData succeeded with",
            data.length,
            "logs"
          );
        } else {
          console.warn(
            "⚠️ getCompleteNutrientData returned empty or invalid data"
          );
        }
      } catch (err) {
        console.warn("⚠️ getCompleteNutrientData failed:", err.message);
      }

      // 2. If that fails, try regular filtered logs
      if (response.length === 0) {
        try {
          console.log("ATTEMPT 2: Trying getFilteredFoodLogs...");
          const data = await getFilteredFoodLogs();
          if (data && Array.isArray(data) && data.length > 0) {
            response = data;
            source = "filtered logs";
            console.log(
              "✅ getFilteredFoodLogs succeeded with",
              data.length,
              "logs"
            );
          } else {
            console.warn(
              "⚠️ getFilteredFoodLogs returned empty or invalid data"
            );
          }
        } catch (err) {
          console.warn("⚠️ getFilteredFoodLogs failed:", err.message);
        }
      }

      // 3. If that still fails, try direct API call
      if (response.length === 0) {
        try {
          console.log("ATTEMPT 3: Trying direct axios call...");
          // Get API URL using the same conditional logic
          const apiUrl = (() => {
            const envUrl = import.meta.env.VITE_API_URL || "";
            // If we're using a Vite dev server with a proxy, don't use the full URL
            if (
              window.location.hostname === "localhost" &&
              window.location.port === "8080"
            ) {
              return ""; // Use relative URLs to leverage the proxy
            }
            return envUrl; // Otherwise use the full URL from .env
          })();

          const headers = { "X-User-Email": localStorage.getItem("userEmail") };

          const { data } = await axios.get(`${apiUrl}/api/logs`, { headers });
          if (data && Array.isArray(data) && data.length > 0) {
            response = data;
            source = "direct API";
            console.log(
              "✅ Direct API call succeeded with",
              data.length,
              "logs"
            );
          } else {
            console.warn("⚠️ Direct API call returned empty or invalid data");
          }
        } catch (err) {
          console.warn("⚠️ Direct API call failed:", err.message);
        }
      }

      // If we still have no data, fail
      if (response.length === 0) {
        throw new Error("All data retrieval methods failed");
      }

      console.log(
        `Successfully retrieved ${response.length} logs from ${source}`
      );

      // Ensure response is an array before normalizing
      const normalizedLogs = normalizeNutrientData(response);

      if (normalizedLogs.length > 0) {
        // Debug to see the entire structure of the first log
        console.log(
          "First log data:",
          JSON.stringify(normalizedLogs[0], null, 2)
        );

        // Specifically check nutrients
        if (normalizedLogs[0].nutrients) {
          console.log(
            "Nutrients keys:",
            Object.keys(normalizedLogs[0].nutrients)
          );

          // Check for calcium specifically
          if (normalizedLogs[0].nutrients["1087"]) {
            console.log(
              "Calcium data in first log:",
              normalizedLogs[0].nutrients["1087"]
            );
          } else {
            console.log("Calcium data not found in first log");
          }
        } else {
          console.log("No nutrients object in first log");
        }

        // Check for the exact location of the calcium value
        const calciumLogs = normalizedLogs.filter((log) => {
          if (!log.nutrients) return false;
          return Object.keys(log.nutrients).includes("1087");
        });

        console.log(`Found ${calciumLogs.length} logs with calcium data`);
        if (calciumLogs.length > 0) {
          console.log(
            "Calcium data example:",
            calciumLogs[0].nutrients["1087"]
          );
        }
      } else {
        console.warn("No logs found or empty logs array returned");
      }

      setLogs(normalizedLogs);
      setFilteredLogs(normalizedLogs);

      // Extract filter options from normalized logs
      setFilterOptions(getFilterOptions(normalizedLogs));
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Failed to load nutrition data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch mineral data directly
  const fetchMinerals = async () => {
    try {
      const data = await getMineralsSummary();
      setMineralData(data);
    } catch (err) {
      console.error("Failed to fetch mineral data:", err);
      // Don't set error state - we'll fall back to the regular calculation
    }
  };

  // Apply filters to logs
  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.logDate || log.date);

        // Create date-only strings in local timezone for comparison
        const getDateString = (date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`;
        };

        // Get string representations for easier comparison
        const logDateStr = getDateString(logDate);
        const startDateStr = getDateString(startDate);
        const endDateStr = getDateString(endDate);

        // Check if logDate is in the range [startDate, endDate] inclusive
        return logDateStr >= startDateStr && logDateStr <= endDateStr;
      });
    }

    // Filter by log type
    filtered = filtered.filter((log) => log.logType === logType);

    // Filter by brand owner
    if (selectedBrandOwners.length > 0) {
      filtered = filtered.filter(
        (log) => log.brandOwner && selectedBrandOwners.includes(log.brandOwner)
      );
    }

    // Filter by brand name
    if (selectedBrandNames.length > 0) {
      filtered = filtered.filter(
        (log) => log.brandName && selectedBrandNames.includes(log.brandName)
      );
    }

    // Filter by food category
    if (selectedFoodCategories.length > 0) {
      filtered = filtered.filter(
        (log) =>
          log.brandedFoodCategory &&
          selectedFoodCategories.includes(log.brandedFoodCategory)
      );
    }

    // Filter by ingredients (more complex)
    if (selectedIngredients.length > 0) {
      filtered = filtered.filter((log) => {
        // Check in parsed ingredients array
        if (Array.isArray(log.parsedIngredients)) {
          return selectedIngredients.some((ingredient) =>
            log.parsedIngredients.includes(ingredient)
          );
        }

        // Fallback to full ingredients string search
        if (log.ingredients) {
          return selectedIngredients.some((ingredient) =>
            log.ingredients.toLowerCase().includes(ingredient.toLowerCase())
          );
        }

        return false;
      });
    }

    setFilteredLogs(filtered);
  };

  // Toggle panels
  const handleExpandChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedBrandOwners([]);
    setSelectedBrandNames([]);
    setSelectedFoodCategories([]);
    setSelectedIngredients([]);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    // Get API URL using the same conditional logic as other API calls
    const apiUrl = (() => {
      const envUrl = import.meta.env.VITE_API_URL || "";
      // If we're using a Vite dev server with a proxy, don't use the full URL
      if (
        window.location.hostname === "localhost" &&
        window.location.port === "8080"
      ) {
        return ""; // Use relative URLs to leverage the proxy
      }
      return envUrl; // Otherwise use the full URL from .env
    })();

    // Prepare query params for the filtered data
    const params = new URLSearchParams();

    // Add date range if selected
    if (startDate) {
      params.append("startDate", startDate.toISOString().split("T")[0]);
    }
    if (endDate) {
      params.append("endDate", endDate.toISOString().split("T")[0]);
    }

    // Add log type filter
    params.append("logTypes", logType);

    // Add other filters if selected
    if (selectedBrandOwners.length > 0) {
      selectedBrandOwners.forEach((brand) => {
        params.append("brandOwners", brand);
      });
    }

    if (selectedBrandNames.length > 0) {
      selectedBrandNames.forEach((brand) => {
        params.append("brandNames", brand);
      });
    }

    if (selectedFoodCategories.length > 0) {
      selectedFoodCategories.forEach((category) => {
        params.append("foodCategories", category);
      });
    }

    if (selectedIngredients.length > 0) {
      selectedIngredients.forEach((ingredient) => {
        params.append("ingredients", ingredient);
      });
    }

    // Construct the full URL with query parameters
    const url = `${apiUrl}/api/logs/export/csv?${params.toString()}`;

    // Add auth header to URL
    const headers = new Headers();
    headers.append("X-User-Email", localStorage.getItem("userEmail"));

    // Create a temporary link element to trigger the download
    fetch(url, {
      headers,
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Export failed");
        }
        return response.blob();
      })
      .then((blob) => {
        // Create a date string for the filename
        const dateStr = new Date().toISOString().split("T")[0];
        const filename = `nutribyte_food_log_${dateStr}.csv`;

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((error) => {
        console.error("Error exporting data:", error);
        alert("Failed to export data. Please try again.");
      });
  };

  // Handle log type change
  const handleLogTypeChange = (event, newLogType) => {
    if (newLogType !== null) {
      // Check if we're switching between prepped and non-prepped
      const isPreppedToggle =
        (newLogType === "prepped" &&
          (logType === "consumed" || logType === "avoided")) ||
        (logType === "prepped" &&
          (newLogType === "consumed" || newLogType === "avoided"));

      // Update the log type
      setLogType(newLogType);

      // Only reset dates when toggling between prepped and non-prepped
      if (isPreppedToggle) {
        if (newLogType === "prepped") {
          // For prepped meals, default to today and 30 days in the future
          const today = new Date();
          const thirtyDaysAhead = new Date();
          thirtyDaysAhead.setDate(today.getDate() + 30);

          setStartDate(today);
          setEndDate(thirtyDaysAhead);
        } else {
          // For consumed/avoided, set start date to earliest log date
          // Find the earliest log date for consumed/avoided logs
          const relevantLogs = logs.filter(
            (log) => log.logType === "consumed" || log.logType === "avoided"
          );

          if (relevantLogs.length > 0) {
            const dates = relevantLogs.map(
              (log) => new Date(log.logDate || log.date)
            );
            const earliestDate = new Date(Math.min(...dates));
            setStartDate(earliestDate);
            setEndDate(new Date()); // Set to today
          }
        }
      }
      // Note: When switching between consumed and avoided, we keep the same date range
    }
  };

  // Calculate date constraints based on log type
  const today = new Date();
  const getMaxDate = () => {
    return logType === "consumed" || logType === "avoided" ? today : null;
  };

  const getMinDate = () => {
    return logType === "prepped" ? today : null;
  };

  // Calculate analytics
  const calorieAvg = calculateDailyAverage(
    filteredLogs,
    "1008",
    logType,
    startDate,
    endDate,
    true
  );
  const proteinAvg = calculateDailyAverage(
    filteredLogs,
    "1003",
    logType,
    startDate,
    endDate,
    true
  );
  const fatAvg = calculateDailyAverage(
    filteredLogs,
    "1004",
    logType,
    startDate,
    endDate,
    true
  );
  const carbsAvg = calculateDailyAverage(
    filteredLogs,
    "1005",
    logType,
    startDate,
    endDate,
    true
  );
  const fiberAvg = calculateDailyAverage(
    filteredLogs,
    "1079",
    logType,
    startDate,
    endDate,
    true
  );

  // Get calorie breakdown
  const calorieBreakdown = getCalorieBreakdown(filteredLogs, logType);

  // Get time series data for main nutrients
  const caloriesTimeSeries = getTimeSeriesData(filteredLogs, "1008", logType);
  const proteinTimeSeries = getTimeSeriesData(filteredLogs, "1003", logType);
  const fatTimeSeries = getTimeSeriesData(filteredLogs, "1004", logType);
  const carbsTimeSeries = getTimeSeriesData(filteredLogs, "1005", logType);

  // Prepare time labels (use the same for all charts)
  const timeLabels = caloriesTimeSeries.map((d) =>
    format(parseISO(d.date), "MMM d")
  );

  // Prepare nutrient groups for accordions
  const nutrientGroups = Object.entries(NUTRIENT_CATEGORIES)
    .filter(([key]) => key !== "macronutrients") // Exclude macros as they're handled separately
    .map(([key, name]) => {
      const nutrients = Object.entries(NUTRIENT_METADATA)
        .filter((entry) => entry[1].category === key) // Use entry[1] to avoid unused variable
        .map(([id, meta]) => ({ id: parseInt(id), ...meta }));

      return { key, name, nutrients };
    });

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mt: 2, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Nutrition Analytics
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="60vh"
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Horizontal Filter Bar */}
              <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Log Type Filter */}
                  <Grid item xs={12} sm={6} md={3} lg={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Log Type
                    </Typography>
                    <ToggleButtonGroup
                      value={logType}
                      exclusive
                      onChange={handleLogTypeChange}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="consumed">Consumed</ToggleButton>
                      <ToggleButton value="avoided">Avoided</ToggleButton>
                      <ToggleButton value="prepped">Meal Prep</ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  {/* Date Range */}
                  <Grid item xs={12} sm={6} md={3} lg={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Typography variant="subtitle2" gutterBottom>
                        Start Date
                      </Typography>
                      <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        format="MMM dd, yyyy"
                        minDate={getMinDate()}
                        maxDate={endDate || getMaxDate()}
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3} lg={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Typography variant="subtitle2" gutterBottom>
                        End Date
                      </Typography>
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        format="MMM dd, yyyy"
                        minDate={startDate || getMinDate()}
                        maxDate={getMaxDate()}
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  {/* Brand Owner Filter */}
                  <Grid item xs={12} sm={6} md={3} lg={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Brand Owner
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        multiple
                        value={selectedBrandOwners}
                        onChange={(e) => setSelectedBrandOwners(e.target.value)}
                        input={<OutlinedInput />}
                        renderValue={(selected) =>
                          selected.length > 0
                            ? `${selected.length} selected`
                            : "None"
                        }
                        displayEmpty
                      >
                        {filterOptions.brandOwners.map((brand) => (
                          <MenuItem key={brand} value={brand}>
                            <Checkbox
                              checked={selectedBrandOwners.indexOf(brand) > -1}
                            />
                            <ListItemText primary={brand} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Brand Name Filter */}
                  <Grid item xs={12} sm={6} md={3} lg={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Brand Name
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        multiple
                        value={selectedBrandNames}
                        onChange={(e) => setSelectedBrandNames(e.target.value)}
                        input={<OutlinedInput />}
                        renderValue={(selected) =>
                          selected.length > 0
                            ? `${selected.length} selected`
                            : "None"
                        }
                        displayEmpty
                      >
                        {filterOptions.brandNames.map((brand) => (
                          <MenuItem key={brand} value={brand}>
                            <Checkbox
                              checked={selectedBrandNames.indexOf(brand) > -1}
                            />
                            <ListItemText primary={brand} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Food Category Filter */}
                  <Grid item xs={12} sm={6} md={3} lg={1}>
                    <Typography variant="subtitle2" gutterBottom>
                      Category
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        multiple
                        value={selectedFoodCategories}
                        onChange={(e) =>
                          setSelectedFoodCategories(e.target.value)
                        }
                        input={<OutlinedInput />}
                        renderValue={(selected) =>
                          selected.length > 0
                            ? `${selected.length} selected`
                            : "None"
                        }
                        displayEmpty
                      >
                        {filterOptions.foodCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            <Checkbox
                              checked={
                                selectedFoodCategories.indexOf(category) > -1
                              }
                            />
                            <ListItemText primary={category} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Reset Button */}
                  <Grid item xs={12} sm={6} md={3} lg={1}>
                    <Typography variant="subtitle2" gutterBottom>
                      &nbsp;
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleResetFilters}
                      fullWidth
                    >
                      Reset Filters
                    </Button>
                  </Grid>

                  {/* Export CSV Button */}
                  <Grid item xs={12} sm={6} md={3} lg={1}>
                    <Typography variant="subtitle2" gutterBottom>
                      Export
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleExportCSV}
                      fullWidth
                      startIcon={<FileDownloadIcon />}
                      color="secondary"
                    >
                      CSV
                    </Button>
                  </Grid>

                  {/* Filter stats */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {filteredLogs.length} logs
                      {startDate && endDate
                        ? ` over ${
                            differenceInDays(endDate, startDate) + 1
                          } days`
                        : ""}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Scorecards Row */}
              <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid
                  container
                  spacing={3}
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Grid item xs={12} sm={6} md={2.2} sx={{ flexGrow: 1 }}>
                    <ScoreCard
                      title="Calories"
                      value={calorieAvg}
                      unit="kcal"
                      icon={<ShowChartIcon color="primary" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.2} sx={{ flexGrow: 1 }}>
                    <ScoreCard
                      title="Protein"
                      value={proteinAvg}
                      unit="g"
                      icon={<ShowChartIcon color="primary" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.2} sx={{ flexGrow: 1 }}>
                    <ScoreCard
                      title="Fat"
                      value={fatAvg}
                      unit="g"
                      icon={<ShowChartIcon color="primary" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.2} sx={{ flexGrow: 1 }}>
                    <ScoreCard
                      title="Carbs"
                      value={carbsAvg}
                      unit="g"
                      icon={<ShowChartIcon color="primary" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.2} sx={{ flexGrow: 1 }}>
                    <ScoreCard
                      title="Fiber"
                      value={fiberAvg}
                      unit="g"
                      icon={<ShowChartIcon color="primary" />}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Charts Row */}
              <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid
                  container
                  spacing={4}
                  sx={{ display: "flex", justifyContent: "stretch" }}
                >
                  {/* Calories Line Chart */}
                  <Grid item xs={12} md={4} sx={{ flexGrow: 1, width: "33%" }}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        height: "100%",
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        fontWeight="medium"
                        sx={{ mb: 2 }}
                      >
                        Calories Over Time
                      </Typography>
                      <Box sx={{ height: "250px" }}>
                        <Line
                          data={{
                            labels: timeLabels,
                            datasets: [
                              {
                                label: "Calories",
                                data: caloriesTimeSeries.map((d) => d.value),
                                borderColor: CHART_COLORS.calories,
                                backgroundColor: CHART_COLORS.caloriesLight,
                                fill: true,
                                tension: 0.2,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Calorie Composition */}
                  <Grid item xs={12} md={4} sx={{ flexGrow: 1, width: "33%" }}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        height: "100%",
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        fontWeight="medium"
                        sx={{ mb: 2 }}
                      >
                        Calorie Composition
                      </Typography>
                      <Box sx={{ height: "250px" }}>
                        <Doughnut
                          data={{
                            labels: ["Protein", "Fat", "Carbs"],
                            datasets: [
                              {
                                data: [
                                  calorieBreakdown.proteinPercent,
                                  calorieBreakdown.fatPercent,
                                  calorieBreakdown.carbsPercent,
                                ],
                                backgroundColor: [
                                  CHART_COLORS.protein,
                                  CHART_COLORS.fat,
                                  CHART_COLORS.carbs,
                                ],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "right",
                              },
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Macronutrient Trends */}
                  <Grid item xs={12} md={4} sx={{ flexGrow: 1, width: "33%" }}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        height: "100%",
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        fontWeight="medium"
                        sx={{ mb: 2 }}
                      >
                        Macronutrient Trends
                      </Typography>
                      <Box sx={{ height: "250px" }}>
                        <Line
                          data={{
                            labels: timeLabels,
                            datasets: [
                              {
                                label: "Protein (g)",
                                data: proteinTimeSeries.map((d) => d.value),
                                borderColor: CHART_COLORS.protein,
                                backgroundColor: "transparent",
                                borderWidth: 2,
                              },
                              {
                                label: "Fat (g)",
                                data: fatTimeSeries.map((d) => d.value),
                                borderColor: CHART_COLORS.fat,
                                backgroundColor: "transparent",
                                borderWidth: 2,
                              },
                              {
                                label: "Carbs (g)",
                                data: carbsTimeSeries.map((d) => d.value),
                                borderColor: CHART_COLORS.carbs,
                                backgroundColor: "transparent",
                                borderWidth: 2,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                              mode: "index",
                              intersect: false,
                            },
                            plugins: {
                              tooltip: {
                                mode: "index",
                                intersect: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>

              {/* Nutrient Accordions */}
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                {nutrientGroups.map((group) => (
                  <NutrientGroup
                    key={group.key}
                    categoryKey={group.key}
                    categoryName={group.name}
                    nutrients={group.nutrients}
                    logs={filteredLogs}
                    expanded={expandedPanel}
                    handleExpandChange={handleExpandChange}
                    logType={logType}
                    startDate={startDate}
                    endDate={endDate}
                    directMineralData={
                      group.key === "minerals" ? mineralData : null
                    }
                  />
                ))}
              </Paper>
            </>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default AnalyticsDashboard;
