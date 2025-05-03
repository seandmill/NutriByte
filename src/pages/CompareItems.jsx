import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  SearchOff as SearchOffIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import { useCompare } from "../contexts/CompareContext";
import { NUTRIENT_CATEGORIES, NUTRIENT_METADATA } from "../utils/nutrientUtils";

// Food placeholder image
const FOOD_PLACEHOLDER = "/placeholder_feature_image.webp";

const CompareItems = () => {
  const navigate = useNavigate();
  const { compareItems, removeCompareItem, clearCompareItems } = useCompare();

  const handleRemoveItem = (fdcId) => {
    removeCompareItem(fdcId);

    // If no items left, go back to search
    if (compareItems.length <= 1) {
      navigate("/search");
    }
  };

  const handleClearAll = () => {
    clearCompareItems();
    navigate("/search");
  };

  const handleBackToSearch = () => {
    navigate("/search");
  };

  const getNutrientValue = (food, nutrientId) => {
    // First check if we have the property directly
    const directProperties = {
      1003: "protein", // Protein
      1004: "fat", // Total Fat
      1005: "carbs", // Carbohydrates
      1008: "calories", // Energy
    };

    if (
      directProperties[nutrientId] &&
      food[directProperties[nutrientId]] !== undefined
    ) {
      return food[directProperties[nutrientId]];
    }

    // Otherwise look in nutrients object if available
    if (food.nutrients) {
      const category = NUTRIENT_METADATA[nutrientId]?.category;
      if (category && food.nutrients[category]) {
        const nutrient = food.nutrients[category].find(
          (n) => n.id === nutrientId
        );
        if (nutrient) return nutrient.value;
      }
    }

    return null;
  };

  const formatNutrientValue = (value, nutrientId) => {
    if (value === null || value === undefined) return "N/A";

    const metadata = NUTRIENT_METADATA[nutrientId];
    if (!metadata) return `${value}`;

    return `${value.toFixed(1)} ${metadata.unit}`;
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box mt={4} mb={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToSearch}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            Back to Search
          </Button>

          <Typography variant="h4" gutterBottom>
            Compare Foods
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={handleClearAll}
              sx={{ ml: 2 }}
              size="small"
            >
              Clear All
            </Button>
          </Typography>

          {compareItems.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <SearchOffIcon
                sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                No items to compare
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Select items from the search results to compare them.
              </Typography>
              <Button variant="contained" onClick={handleBackToSearch}>
                Go to Search
              </Button>
            </Paper>
          ) : (
            <>
              <Grid container spacing={3} mb={4}>
                {compareItems.map((food) => (
                  <Grid
                    item
                    xs={12}
                    md={12 / compareItems.length}
                    key={food.fdcId}
                  >
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={FOOD_PLACEHOLDER}
                        alt={food.description || "Food item"}
                        sx={{
                          objectFit: "contain",
                          backgroundColor: "#f5f5f5",
                        }}
                      />
                      <CardContent>
                        <Typography
                          gutterBottom
                          variant="h6"
                          component="div"
                          noWrap
                          title={food.description}
                        >
                          {food.description}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {food.brandName || food.brandOwner || "Generic"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {food.foodCategory || "Uncategorized"}
                        </Typography>
                        <Box mt={2}>
                          <Chip
                            label={
                              food.servingSize
                                ? `${food.servingSize} ${
                                    food.servingSizeUnit || "g"
                                  }`
                                : "No serving size"
                            }
                            color="primary"
                            size="small"
                          />
                        </Box>
                        <Box mt={2}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleRemoveItem(food.fdcId)}
                          >
                            Remove
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Macronutrients Summary */}
              <Typography variant="h5" gutterBottom>
                Macronutrients
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nutrient</TableCell>
                      {compareItems.map((food) => (
                        <TableCell key={food.fdcId} align="right">
                          {food.description}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Calories */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Calories
                      </TableCell>
                      {compareItems.map((food) => (
                        <TableCell key={food.fdcId} align="right">
                          {formatNutrientValue(
                            getNutrientValue(food, 1008),
                            1008
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {/* Protein */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Protein
                      </TableCell>
                      {compareItems.map((food) => (
                        <TableCell key={food.fdcId} align="right">
                          {formatNutrientValue(
                            getNutrientValue(food, 1003),
                            1003
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {/* Total Fat */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Total Fat
                      </TableCell>
                      {compareItems.map((food) => (
                        <TableCell key={food.fdcId} align="right">
                          {formatNutrientValue(
                            getNutrientValue(food, 1004),
                            1004
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {/* Carbohydrates */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Carbohydrates
                      </TableCell>
                      {compareItems.map((food) => (
                        <TableCell key={food.fdcId} align="right">
                          {formatNutrientValue(
                            getNutrientValue(food, 1005),
                            1005
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {/* Dietary Fiber */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Dietary Fiber
                      </TableCell>
                      {compareItems.map((food) => (
                        <TableCell key={food.fdcId} align="right">
                          {formatNutrientValue(
                            getNutrientValue(food, 1079),
                            1079
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {/* Total Sugars */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Total Sugars
                      </TableCell>
                      {compareItems.map((food) => (
                        <TableCell key={food.fdcId} align="right">
                          {formatNutrientValue(
                            getNutrientValue(food, 2000),
                            2000
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Other nutrient categories */}
              {["minerals", "vitamins", "lipids"].map((category) => {
                // Get all nutrients in this category that at least one item has
                const categoryNutrients = [];
                Object.entries(NUTRIENT_METADATA).forEach(([id, metadata]) => {
                  if (metadata.category === category) {
                    if (
                      compareItems.some(
                        (food) => getNutrientValue(food, Number(id)) !== null
                      )
                    ) {
                      categoryNutrients.push({ id: Number(id), ...metadata });
                    }
                  }
                });

                if (categoryNutrients.length === 0) return null;

                return (
                  <Box key={category} mt={4}>
                    <Typography variant="h5" gutterBottom>
                      {NUTRIENT_CATEGORIES[category]}
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Nutrient</TableCell>
                            {compareItems.map((food) => (
                              <TableCell key={food.fdcId} align="right">
                                {food.description}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryNutrients.map((nutrient) => (
                            <TableRow key={nutrient.id}>
                              <TableCell component="th" scope="row">
                                {nutrient.name}
                              </TableCell>
                              {compareItems.map((food) => (
                                <TableCell key={food.fdcId} align="right">
                                  {formatNutrientValue(
                                    getNutrientValue(food, nutrient.id),
                                    nutrient.id
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              })}
            </>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default CompareItems;
