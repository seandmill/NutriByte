import axios from 'axios';

// API Key is managed on the server side
const API_BASE = '/api';

/**
 * Search for foods in the USDA database via our backend proxy.
 * The search uses FDC's semantic search which may return:
 * - Exact matches
 * - Related food categories
 * - Foods with similar ingredients
 * - Common substitutes
 * 
 * @param {string} query - Search term(s)
 * @param {Object} options - Search options
 * @param {number} options.pageSize - Number of results per page
 * @param {number} options.pageNumber - Page number (1-based)
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort direction ('asc' or 'desc')
 * @returns {Promise<Object>} Object containing foods array and totalHits
 */
export const searchFoods = async (query, options = {}) => {
    if (!query || !query.trim()) {
        return { foods: [], totalHits: 0 };
    }

    const {
        pageSize = 25,
        pageNumber = 1,
        sortBy = 'score',
        sortOrder = 'desc'
    } = options;

    // Format query for better relevance:
    // 1. Exact phrase matching with quotes
    // 2. Require all terms with AND operator
    const formattedQuery = `"${query.trim()}"`;

    try {
        console.log('Sending search request to backend proxy');
        const response = await axios.get(`${API_BASE}/foods/search`, {
            params: {
                query: formattedQuery,
                dataType: 'Branded',
                pageSize,
                pageNumber,
                sortBy,
                sortOrder
            }
        });

        if (response.data) {
            // If there are too many results (more than 5000), filter more aggressively or return a message
            const totalHits = response.data.totalHits || 0;
            let filteredFoods = [];

            if (totalHits > 5000 && response.data.foods?.length > 0) {
                // For very broad searches, apply more aggressive filtering by relevance score
                filteredFoods = response.data.foods?.filter(food => food.score > 0.8) || [];

                // If even after filtering there are no results, take the top scoring items
                if (filteredFoods.length === 0) {
                    // Sort by score and take only the highest scoring items
                    const sortedFoods = [...response.data.foods].sort((a, b) => b.score - a.score);
                    filteredFoods = sortedFoods.slice(0, Math.min(pageSize, sortedFoods.length));
                }
            } else {
                // For normal searches, apply the standard filter
                filteredFoods = response.data.foods?.filter(food => food.score > 0.5) || [];
            }

            return {
                foods: filteredFoods,
                totalHits: response.data.totalHits || 0,
                pageSize: response.data.foodSearchCriteria?.pageSize || pageSize,
                currentPage: response.data.foodSearchCriteria?.pageNumber || pageNumber
            };
        }

        return { foods: [], totalHits: 0 };
    } catch (error) {
        console.error('Food search failed:', error);
        throw error;
    }
};

export const getFoodDetails = async (fdcId) => {
    try {
        console.log(`Fetching food details for ID ${fdcId} via backend proxy`);
        const response = await axios.get(`${API_BASE}/food/${fdcId}`, {
            params: {
                format: 'full'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Food details fetch failed:', error);
        throw error;
    }
};