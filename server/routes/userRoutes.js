import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

// Default configuration values (used if user doc lacks them)
const DEFAULT_CONFIG_VALUES = {
  targetCalories: 2000,
  macroPercentages: { protein: 20, fat: 30, carbs: 50 },
  overriddenNutrients: {},
};

// GET /api/users/config - Get current user's config fields from User doc
router.get("/config", authMiddleware, async (req, res) => {
  try {
    // Find the user, selecting only the config fields + _id for safety
    const user = await User.findById(req.user._id).select(
      "targetCalories macroPercentages overriddenNutrients"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Merge defaults with existing user data
    const configData = {
      targetCalories:
        user.targetCalories ?? DEFAULT_CONFIG_VALUES.targetCalories,
      macroPercentages: user.macroPercentages
        ? {
            protein:
              user.macroPercentages.protein ??
              DEFAULT_CONFIG_VALUES.macroPercentages.protein,
            fat:
              user.macroPercentages.fat ??
              DEFAULT_CONFIG_VALUES.macroPercentages.fat,
            carbs:
              user.macroPercentages.carbs ??
              DEFAULT_CONFIG_VALUES.macroPercentages.carbs,
          }
        : DEFAULT_CONFIG_VALUES.macroPercentages,
      // Convert Map to plain object, provide default if missing
      overriddenNutrients: Object.fromEntries(
        user.overriddenNutrients || new Map()
      ),
    };

    res.json(configData);
  } catch (err) {
    console.error("Error fetching user config:", err);
    res.status(500).json({ message: "Server error fetching configuration" });
  }
});

// PUT /api/users/config - Update config fields on the User doc
router.put("/config", authMiddleware, async (req, res) => {
  // Destructure ONLY the allowed config fields from the body
  const { targetCalories, macroPercentages, overriddenNutrients } = req.body;
  const userId = req.user._id;

  // Validation for macro percentages sum
  if (macroPercentages) {
    const { protein = 0, fat = 0, carbs = 0 } = macroPercentages;
    if (Math.abs(protein + fat + carbs - 100) > 0.1) {
      return res
        .status(400)
        .json({ message: "Macro percentages must sum to 100%" });
    }
  }

  try {
    // Prepare the update payload, only including fields present in the request
    const updatePayload = {};
    if (targetCalories !== undefined)
      updatePayload.targetCalories = targetCalories;
    if (macroPercentages !== undefined)
      updatePayload.macroPercentages = macroPercentages;
    if (overriddenNutrients !== undefined) {
      // Convert incoming plain object back to Map for saving
      updatePayload.overriddenNutrients = new Map(
        Object.entries(overriddenNutrients)
      );
    }

    // Find user and update the fields
    const options = {
      new: true, // Return the updated document
      runValidators: true, // Ensure schema validations run
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatePayload }, // Use $set to update only specified fields
      options
    ).select("targetCalories macroPercentages overriddenNutrients"); // Select only config fields for response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare response object with potentially merged defaults (though findByIdAndUpdate should return full object)
    const responseData = {
      targetCalories:
        updatedUser.targetCalories ?? DEFAULT_CONFIG_VALUES.targetCalories,
      macroPercentages: updatedUser.macroPercentages
        ? {
            protein:
              updatedUser.macroPercentages.protein ??
              DEFAULT_CONFIG_VALUES.macroPercentages.protein,
            fat:
              updatedUser.macroPercentages.fat ??
              DEFAULT_CONFIG_VALUES.macroPercentages.fat,
            carbs:
              updatedUser.macroPercentages.carbs ??
              DEFAULT_CONFIG_VALUES.macroPercentages.carbs,
          }
        : DEFAULT_CONFIG_VALUES.macroPercentages,
      overriddenNutrients: Object.fromEntries(
        updatedUser.overriddenNutrients || new Map()
      ),
    };

    res.json(responseData);
  } catch (err) {
    console.error("Error updating user config:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error updating configuration" });
  }
});

export default router;
