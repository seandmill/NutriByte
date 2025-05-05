import axios from "axios";

// Simplified API URL - directly use /api for all environments
const API_BASE = "/api";

const getAuthHeaders = () => ({
  "X-User-Email": localStorage.getItem("userEmail"),
});

export const getFoodLogs = async () => {
  try {
    console.log("🔍 Attempting to fetch logs from:", `${API_BASE}/logs`);
    const response = await axios.get(`${API_BASE}/logs`, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Successfully fetched logs:", response.data.length);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch food logs:", error);
    console.error("Request URL was:", `${API_BASE}/logs`);
    console.error("Response status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    throw error;
  }
};

export const createFoodLog = async (logData) => {
  try {
    const response = await axios.post(`${API_BASE}/logs`, logData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create food log:", error);
    throw error;
  }
};

export const updateFoodLog = async (logId, updates) => {
  try {
    const response = await axios.put(`${API_BASE}/logs/${logId}`, updates, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update food log:", error);
    throw error;
  }
};

export const deleteFoodLog = async (logId) => {
  try {
    await axios.delete(`${API_BASE}/logs/${logId}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error("Failed to delete food log:", error);
    throw error;
  }
};

/**
 * Fetches food logs with filtering options for analytics
 * @param {Object} filters - The filter criteria
 * @param {Date|string} filters.startDate - Start date for logs
 * @param {Date|string} filters.endDate - End date for logs
 * @param {string[]} filters.brandOwners - List of brand owners to filter by
 * @param {string[]} filters.brandNames - List of brand names to filter by
 * @param {string[]} filters.foodCategories - List of food categories to filter by
 * @param {string[]} filters.ingredients - List of ingredients to filter by
 * @param {string[]} filters.logTypes - Types of logs to include (consumed, prepped, avoided)
 * @returns {Promise<Array>} The filtered food logs
 */
export const getFilteredFoodLogs = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/logs/analytics`, {
      headers: getAuthHeaders(),
      params: filters,
    });

    // Debug the first log to see structure
    if (response.data && response.data.length > 0) {
      console.log(
        "Raw API response - first log:",
        JSON.stringify(response.data[0], null, 2)
      );

      // Check specifically for mineral nutrients
      const firstLog = response.data[0];
      if (firstLog.nutrients) {
        console.log("Nutrients in first log:", Object.keys(firstLog.nutrients));

        // Check for calcium specifically
        if (firstLog.nutrients["1087"]) {
          console.log("Calcium data:", firstLog.nutrients["1087"]);
        } else {
          console.log("No calcium found in first log");
        }
      }
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetch filtered logs:", error);
    throw error;
  }
};

export const getFoodLog = async (logId) => {
  try {
    const response = await axios.get(`${API_BASE}/logs/${logId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch food log with ID ${logId}:`, error);
    throw error;
  }
};
