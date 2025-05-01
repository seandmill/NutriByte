import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Chip,
  Button,
  Stack
} from '@mui/material';
import { Search as SearchIcon, Compare as CompareIcon, Clear as ClearIcon, ShoppingCart as ShoppingCartIcon, Info as InfoIcon } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import Layout from '../components/Layout';
import { searchFoods } from '../api/foodApi';
import { debounce } from '../utils/debounce';
import { extractNutrients } from '../utils/nutrientUtils';
import { useCompare, MAX_COMPARE_ITEMS } from '../contexts/CompareContext';

// Table column headers configuration
const headCells = [
  { id: 'description', numeric: false, label: 'Description' },
  { id: 'brandName', numeric: false, label: 'Brand' },
  { id: 'foodCategory', numeric: false, label: 'Category' },
  { id: 'servingSize', numeric: true, label: 'Serving Size' },
  { id: 'protein', numeric: true, label: 'Protein (g)' },
  { id: 'fat', numeric: true, label: 'Fat (g)' },
  { id: 'carbs', numeric: true, label: 'Carbs (g)' },
  { id: 'calories', numeric: true, label: 'Calories' },
];

// Retailer configuration with their brand colors
const RETAILERS = [
  {
    name: 'Target',
    color: '#CC0000',
    buildUrl: (query) => `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`
  },
  {
    name: 'Walmart',
    color: '#0071CE',
    buildUrl: (query) => `https://www.walmart.com/search?q=${encodeURIComponent(query)}`
  },
  {
    name: 'Kroger',
    color: '#E35205',
    buildUrl: (query) => `https://www.kroger.com/search?query=${encodeURIComponent(query)}&searchType=default_search`
  },
  {
    name: 'H-E-B',
    color: '#DC1C2C',
    buildUrl: (query) => `https://www.heb.com/search?q=${encodeURIComponent(query)}`
  },
  {
    name: 'Tom Thumb',
    color: '#E31837',
    buildUrl: (query) => `https://www.tomthumb.com/shop/search-results.html?q=${encodeURIComponent(query)}`
  },
  {
    name: "Trader Joe's",
    color: '#B50938',
    buildUrl: (query) => `https://www.traderjoes.com/home/search?q=${encodeURIComponent(query)}&global=yes`
  },
  {
    name: 'Whole Foods',
    color: '#004B3F',
    buildUrl: (query) => `https://www.wholefoodsmarket.com/search?text=${encodeURIComponent(query)}`
  }
];

