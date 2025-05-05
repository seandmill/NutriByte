import axios from "axios";

// Simplified API URL - directly use /api for all environments
const API_BASE = "/api";

// Get auth headers
const getAuthHeaders = () => ({
  "X-User-Email": localStorage.getItem("userEmail"),
});

// Get minerals summary directly from the server
export const getMineralsSummary = async () => {
  try {
    // Ask API for direct minerals calculation
    const response = await axios.get(`${API_BASE}/logs/nutrients`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    // If server-side endpoint isn't available, calculate client-side
    console.error(
      "Error fetching minerals data, calculating client-side:",
      error
    );

    try {
      // Fallback to client-side calculation
      const logs = await axios.get(`${API_BASE}/logs/all`, {
        headers: getAuthHeaders(),
      });

      // Extract minerals from log data
      const mineralsData = {
        calcium: 0,
        iron: 0,
        magnesium: 0,
        phosphorus: 0,
        potassium: 0,
        sodium: 0,
        zinc: 0,
      };

      // Map of nutrient IDs to minerals names
      const mineralIdMap = {
        1087: "calcium",
        1089: "iron",
        1090: "magnesium",
        1091: "phosphorus",
        1092: "potassium",
        1093: "sodium",
        1095: "zinc",
      };

      // Get minerals directly from the log data
      logs.data.forEach((log) => {
        // Handle both array format and object format
        if (!log.nutrients) return;

        // If nutrients exists but isn't in the right format, try alternative approaches
        if (Array.isArray(log.nutrients) && log.nutrients.length > 0) {
          // Handle array format
          log.nutrients.forEach((nutrient) => {
            if (nutrient.id && mineralIdMap[nutrient.id]) {
              const mineral = mineralIdMap[nutrient.id];
              mineralsData[mineral] += parseFloat(
                nutrient.value || nutrient.amount || 0
              );
            }
          });
        } else if (typeof log.nutrients === "object") {
          // Try to access minerals directly from the object
          Object.entries(log.nutrients).forEach(([key, nutrient]) => {
            if (mineralIdMap[key]) {
              const mineral = mineralIdMap[key];
              if (typeof nutrient === "object" && nutrient.value) {
                mineralsData[mineral] += parseFloat(nutrient.value) || 0;
              } else {
                mineralsData[mineral] += parseFloat(nutrient) || 0;
              }
            }
          });

          // Also check for direct properties on log
          if (log.calcium) mineralsData.calcium += parseFloat(log.calcium) || 0;
          if (log.iron) mineralsData.iron += parseFloat(log.iron) || 0;
          if (log.magnesium)
            mineralsData.magnesium += parseFloat(log.magnesium) || 0;
          if (log.phosphorus)
            mineralsData.phosphorus += parseFloat(log.phosphorus) || 0;
          if (log.potassium)
            mineralsData.potassium += parseFloat(log.potassium) || 0;
          if (log.sodium) mineralsData.sodium += parseFloat(log.sodium) || 0;
          if (log.zinc) mineralsData.zinc += parseFloat(log.zinc) || 0;
        }
      });

      console.log("Direct mineral calculation:", mineralsData);
      return mineralsData;
    } catch (fallbackError) {
      console.error("Fallback calculation failed:", fallbackError);
      throw fallbackError;
    }
  }
};

// Add a new utility function to normalize nutrient data format
export const normalizeNutrientData = (logData) => {
  if (!logData) return logData;

  // Handle case where logData is not an array
  if (!Array.isArray(logData)) {
    return logData;
  }

  return logData.map((log) => {
    // Skip if already properly formatted
    if (log.nutrients && Object.keys(log.nutrients).length > 0) {
      return log;
    }

    // Create nutrients object if it doesn't exist
    if (!log.nutrients) {
      log.nutrients = {};
    }

    // Add nutrients from direct properties if they exist
    if (log.calories !== undefined)
      log.nutrients["1008"] = {
        id: "1008",
        value: log.calories,
        name: "Energy",
        unit: "kcal",
      };
    if (log.protein !== undefined)
      log.nutrients["1003"] = {
        id: "1003",
        value: log.protein,
        name: "Protein",
        unit: "g",
      };
    if (log.fat !== undefined)
      log.nutrients["1004"] = {
        id: "1004",
        value: log.fat,
        name: "Total Fat",
        unit: "g",
      };
    if (log.carbs !== undefined)
      log.nutrients["1005"] = {
        id: "1005",
        value: log.carbs,
        name: "Carbohydrates",
        unit: "g",
      };

    return log;
  });
};

// Function to directly query the complete nutrients data
export const getCompleteNutrientData = async () => {
  try {
    // First attempt to use a special endpoint for raw nutrient data
    console.log("Attempting to fetch from rawnutrients endpoint...");
    const response = await axios.get(`${API_BASE}/logs/rawnutrients`, {
      headers: getAuthHeaders(),
    });
    console.log("Raw nutrients response status:", response.status);
    console.log(
      "Raw nutrients response:",
      response.data.length > 0 ? "Success!" : "Empty response"
    );
    return response.data;
  } catch (err) {
    console.error(
      "Failed to fetch raw nutrients, trying alternate approach:",
      err
    );

    // As a fallback, try direct MongoDB query via the server
    try {
      console.log("Attempting direct query...");
      const directQueryResponse = await axios.post(
        `${API_BASE}/logs/directquery`,
        {
          query: { collection: "foodlogs" },
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (directQueryResponse.data && directQueryResponse.data.length > 0) {
        console.log(
          "Direct query successful!",
          directQueryResponse.data.length,
          "logs found"
        );
        console.log(
          "Sample log nutrients:",
          Object.keys(directQueryResponse.data[0].nutrients || {}).length,
          "nutrient entries"
        );
        return directQueryResponse.data;
      } else {
        console.warn("Empty response from direct query");
        throw new Error("Empty response from direct query");
      }
    } catch (directErr) {
      console.error("Direct query failed:", directErr);

      // Final fallback - just use regular logs endpoint
      console.log("Falling back to regular logs endpoint...");
      const regularResponse = await axios.get(`${API_BASE}/logs`, {
        headers: getAuthHeaders(),
      });

      if (regularResponse.data && regularResponse.data.length > 0) {
        console.log(
          "Got",
          regularResponse.data.length,
          "logs from regular endpoint"
        );
        return regularResponse.data;
      }

      throw directErr;
    }
  }
};
