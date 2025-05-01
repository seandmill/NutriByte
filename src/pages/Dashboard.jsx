import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  Divider,
  Stack,
  Alert,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  LinearProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Restaurant as RestaurantIcon,
  NoFood as NoFoodIcon,
  LocalFireDepartment as FireIcon,
  FitnessCenter as ProteinIcon,
  Grain as CarbsIcon,
  Opacity as FatIcon,
  Grass as FiberIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { getFoodLogs, deleteFoodLog, updateFoodLog } from '../api/logApi';
import { getUserConfig } from '../api/userApi';

// Default Daily Value reference amounts
const DEFAULT_NUTRIENT_DV = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28
};

// Format nutrient value with unit
const formatNutrientValue = (value, unit) => {
  if (value === 0 || !value) return '0';
  return `${value.toFixed(1)}${unit}`;
};

// Nutrient card component with user customizable targets
const NutrientCard = ({ title, value, unit, icon, color, userDV }) => {
  // Use user-specific daily value if available, otherwise use default
  const nutrientKey = title.toLowerCase();
  const targetValue = userDV?.[nutrientKey] || DEFAULT_NUTRIENT_DV[nutrientKey];
  
  // Calculate % of daily value
  const dvPercent = targetValue ? Math.min(100, Math.round((value / targetValue) * 100)) : 0;
  
  return (
    <Card variant="outlined" sx={{ height: '100%', minHeight: '150px', borderTop: `4px solid ${color}` }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <ListItemIcon sx={{ minWidth: '35px', color: 'primary.main' }}>
            {icon}
          </ListItemIcon>
          <Typography variant="subtitle2" component="div" sx={{ flexGrow: 1, minWidth: 0 }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h6" component="div" align="center" sx={{ mb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {formatNutrientValue(value, unit)}
        </Typography>

        {dvPercent > 0 && (
          <Box sx={{ width: '100%', height: '24px' }}>
            <LinearProgress variant="determinate" value={dvPercent} sx={{ height: 8, borderRadius: 4, mb: 0.5 }}/>
            <Typography variant="caption" display="block" align="right">
              {dvPercent}% DV
              <Tooltip title={`Target: ${targetValue}${title === 'Calories' ? 'kcal' : 'g'}`}>
                <span style={{ marginLeft: 4, color: 'text.secondary', fontSize: '0.75rem' }}>•</span>
              </Tooltip>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditLog, setCurrentEditLog] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editLogType, setEditLogType] = useState('');
  const [saving, setSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState('');
  
  // State for user config with daily values
  const [userDailyValues, setUserDailyValues] = useState(null);
  const [loadingUserConfig, setLoadingUserConfig] = useState(true);
  
  // Get date from URL param or default to today
  const getInitialDate = () => {
    const searchParams = new URLSearchParams(location.search);
    const logDateParam = searchParams.get('logDate');
    
    if (logDateParam) {
      try {
        // Check if it's our YYYY-MM-DD format
        if (logDateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Parse as local date
          const [year, month, day] = logDateParam.split('-').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed in JS Date
        } else {
          // Parse as ISO date
          const parsedDate = new Date(logDateParam);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
      } catch (e) {
        console.error('Invalid date parameter:', e);
      }
    }
    
    // Default to current date if no URL parameter
    return new Date();
  };
  
  const [selectedDate, setSelectedDate] = useState(getInitialDate);

  // Fetch user config on component mount
  useEffect(() => {
    const fetchUserConfig = async () => {
      try {
        const userConfig = await getUserConfig();
        console.log('User config fetched:', userConfig);
        
        // Calculate user daily values from the config
        const userDV = {
          calories: userConfig.targetCalories || DEFAULT_NUTRIENT_DV.calories,
          // Calculate macronutrient targets based on target calories and percentages
          protein: userConfig.macroPercentages ? 
            Math.round((userConfig.targetCalories * (userConfig.macroPercentages.protein / 100)) / 4) : 
            DEFAULT_NUTRIENT_DV.protein,
          carbs: userConfig.macroPercentages ? 
            Math.round((userConfig.targetCalories * (userConfig.macroPercentages.carbs / 100)) / 4) : 
            DEFAULT_NUTRIENT_DV.carbs,
          fat: userConfig.macroPercentages ? 
            Math.round((userConfig.targetCalories * (userConfig.macroPercentages.fat / 100)) / 9) : 
            DEFAULT_NUTRIENT_DV.fat,
          fiber: 28 // Default fiber recommendation
        };
        
        // Store these calculated daily values
        console.log('Calculated user daily values:', userDV);
        setUserDailyValues(userDV);
      } catch (error) {
        console.error('Failed to load user config:', error);
        // Fallback to default values
        setUserDailyValues(DEFAULT_NUTRIENT_DV);
      } finally {
        setLoadingUserConfig(false);
      }
    };
    
    fetchUserConfig();
    loadLogs();
  }, []);
  
  // Update URL when date changes
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    
    // Create a consistent date-only string for the URL
    const getLocalDateString = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    // Update URL with date-only string to avoid timezone issues
    const dateString = getLocalDateString(newDate);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('logDate', dateString);
    
    // Use navigate to update URL without refreshing
    navigate({
      pathname: '/dashboard',
      search: searchParams.toString()
    }, { replace: true });
  };

  useEffect(() => {
    // Filter logs by selected date
    if (logs.length > 0) {
      const filtered = logs.filter((log) => {
        // Get log date and normalize it to local date components
        const logDateObj = new Date(log.logDate || log.date);
        const selectedDateObj = new Date(selectedDate);
        
        // Create date-only strings in local timezone for comparison
        const getDateString = (date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };
        
        // Compare date strings directly to remove any time component influence
        return getDateString(logDateObj) === getDateString(selectedDateObj);
      });
      
      // Debug
      console.log(`Filtered for ${selectedDate.toLocaleDateString()}:`, filtered.length, 'logs found');
      if (filtered.length > 0) {
        console.log('Sample log date:', new Date(filtered[0].logDate || filtered[0].date).toLocaleString());
      }
      
      setFilteredLogs(filtered);
    }
  }, [logs, selectedDate]);

  // Group filtered logs by log type
  const getLogsByType = (logType) => {
    return filteredLogs.filter(log => log.logType === logType);
  };
  
  // Get logs by type
  const consumedLogs = getLogsByType('consumed');
  const avoidedLogs = getLogsByType('avoided');
  const preppedLogs = getLogsByType('prepped');

  const loadLogs = async () => {
    try {
      const data = await getFoodLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load food logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (logId) => {
    try {
      await deleteFoodLog(logId);
      setLogs(logs.filter(log => log._id !== logId));
    } catch (error) {
      console.error('Failed to delete food log:', error);
    }
  };

  const handleEditLog = (log) => {
    setCurrentEditLog(log);
    setEditQuantity(log.quantity?.toString() || '1');
    setEditLogType(log.logType || 'consumed');
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentEditLog(null);
    setEditQuantity('');
    setEditLogType('');
    setEditSuccess(false);
    setEditError('');
  };
  
  const handleSaveEdit = async () => {
    if (!currentEditLog) return;
    
    setSaving(true);
    setEditError('');
    
    try {
      await updateFoodLog(currentEditLog._id, {
        quantity: Number(editQuantity),
        logType: editLogType
      });
      
      // Update local state to reflect changes
      setLogs(logs.map(log => 
        log._id === currentEditLog._id 
          ? { ...log, quantity: Number(editQuantity), logType: editLogType }
          : log
      ));
      
      setEditSuccess(true);
      setTimeout(() => {
        handleCloseEditDialog();
        // Refresh logs to get updated data
        loadLogs();
      }, 1500);
    } catch (error) {
      console.error('Failed to update food log:', error);
      setEditError('Failed to update food log. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      setEditQuantity(value);
    }
  };

  const handleAddFoodForDate = () => {
    // Pass the date as a URL parameter using our consistent format
    const getLocalDateString = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const dateParam = getLocalDateString(selectedDate);
    navigate(`/search?logDate=${encodeURIComponent(dateParam)}`);
  };

  const calculateTotalNutrients = () => {
    // Only calculate totals from consumed foods
    return consumedLogs.reduce((acc, log) => {
      // Use the properties directly if available
      acc.calories += parseFloat(log.calories || 0);
      acc.protein += parseFloat(log.protein || 0);
      acc.carbs += parseFloat(log.carbs || 0);
      acc.fat += parseFloat(log.fat || 0);
      acc.fiber += parseFloat(log.fiber || 0);
      
      // If nutrients object exists, use it as fallback
      if (log.nutrients) {
        if (!log.calories && log.nutrients['1008']) {
          acc.calories += parseFloat(log.nutrients['1008'].value || 0);
        }
        if (!log.protein && log.nutrients['1003']) {
          acc.protein += parseFloat(log.nutrients['1003'].value || 0);
        }
        if (!log.carbs && log.nutrients['1005']) {
          acc.carbs += parseFloat(log.nutrients['1005'].value || 0);
        }
        if (!log.fat && log.nutrients['1004']) {
          acc.fat += parseFloat(log.nutrients['1004'].value || 0);
        }
        if (!log.fiber && log.nutrients['1079']) {
          acc.fiber += parseFloat(log.nutrients['1079'].value || 0);
        }
      }
      
      return acc;
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    });
  };

  const totals = calculateTotalNutrients();
  
  const EmptyState = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '50vh',
        width: '100%',
        py: 8,
        px: 2
      }}
    >
      <NoFoodIcon sx={{ 
        fontSize: 80, 
        color: 'text.secondary', 
        mb: 3,
        opacity: 0.8
      }} />
      <Typography variant="h5" gutterBottom>No Food Logs Yet</Typography>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        mb={4}
        sx={{ maxWidth: '400px' }}
      >
        You haven't logged any food for {format(selectedDate, 'MMMM d, yyyy')}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddFoodForDate}
        size="large"
        sx={{ 
          minWidth: '250px',
          py: 1.5
        }}
      >
        Add Food for this Date
      </Button>
    </Box>
  );

  // Create a reusable FoodTable component
  const FoodTable = ({ logs, title, color }) => {
    if (logs.length === 0) return null;
    
    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <Paper sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          width: '100%',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <Box p={2} bgcolor={color} sx={{ color: 'white' }}>
            <Typography variant="h6">
              {title}
              <Chip 
                label={`${logs.length} items`} 
                size="small" 
                sx={{ ml: 1, bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              />
            </Typography>
          </Box>
          <TableContainer>
            <Table sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell width="30%">Food Name</TableCell>
                  <TableCell width="15%">Serving</TableCell>
                  <TableCell width="12%" align="right">Calories</TableCell>
                  <TableCell width="12%" align="right">Protein</TableCell>
                  <TableCell width="12%" align="right">Carbs</TableCell>
                  <TableCell width="12%" align="right">Fat</TableCell>
                  <TableCell width="7%" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const logNutrients = {
                    calories: log.calories || (log.nutrients && log.nutrients['1008'] ? parseFloat(log.nutrients['1008'].value) : 0),
                    protein: log.protein || (log.nutrients && log.nutrients['1003'] ? parseFloat(log.nutrients['1003'].value) : 0),
                    carbs: log.carbs || (log.nutrients && log.nutrients['1005'] ? parseFloat(log.nutrients['1005'].value) : 0),
                    fat: log.fat || (log.nutrients && log.nutrients['1004'] ? parseFloat(log.nutrients['1004'].value) : 0)
                  };
                  
                  return (
                    <TableRow key={log._id} hover>
                      <TableCell sx={{ 
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        minWidth: '200px'
                      }}>
                        <Box>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              lineHeight: 1.2,
                              mb: 0.5
                            }}
                          >
                            {log.foodName}
                          </Typography>
                          {log.brandName && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: '0.75rem',
                                lineHeight: 1.2
                              }}
                            >
                              {log.brandName}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        whiteSpace: 'normal',
                        wordBreak: 'break-word'
                      }}>
                        {log.quantity && log.servingSize && log.servingUnit ? (
                          `${log.quantity} × ${log.servingSize} ${log.servingUnit}`
                        ) : (
                          log.servingDescription || '1 serving'
                        )}
                      </TableCell>
                      <TableCell align="right">{Math.round(logNutrients.calories)}</TableCell>
                      <TableCell align="right">{Math.round(logNutrients.protein)}g</TableCell>
                      <TableCell align="right">{Math.round(logNutrients.carbs)}g</TableCell>
                      <TableCell align="right">{Math.round(logNutrients.fat)}g</TableCell>
                      <TableCell align="right" sx={{ 
                        minWidth: '90px',
                        pr: 2,
                        '& .MuiIconButton-root': {
                          padding: '4px'
                        }
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditLog(log)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(log._id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  };

  if (loading || loadingUserConfig) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box mb={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" sx={{ mr: 4 }}>Daily Log</Typography>
                <Box display="flex" alignItems="center">
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      renderInput={(params) => <div style={{ marginRight: 16 }} {...params} />}
                      slotProps={{
                        textField: { 
                          size: 'small',
                          sx: { mr: 2 }
                        }
                      }}
                    />
                  </LocalizationProvider>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddFoodForDate}
                  >
                    Add Food
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Nutrition Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2.4}>
                  <NutrientCard
                    title="Calories"
                    value={Math.round(totals.calories)}
                    unit="kcal"
                    icon={<FireIcon />}
                    color="#FF5722"
                    userDV={userDailyValues}
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <NutrientCard
                    title="Protein"
                    value={Math.round(totals.protein)}
                    unit="g"
                    icon={<ProteinIcon />}
                    color="#2196F3"
                    userDV={userDailyValues}
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <NutrientCard
                    title="Carbs"
                    value={Math.round(totals.carbs)}
                    unit="g"
                    icon={<CarbsIcon />}
                    color="#4CAF50"
                    userDV={userDailyValues}
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <NutrientCard
                    title="Fat"
                    value={Math.round(totals.fat)}
                    unit="g"
                    icon={<FatIcon />}
                    color="#FFC107"
                    userDV={userDailyValues}
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <NutrientCard
                    title="Fiber"
                    value={Math.round(totals.fiber)}
                    unit="g"
                    icon={<FiberIcon />}
                    color="#9C27B0"
                    userDV={userDailyValues}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Food Logs Table */}
            <Grid item xs={12}>
              {filteredLogs.length === 0 ? (
                <EmptyState />
              ) : (
                <Box sx={{ width: '100%' }}>
                  <FoodTable logs={consumedLogs} title="Consumed" color="primary.main" />
                  <FoodTable logs={avoidedLogs} title="Avoided" color="error.main" />
                  <FoodTable logs={preppedLogs} title="Prepped" color="warning.main" />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
        
        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Food Log</DialogTitle>
          <DialogContent>
            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editError}
              </Alert>
            )}
            
            {editSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Food log updated successfully!
              </Alert>
            )}
            
            {currentEditLog && (
              <>
                <Box mb={3} mt={2}>
                  <Typography variant="h6" gutterBottom>
                    {currentEditLog.foodName}
                  </Typography>
                  {currentEditLog.brandName && (
                    <Typography variant="body2" color="text.secondary">
                      {currentEditLog.brandName}
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={3}>
                  <TextField
                    label="Quantity"
                    value={editQuantity}
                    onChange={handleQuantityChange}
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, step: 0.5 }}
                    helperText={
                      currentEditLog.servingSize && currentEditLog.servingUnit
                        ? `Serving size: ${currentEditLog.servingSize} ${currentEditLog.servingUnit}`
                        : 'Serving size'
                    }
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Log Type</InputLabel>
                    <Select
                      value={editLogType}
                      onChange={(e) => setEditLogType(e.target.value)}
                      label="Log Type"
                    >
                      <MenuItem value="consumed">Consumed</MenuItem>
                      <MenuItem value="avoided">Avoided</MenuItem>
                      <MenuItem value="prepped">Prepped for Later</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              variant="outlined" 
              onClick={handleCloseEditDialog}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Dashboard;