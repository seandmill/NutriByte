import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Grid,
  InputAdornment, // For % sign
  Divider, // For visual separation
  Accordion, // <-- Add Accordion
  AccordionSummary,
  AccordionDetails,
  IconButton, // <-- Add IconButton
  Tooltip, // <-- Add Tooltip
  ListItemIcon, // <-- Add List Item Icon
  List, // <-- Add List
  ListItem, // <-- Add List Item
  ListItemText // <-- Add List Item Text
} from '@mui/material';
import { 
    ExpandMore as ExpandMoreIcon, // <-- Add ExpandMoreIcon
    RestartAlt as RestartAltIcon, // <-- Add RestartAltIcon for reset
    HelpOutline as HelpOutlineIcon // <-- Add HelpOutlineIcon for default
} from '@mui/icons-material';
import * as MuiIcons from '@mui/icons-material'; // Keep for dynamic icons
import Layout from '../components/Layout';
import { 
    CALORIE_FACTORS, 
    NUTRIENT_METADATA, 
    NUTRIENT_CATEGORIES 
} from '../utils/nutrientUtils';
import { getUserConfig, updateUserConfig } from '../api/userApi'; // <-- Import API functions

// Helper to get icon component from string name (assuming it exists from previous steps)
const getIcon = (iconName) => {
  const IconComponent = MuiIcons[iconName];
  return IconComponent ? <IconComponent fontSize="small"/> : <HelpOutlineIcon fontSize="small" />; // Use smaller icons
};

