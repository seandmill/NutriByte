import { Router } from 'express';
import mongoose from 'mongoose';
const { connection } = mongoose;
import FoodLog from '../models/FoodLog.js';
import auth from '../middleware/auth.js';
import { Parser } from 'json2csv';

const router = Router();

// Helper function to parse ingredients
const parseIngredients = (ingredientsString) => {
    if (!ingredientsString) return [];

    // Split by commas, then clean up each ingredient
    return ingredientsString
        .split(',')
        .map(ingredient => {
            // Clean up the ingredient: trim whitespace and remove common filler words
            let cleaned = ingredient.trim()
                .replace(/\bcontains\b/i, '')
                .replace(/\bless than\b/i, '')
                .replace(/\bor\b/i, '')
                .replace(/\band\b/i, '')
                .replace(/\bof\b/i, '')
                .replace(/\b\d+%\b/i, '')
                .replace(/^\s*[()]|[()]\s*$/g, '') // Remove parentheses at start/end
                .trim();

            // Remove any leading/trailing punctuation
            cleaned = cleaned.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').trim();

            return cleaned;
        })
        .filter(ingredient => ingredient.length > 0); // Remove any empty entries
};

// Get all logs for a user
router.get('/', auth, async (req, res) => {
    try {
        console.log(`Fetching logs for user: ${req.user._id}`);
        const logs = await FoodLog.find({ userId: req.user._id })
            .sort({ date: -1 });

        console.log(`Found ${logs.length} logs`);

        // Process logs to ensure consistent date format
        const processedLogs = logs.map(log => {
            const logObj = log.toObject();

            // Store the original logDate as ISO string for debugging
            if (logObj.logDate) {
                logObj._originalLogDate = logObj.logDate.toISOString();
                // We're keeping the original logDate object as-is now, no modification needed
            }

            // Fix the nutrients map serialization
            if (logObj.nutrients && logObj.nutrients instanceof Map) {
                logObj.nutrients = Object.fromEntries(logObj.nutrients);
            }

            return logObj;
        });

        res.json(processedLogs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a new log
router.post('/', auth, async (req, res) => {
    try {
        const {
            foodId,
            foodName,
            servingSize,
            servingUnit,
            servingDescription,
            quantity,
            servingType,
            servingAmount,
            nutrients,
            logType,
            logDate,
            // Food metadata
            dataType,
            foodClass,
            brandOwner,
            brandName,
            brandedFoodCategory,
            ingredients
        } = req.body;

        // Parse ingredients into individual items if provided
        const parsedIngredients = ingredients ? parseIngredients(ingredients) : [];

        // Create log data object - trust the values sent from the client
        const logData = {
            userId: req.user._id,
            foodId,
            foodName,
            servingSize,
            servingUnit,
            quantity: quantity || 1,
            servingType: servingType || servingUnit || 'g',
            servingAmount: servingAmount || 1,
            servingDescription, // Keep this just for UI display purposes
            // Include food metadata
            dataType,
            foodClass,
            brandOwner,
            brandName,
            brandedFoodCategory,
            ingredients,
            parsedIngredients,
            nutrients: new Map(Object.entries(nutrients || {})),
            logType: logType || 'consumed',
            // Handle logDate without timezone issues
            logDate: logDate ? (typeof logDate === 'string' && logDate.length <= 10) ?
                // If it's a date-only string (YYYY-MM-DD), treat as noon UTC on that date
                new Date(`${logDate}T12:00:00.000Z`) :
                // Otherwise, preserve the provided date object
                new Date(logDate) :
                // Default to noon UTC today if no date provided
                new Date(new Date().setUTCHours(12, 0, 0, 0))
        };

        // Extract key macronutrients for easier querying by their IDs
        if (nutrients) {
            // By ID references - more reliable
            logData.calories = parseFloat(nutrients['1008']?.value || 0);
            logData.protein = parseFloat(nutrients['1003']?.value || 0);
            logData.fat = parseFloat(nutrients['1004']?.value || 0);
            logData.carbs = parseFloat(nutrients['1005']?.value || 0);
        }

        const log = new FoodLog(logData);
        await log.save();
        res.status(201).json(log);
    } catch (error) {
        console.error('Error creating food log:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a log
router.put('/:id', auth, async (req, res) => {
    try {
        const log = await FoodLog.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            log[key] = updates[key];
        });

        await log.save();
        res.json(log);
    } catch (error) {
        console.error('Error updating log:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a log
router.delete('/:id', auth, async (req, res) => {
    try {
        const log = await FoodLog.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        res.json({ message: 'Log deleted' });
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get filtered logs for analytics
router.get('/analytics', auth, async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            brandOwners,
            brandNames,
            foodCategories,
            ingredients,
            logTypes
        } = req.query;

        // Build filter object
        const filter = { userId: req.user._id };

        // Date filtering
        if (startDate || endDate) {
            filter.logDate = {};

            if (startDate) {
                // Set start of day (midnight) in UTC for the start date
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                filter.logDate.$gte = start;
            }

            if (endDate) {
                // Set end of day (23:59:59.999) in UTC for the end date to include the full day
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                filter.logDate.$lte = end;
            }
        }

        // Brand owner filtering
        if (brandOwners && brandOwners.length) {
            filter.brandOwner = { $in: Array.isArray(brandOwners) ? brandOwners : [brandOwners] };
        }

        // Brand name filtering
        if (brandNames && brandNames.length) {
            filter.brandName = { $in: Array.isArray(brandNames) ? brandNames : [brandNames] };
        }

        // Food category filtering
        if (foodCategories && foodCategories.length) {
            filter.brandedFoodCategory = { $in: Array.isArray(foodCategories) ? foodCategories : [foodCategories] };
        }

        // Log type filtering
        if (logTypes && logTypes.length) {
            filter.logType = { $in: Array.isArray(logTypes) ? logTypes : [logTypes] };
        }

        // Ingredients filtering (more complex)
        if (ingredients && ingredients.length) {
            const ingredientsList = Array.isArray(ingredients) ? ingredients : [ingredients];

            // Use $or to match either the full ingredients string or the parsed ingredients array
            filter.$or = [
                { ingredients: { $regex: ingredientsList.join('|'), $options: 'i' } },
                { parsedIngredients: { $in: ingredientsList } }
            ];
        }

        // Execute the query
        const logs = await FoodLog.find(filter).sort({ date: 1 });

        // Process logs:
        // For past preps (preps with dates before today), convert them to "consumed" for analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const processedLogs = logs.map(log => {
            const logData = log.toObject();

            // If it's a prep log but the date is in the past, treat it as consumed
            if (logData.logType === 'prepped' && new Date(logData.logDate) < today) {
                logData._originalLogType = 'prepped'; // Keep original for reference
                logData.logType = 'consumed';
            }

            // Fix the nutrients map serialization by ensuring it's an object
            if (logData.nutrients && logData.nutrients instanceof Map) {
                logData.nutrients = Object.fromEntries(logData.nutrients);
            }

            return logData;
        });

        res.json(processedLogs);
    } catch (error) {
        console.error('Analytics query error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// New endpoint to get raw nutrient data with proper serialization
router.get('/rawnutrients', auth, async (req, res) => {
    try {
        const logs = await FoodLog.find({ userId: req.user._id });

        // Properly convert Map to Object for each log
        const logsWithFixedNutrients = logs.map(log => {
            const logObj = log.toObject();

            // Special handling for nutrients Map
            if (logObj.nutrients && logObj.nutrients instanceof Map) {
                logObj.nutrients = Object.fromEntries(logObj.nutrients);
            }

            // If nutrients is still empty but we have direct properties, add them
            if (!logObj.nutrients || Object.keys(logObj.nutrients).length === 0) {
                logObj.nutrients = {};
                if (logObj.calories) logObj.nutrients['1008'] = { id: '1008', value: logObj.calories, name: 'Energy', unit: 'kcal' };
                if (logObj.protein) logObj.nutrients['1003'] = { id: '1003', value: logObj.protein, name: 'Protein', unit: 'g' };
                if (logObj.fat) logObj.nutrients['1004'] = { id: '1004', value: logObj.fat, name: 'Total Fat', unit: 'g' };
                if (logObj.carbs) logObj.nutrients['1005'] = { id: '1005', value: logObj.carbs, name: 'Carbohydrates', unit: 'g' };
            }

            return logObj;
        });

        res.json(logsWithFixedNutrients);
    } catch (error) {
        console.error('Error fetching raw nutrient data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Endpoint to get minerals data directly
router.get('/nutrients', auth, async (req, res) => {
    try {
        const logs = await FoodLog.find({
            userId: req.user._id,
            logType: 'consumed'
        });

        // Calculate minerals from logs
        const mineralsData = {
            calcium: 0,
            iron: 0,
            magnesium: 0,
            phosphorus: 0,
            potassium: 0,
            sodium: 0,
            zinc: 0
        };

        // Map of nutrient IDs to minerals names
        const mineralIdMap = {
            '1087': 'calcium',
            '1089': 'iron',
            '1090': 'magnesium',
            '1091': 'phosphorus',
            '1092': 'potassium',
            '1093': 'sodium',
            '1095': 'zinc'
        };

        logs.forEach(log => {
            const logObj = log.toObject();
            const nutrients = logObj.nutrients;

            if (nutrients) {
                // Convert Map to object if needed
                const nutrientsObj = nutrients instanceof Map
                    ? Object.fromEntries(nutrients)
                    : nutrients;

                // Extract mineral values
                Object.entries(nutrientsObj).forEach(([key, nutrient]) => {
                    if (mineralIdMap[key]) {
                        const mineral = mineralIdMap[key];
                        let value = 0;

                        if (typeof nutrient === 'object' && nutrient.value) {
                            value = parseFloat(nutrient.value) || 0;
                        } else if (typeof nutrient === 'number') {
                            value = nutrient;
                        } else if (typeof nutrient === 'string') {
                            value = parseFloat(nutrient) || 0;
                        }

                        mineralsData[mineral] += value;
                    }
                });
            }
        });

        // Log results for debugging
        console.log('Calculated minerals data:', mineralsData);

        res.json(mineralsData);
    } catch (error) {
        console.error('Error calculating minerals data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fallback direct query endpoint - NOTE: Use with caution in production
router.post('/directquery', auth, async (req, res) => {
    try {
        // Direct MongoDB query using Mongoose's native driver
        const { query } = req.body;

        if (!query || !query.collection) {
            return res.status(400).json({ message: 'Invalid query parameters' });
        }

        // Add user filter for security
        const filter = { userId: req.user._id };

        // Get collection from mongoose connection
        const db = connection.db;
        const collection = db.collection(query.collection);

        // Run the query with the user filter
        const results = await collection.find(filter).toArray();

        res.json(results);
    } catch (error) {
        console.error('Direct query error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export analytics data as CSV
router.get('/export/csv', auth, async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            brandOwners,
            brandNames,
            foodCategories,
            ingredients,
            logTypes
        } = req.query;

        // Build filter object
        const filter = { userId: req.user._id };

        // Date filtering
        if (startDate || endDate) {
            filter.logDate = {};

            if (startDate) {
                // Set start of day (midnight) in UTC for the start date
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                filter.logDate.$gte = start;
            }

            if (endDate) {
                // Set end of day (23:59:59.999) in UTC for the end date to include the full day
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                filter.logDate.$lte = end;
            }
        }

        // Brand owner filtering
        if (brandOwners && brandOwners.length) {
            filter.brandOwner = { $in: Array.isArray(brandOwners) ? brandOwners : [brandOwners] };
        }

        // Brand name filtering
        if (brandNames && brandNames.length) {
            filter.brandName = { $in: Array.isArray(brandNames) ? brandNames : [brandNames] };
        }

        // Food category filtering
        if (foodCategories && foodCategories.length) {
            filter.brandedFoodCategory = { $in: Array.isArray(foodCategories) ? foodCategories : [foodCategories] };
        }

        // Log type filtering
        if (logTypes && logTypes.length) {
            filter.logType = { $in: Array.isArray(logTypes) ? logTypes : [logTypes] };
        }

        // Ingredients filtering (more complex)
        if (ingredients && ingredients.length) {
            const ingredientsList = Array.isArray(ingredients) ? ingredients : [ingredients];

            // Use $or to match either the full ingredients string or the parsed ingredients array
            filter.$or = [
                { ingredients: { $regex: ingredientsList.join('|'), $options: 'i' } },
                { parsedIngredients: { $in: ingredientsList } }
            ];
        }

        // Execute the query
        const logs = await FoodLog.find(filter).sort({ logDate: 1 });

        // Process logs for CSV export
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        // Transform data for CSV export - flattening the structure
        const flattenedLogs = logs.map(log => {
            const logObj = log.toObject();
            
            // Format date as a string
            const formattedDate = logObj.logDate ? new Date(logObj.logDate).toISOString().split('T')[0] : '';
            
            // Handle logType conversion for past preps
            let logType = logObj.logType;
            if (logType === 'prepped' && new Date(logObj.logDate) < today) {
                logType = 'consumed (was prepped)';
            }
            
            // Extract key nutrients (calories, protein, fat, carbs)
            let calories = logObj.calories || 0;
            let protein = logObj.protein || 0;
            let fat = logObj.fat || 0;
            let carbs = logObj.carbs || 0;
            
            // If we have nutrients map and not direct fields
            if (logObj.nutrients) {
                const nutrientsObj = logObj.nutrients instanceof Map
                    ? Object.fromEntries(logObj.nutrients)
                    : logObj.nutrients;
                
                // Try to extract from nutrients if direct fields are empty
                calories = calories || parseFloat(nutrientsObj['1008']?.value || 0);
                protein = protein || parseFloat(nutrientsObj['1003']?.value || 0);
                fat = fat || parseFloat(nutrientsObj['1004']?.value || 0);
                carbs = carbs || parseFloat(nutrientsObj['1005']?.value || 0);
            }
            
            // Construct a flat object for CSV export
            return {
                Date: formattedDate,
                Food: logObj.foodName,
                Type: logType,
                Serving: `${logObj.quantity} ${logObj.servingDescription || logObj.servingType || 'serving'}`,
                Calories: calories.toFixed(1),
                'Protein (g)': protein.toFixed(1),
                'Fat (g)': fat.toFixed(1),
                'Carbs (g)': carbs.toFixed(1),
                Brand: logObj.brandName || '',
                Category: logObj.brandedFoodCategory || '',
                DataType: logObj.dataType || ''
            };
        });

        // Define CSV fields
        const fields = [
            'Date',
            'Food',
            'Type',
            'Serving',
            'Calories',
            'Protein (g)',
            'Fat (g)',
            'Carbs (g)',
            'Brand',
            'Category',
            'DataType'
        ];

        // Generate filename with current date
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `nutribyte_food_log_${dateStr}.csv`;

        // Generate CSV
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(flattenedLogs);

        // Set headers for download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Send the CSV file
        res.status(200).end(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV export', error: error.message });
    }
});

export default router; 