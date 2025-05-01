import axios from 'axios';

// Helper to get the auth token from localStorage
const getAuthHeaders = () => {
    const email = localStorage.getItem('userEmail');
    return email ? { 'X-User-Email': email } : {};
};

// Simplified API URL - directly use /api for all environments
const API_BASE = '/api';

/**
 * Fetches the current user's nutrient target configuration.
 * @returns {Promise<Object>} The user configuration object.
 */
export const getUserConfig = async () => {
    try {
        const response = await axios.get(`${API_BASE}/users/config`, {
            headers: getAuthHeaders()
        });
        console.log("Fetched config:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching user config:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch settings');
    }
};

/**
 * Updates the current user's nutrient target configuration.
 * @param {Object} configData - The configuration data to save.
 * @returns {Promise<Object>} The updated user configuration object.
 */
export const updateUserConfig = async (configData) => {
    try {
        const response = await axios.put(`${API_BASE}/users/config`, configData, {
            headers: getAuthHeaders()
        });
        console.log("Saved config response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating user config:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to save settings');
    }
};