const Settings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [macroError, setMacroError] = useState(''); // Specific error for macro % sum
  const [expandedNutrientPanel, setExpandedNutrientPanel] = useState(false); // State for nutrient accordions
  const [isSaving, setIsSaving] = useState(false); // Specific state for saving
  const [successMessage, setSuccessMessage] = useState(''); // For save success feedback

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError('');
      try {
        const fetchedConfig = await getUserConfig();
        setConfig({
            // Ensure all fields are present, using defaults from backend if necessary
            targetCalories: fetchedConfig.targetCalories || 2000,
            macroPercentages: fetchedConfig.macroPercentages || { protein: 20, fat: 30, carbs: 50 },
            overriddenNutrients: fetchedConfig.overriddenNutrients || {}
        });
      } catch (fetchError) {
        console.error("Fetch config failed:", fetchError);
        setError(fetchError.message || "Failed to load your settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // --- Calculations --- 
  const calculatedMacroGrams = useMemo(() => {
    if (!config) return { protein: 0, fat: 0, carbs: 0 };
    
    const calories = Number(config.targetCalories) || 0;
    const proteinPercent = (Number(config.macroPercentages.protein) || 0) / 100;
    const fatPercent = (Number(config.macroPercentages.fat) || 0) / 100;
    const carbsPercent = (Number(config.macroPercentages.carbs) || 0) / 100;

    return {
      protein: (calories * proteinPercent) / CALORIE_FACTORS.Protein,
      fat: (calories * fatPercent) / CALORIE_FACTORS['Total Fat'], // Use correct key
      carbs: (calories * carbsPercent) / CALORIE_FACTORS.Carbohydrates,
    };
  }, [config]);

  // --- Calculate Scaled Default Targets --- 
  const calculatedDefaultTargets = useMemo(() => {
     if (!config) return {};
     const targets = {};
     const calorieRatio = (Number(config.targetCalories) || 2000) / 2000; // Default to 2000 if target is invalid
     
     Object.entries(NUTRIENT_METADATA).forEach(([id, meta]) => {
         if (meta.dv && meta.category !== 'macronutrients') { // Only scale non-macros with a DV
             targets[id] = {
                 value: (meta.dv * calorieRatio).toFixed(meta.unit === 'mg' || meta.unit === 'g' ? 1 : 0), // Adjust precision based on unit
                 unit: meta.unit
             };
         }
     });
     return targets;
  }, [config?.targetCalories]);

  // Validate Macro Percentages Sum
  useEffect(() => {
     if (!config) return;
     const protein = Number(config.macroPercentages.protein) || 0;
     const fat = Number(config.macroPercentages.fat) || 0;
     const carbs = Number(config.macroPercentages.carbs) || 0;
     const total = protein + fat + carbs;
     if (Math.abs(total - 100) > 0.1) { // Use tolerance
         setMacroError(`Macro percentages must sum to 100% (Currently: ${total.toFixed(1)}%)`);
     } else {
         setMacroError('');
     }
  }, [config?.macroPercentages]);

  // --- Handlers --- 
  const handleConfigChange = (event) => {
    const { name, value } = event.target;
    const numericValue = name === 'targetCalories' ? Number(value) || 0 : value;
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: numericValue
    }));
    setIsDirty(true);
    setSuccessMessage(''); // Clear success message on change
  };

  const handleMacroChange = (event) => {
    const { name, value } = event.target;
    const numericValue = Number(value) || 0;
    setConfig(prevConfig => ({
      ...prevConfig,
      macroPercentages: {
        ...prevConfig.macroPercentages,
        [name]: numericValue
      }
    }));
    setIsDirty(true);
    setSuccessMessage(''); 
  };

  // Handler for Nutrient Override Input Change
  const handleOverrideChange = (event, nutrientId, unit) => {
      const { value } = event.target;
      const numericValue = value === '' ? null : Number(value) || 0;
      setConfig(prevConfig => {
          const updatedOverrides = { ...prevConfig.overriddenNutrients };
          if (numericValue === null || isNaN(numericValue)) {
               delete updatedOverrides[nutrientId];
          } else {
              updatedOverrides[nutrientId] = { value: numericValue, unit: unit };
          }
          return {
             ...prevConfig,
             overriddenNutrients: updatedOverrides
          };
      });
      setIsDirty(true);
      setSuccessMessage(''); 
  };
  
  // Handler for Resetting an Override
  const handleResetOverride = (nutrientId) => {
       setConfig(prevConfig => {
          const updatedOverrides = { ...prevConfig.overriddenNutrients };
          delete updatedOverrides[nutrientId]; // Remove the specific override
          return {
             ...prevConfig,
             overriddenNutrients: updatedOverrides
          };
      });
      setIsDirty(true);
      setSuccessMessage(''); 
  };
  
  // Handler for Nutrient Accordion changes
  const handleNutrientAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedNutrientPanel(isExpanded ? panel : false);
  };

  const handleSave = async () => {
    if (macroError) {
        setError("Please fix macro percentage errors before saving.");
        return;
    }
    setError(''); 
    setSuccessMessage('');
    setIsSaving(true); // Use isSaving state
    
    try {
      console.log("Saving config:", config);
      const updatedConfig = await updateUserConfig(config);
      setConfig(updatedConfig); // Update state with response from server
      setIsDirty(false);
      setSuccessMessage("Settings saved successfully!");
      // Auto-clear success message after a few seconds
      setTimeout(() => setSuccessMessage(''), 3000); 

    } catch (saveError) {
       console.error("Save config failed:", saveError);
       setError(saveError.message || "Failed to save settings.");
    } finally {
        setIsSaving(false); 
    }
  };

  // --- Render Logic --- 
  if (loading && !config) { // Show initial loading spinner
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Handle case where fetching finished but config is still null (error state)
  if (!config) {
       return (
         <Layout>
           <Container maxWidth="md">
             <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                 My Nutrient Targets
             </Typography>
             <Alert severity="error">{error || "Failed to load settings data."}</Alert>
           </Container>
         </Layout>
       );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          My Nutrient Targets
        </Typography>

        {/* Display general errors or success message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
           <Alert severity="success" sx={{ mb: 2 }}>
             {successMessage}
           </Alert>
        )}

        <Paper sx={{ p: 3 }}>
            {/* --- Calorie Target --- */}
            <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                    Daily Calorie Target
                </Typography>
                <TextField
                    label="Target Calories"
                    type="number"
                    name="targetCalories"
                    value={config.targetCalories}
                    onChange={handleConfigChange}
                    fullWidth
                    InputProps={{
                        endAdornment: <InputAdornment position="end">kcal</InputAdornment>,
                         inputProps: { min: 0 } // Prevent negative numbers
                    }}
                    sx={{ maxWidth: '250px' }} // Limit width slightly
                 />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* --- Macronutrient Percentages --- */}
            <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                    Macronutrient Distribution
                </Typography>
                <Grid container spacing={2} alignItems="center">
                     {/* Protein */} 
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Protein %"
                            type="number"
                            name="protein"
                            value={config.macroPercentages.protein}
                            onChange={handleMacroChange}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                inputProps: { min: 0, max: 100 }
                            }}
                            fullWidth
                        />
                        <Typography variant="caption" display="block" sx={{ textAlign: 'center', mt: 0.5 }}>
                            ~{calculatedMacroGrams.protein.toFixed(0)}g
                        </Typography>
                    </Grid>
                    {/* Fat */} 
                    <Grid item xs={12} sm={4}>
                        <TextField
                             label="Fat %"
                            type="number"
                            name="fat"
                            value={config.macroPercentages.fat}
                            onChange={handleMacroChange}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                 inputProps: { min: 0, max: 100 }
                            }}
                            fullWidth
                        />
                         <Typography variant="caption" display="block" sx={{ textAlign: 'center', mt: 0.5 }}>
                            ~{calculatedMacroGrams.fat.toFixed(0)}g
                        </Typography>
                    </Grid>
                     {/* Carbs */} 
                    <Grid item xs={12} sm={4}>
                        <TextField
                             label="Carbs %"
                            type="number"
                            name="carbs"
                            value={config.macroPercentages.carbs}
                            onChange={handleMacroChange}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                inputProps: { min: 0, max: 100 }
                            }}
                            fullWidth
                        />
                         <Typography variant="caption" display="block" sx={{ textAlign: 'center', mt: 0.5 }}>
                            ~{calculatedMacroGrams.carbs.toFixed(0)}g
                        </Typography>
                    </Grid>
                 </Grid>
                 {/* Macro Sum Validation Error */} 
                 {macroError && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        {macroError}
                    </Alert>
                 )}
            </Box>
            
            <Divider sx={{ my: 3 }} />

            {/* --- Other Nutrient Targets --- */}
            <Box mb={3}>
                 <Typography variant="h6" gutterBottom>
                    Specific Nutrient Targets
                 </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    Set specific targets for individual nutrients below. Any value entered here will override the default calculated target based on your calorie goal.
                 </Typography>

                {Object.entries(NUTRIENT_CATEGORIES)
                    .filter(([key /*, _categoryName*/]) => key !== 'macronutrients') // Just need the key
                    .map(([categoryKey, categoryName]) => (
                     <Accordion 
                        key={categoryKey} 
                        expanded={expandedNutrientPanel === categoryKey}
                        onChange={handleNutrientAccordionChange(categoryKey)} 
                        sx={{ mb: 1 }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{categoryName}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense disablePadding>
                                {Object.entries(NUTRIENT_METADATA)
                                    .filter(([/* nutrientId */, meta]) => meta.category === categoryKey) // Use meta directly
                                    .map(([nutrientId, meta]) => {
                                        const override = config.overriddenNutrients[nutrientId];
                                        const defaultValue = calculatedDefaultTargets[nutrientId] || { value: 'N/A', unit: meta.unit };
                                        const isOverridden = !!override;
                                        
                                        return (
                                            <ListItem key={nutrientId} disableGutters sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                                    {getIcon(meta.icon)}
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary={meta.name} 
                                                    secondary={`Default: ${defaultValue.value} ${defaultValue.unit}`}
                                                    sx={{ flexGrow: 1, mr: 2 }}
                                                 />
                                                 <TextField 
                                                     size="small"
                                                     type="number"
                                                     value={isOverridden ? override.value : ''} // Show override value or empty
                                                     onChange={(e) => handleOverrideChange(e, nutrientId, meta.unit)}
                                                     InputProps={{
                                                          endAdornment: <InputAdornment position="end">{meta.unit}</InputAdornment>,
                                                          inputProps: { min: 0 }
                                                     }}
                                                     sx={{ width: '150px', mr: 1 }}
                                                     placeholder={defaultValue.value} // Show default as placeholder
                                                     variant="outlined"
                                                 />
                                                 <Tooltip title="Reset to Default">
                                                     {/* Disable reset if not overridden */}
                                                     <span> {/* Span needed for Tooltip when button is disabled */} 
                                                        <IconButton 
                                                            onClick={() => handleResetOverride(nutrientId)}
                                                            disabled={!isOverridden}
                                                            size="small"
                                                        >
                                                             <RestartAltIcon fontSize="small" />
                                                         </IconButton>
                                                     </span>
                                                 </Tooltip>
                                            </ListItem>
                                        );
                                     })}
                             </List>
                         </AccordionDetails>
                     </Accordion>
                 ))}
            </Box>

            {/* --- Save Button --- */}
            <Box mt={3} display="flex" justifyContent="flex-end">
             <Button 
                variant="contained" 
                onClick={handleSave} 
                disabled={!isDirty || !!macroError || isSaving} // Use isSaving state
             >
               {isSaving ? <CircularProgress size={24} color="inherit"/> : 'Save Changes'} {/* Show spinner when saving */}
             </Button>
          </Box>
        </Paper>

      </Container>
    </Layout>
  );
};

export default Settings;