const RetailerQuickLinks = ({ searchQuery }) => {
  if (!searchQuery.trim()) return null;

  return (
    <Box sx={{ mb: 2, mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Compare prices at retailers:
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: '12px' }}>
        {RETAILERS.map((retailer) => (
          <Chip
            key={retailer.name}
            label={retailer.name}
            icon={<ShoppingCartIcon sx={{ color: 'white' }} />}
            component="a"
            href={retailer.buildUrl(searchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            sx={{
              bgcolor: retailer.color,
              color: 'white',
              '&:hover': {
                bgcolor: retailer.color,
                filter: 'brightness(85%)',
                color: 'white',
              }
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar(props) {
  const { numSelected, totalHits, onCompare, onClearCompare, compareCount } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: 'primary.light',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Box sx={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" id="tableTitle" component="div">
            Search Results
          </Typography>
          <Chip
            size="small"
            icon={<InfoIcon />}
            label="Double-click any row to log food"
            color="info"
            variant="outlined"
          />
        </Box>
      )}
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 2 }}>
        Total Results: {totalHits}
      </Typography>
      
      {compareCount > 0 && (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Compare selected items">
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<CompareIcon />}
              onClick={onCompare}
            >
              Compare ({compareCount}/{MAX_COMPARE_ITEMS})
            </Button>
          </Tooltip>
          <Tooltip title="Clear comparison">
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<ClearIcon />}
              onClick={onClearCompare}
            >
              Clear
            </Button>
          </Tooltip>
        </Stack>
      )}
    </Toolbar>
  );
}

const FoodSearch = () => {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalHits, setTotalHits] = useState(0);
  const [selected, setSelected] = useState([]);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('score');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const navigate = useNavigate();
  const location = useLocation();
  const { compareItems, addCompareItem, removeCompareItem, clearCompareItems, isInCompare } = useCompare();
  
  // Extract logDate from URL parameters if present
  const queryParams = new URLSearchParams(location.search);
  const logDate = queryParams.get('logDate');
  const initialQuery = queryParams.get('q') || '';
  
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      debouncedSearch(initialQuery, 0, orderBy, order);
    }
  }, [initialQuery]);
  
  // Format date for display - fix timezone issues
  const formatDateForDisplay = (dateStr) => {
    // Check if it's our YYYY-MM-DD format
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      // Create date in local timezone (month is 0-indexed)
      return new Date(year, month - 1, day).toLocaleDateString();
    } 
    // Otherwise try to parse as regular date
    return dateStr ? new Date(dateStr).toLocaleDateString() : '';
  };

  const debouncedSearch = useCallback(
    debounce(async (searchQuery, pageNum, sortBy, sortOrder) => {
      if (!searchQuery.trim()) {
        setFoods([]);
        setTotalHits(0);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const results = await searchFoods(searchQuery, {
          pageSize: rowsPerPage,
          pageNumber: pageNum + 1,
          sortBy,
          sortOrder
        });
        
        const processedFoods = results.foods.map(food => {
          try {
            const nutrientData = extractNutrients(food, true);
            const macros = nutrientData.nutrients?.macronutrients || [];
            
            return {
              ...food,
              protein: macros.find(n => n.name === 'Protein')?.value || 0,
              fat: macros.find(n => n.name === 'Total Fat')?.value || 0,
              carbs: macros.find(n => n.name === 'Carbohydrates')?.value || 0,
              calories: macros.find(n => n.name === 'Energy')?.value || 0,
            };
          } catch (err) {
            console.error('Error processing food nutrients:', err, food);
            return {
              ...food,
              protein: 0,
              fat: 0,
              carbs: 0,
              calories: 0
            };
          }
        });

        setFoods(processedFoods);
        setTotalHits(results.totalHits);
      } catch (error) {
        console.error('Search failed:', error);
        setError('Failed to search foods. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500),
    [rowsPerPage]
  );

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    
    // Map UI column names to API sort parameters
    let apiSortBy = property;
    
    // The API uses different field names for sorting than our UI
    switch (property) {
      case 'calories':
        apiSortBy = 'foodNutrients.nutrientId:1008';
        break;
      case 'protein':
        apiSortBy = 'foodNutrients.nutrientId:1003';
        break;
      case 'fat':
        apiSortBy = 'foodNutrients.nutrientId:1004';
        break;
      case 'carbs':
        apiSortBy = 'foodNutrients.nutrientId:1005';
        break;
      // For other fields, use the property name directly
      default:
        apiSortBy = property;
    }
    
    debouncedSearch(query, page, apiSortBy, isAsc ? 'asc' : 'desc');
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = foods.map((food) => food.fdcId);
      setSelected(newSelecteds);
      
      // Add all to compare (up to max)
      if (event.target.checked) {
        const availableSlots = MAX_COMPARE_ITEMS - compareItems.length;
        if (availableSlots > 0) {
          const foodsToAdd = foods
            .filter(food => !isInCompare(food.fdcId))
            .slice(0, availableSlots);
          
          foodsToAdd.forEach(food => addCompareItem(food));
        }
      }
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, fdcId) => {
    const selectedIndex = selected.indexOf(fdcId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, fdcId);
      
      // Find the food item and add to compare
      const foodToAdd = foods.find(food => food.fdcId === fdcId);
      if (foodToAdd && !isInCompare(fdcId)) {
        // Only try to add if we're under the max
        if (compareItems.length < MAX_COMPARE_ITEMS) {
          addCompareItem(foodToAdd);
        } else {
          // Show a message that max items reached
          setError(`Maximum of ${MAX_COMPARE_ITEMS} items can be compared at once.`);
          setTimeout(() => setError(''), 3000);
        }
      }
    } else {
      // Remove from selected
      if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1),
        );
      }
      
      // Also remove from compare
      if (isInCompare(fdcId)) {
        removeCompareItem(fdcId);
      }
    }

    setSelected(newSelected);
  };

  const handleDoubleClick = (fdcId) => {
    // Build URL parameters
    const params = new URLSearchParams();
    if (logDate) {
      params.append('logDate', logDate);
    }
    if (query) {
      params.append('searchQuery', query);
    }
    
    // Navigate with all parameters
    const queryString = params.toString();
    navigate(`/food/${fdcId}${queryString ? `?${queryString}` : ''}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    debouncedSearch(query, newPage, orderBy, order);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    debouncedSearch(query, 0, orderBy, order);
  };

  const handleQueryChange = (event) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    setPage(0);
    debouncedSearch(newQuery, 0, orderBy, order);
  };

  // Update the isSelected function to also check the compare context
  const isItemInCompare = (fdcId) => isInCompare(fdcId);

  const handleCompareItems = () => {
    if (compareItems.length > 0) {
      navigate('/compare');
    }
  };

  const handleClearCompare = () => {
    clearCompareItems();
    setSelected([]);
  };

  return (
    <Layout>
      <Container>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Search Foods 
            {logDate && (
              <Chip 
                label={`For ${formatDateForDisplay(logDate)}`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for foods..."
            value={query}
            onChange={handleQueryChange}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          <RetailerQuickLinks searchQuery={query} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {totalHits > 5000 && foods.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your search returned {totalHits} results. Only the most relevant items are shown. Try a more specific search term for better results.
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <EnhancedTableToolbar 
              numSelected={selected.length} 
              totalHits={totalHits} 
              compareCount={compareItems.length}
              onCompare={handleCompareItems}
              onClearCompare={handleClearCompare}
            />
            <TableContainer>
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                <EnhancedTableHead
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={foods.length}
                />
                <TableBody>
                  {foods.map((food, index) => {
                    const isItemSelected = isItemInCompare(food.fdcId);
                    const labelId = `enhanced-table-checkbox-${index}`;

                    return (
                      <TableRow
                        hover
                        onClick={(event) => handleClick(event, food.fdcId)}
                        onDoubleClick={() => handleDoubleClick(food.fdcId)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={food.fdcId}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{
                              'aria-labelledby': labelId,
                            }}
                          />
                        </TableCell>
                        <TableCell component="th" id={labelId} scope="row">
                          {food.description || 'N/A'}
                        </TableCell>
                        <TableCell>{food.brandName || food.brandOwner || 'N/A'}</TableCell>
                        <TableCell>{food.foodCategory || 'N/A'}</TableCell>
                        <TableCell align="right">
                          {food.servingSize 
                            ? `${food.servingSize} ${food.servingSizeUnit || ''}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {typeof food.protein === 'number' 
                            ? food.protein.toFixed(1) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {typeof food.fat === 'number' 
                            ? food.fat.toFixed(1) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {typeof food.carbs === 'number' 
                            ? food.carbs.toFixed(1) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {typeof food.calories === 'number' 
                            ? food.calories.toFixed(0) 
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[25, 50, 100]}
              component="div"
              count={totalHits}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
      </Container>
    </Layout>
  );
};

export default FoodSearch; 