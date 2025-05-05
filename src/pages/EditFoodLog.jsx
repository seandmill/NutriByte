import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout.jsx";
import { getFoodLog, updateFoodLog } from "@clientApi/logApi.js";

const EditFoodLog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [foodLog, setFoodLog] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [logType, setLogType] = useState("consumed");

  useEffect(() => {
    const fetchFoodLog = async () => {
      try {
        console.log(`Fetching food log with ID: ${id}`);
        const data = await getFoodLog(id);
        console.log("Food log data received:", data);
        setFoodLog(data);
        setQuantity(data.quantity.toString());
        setLogType(data.logType);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch food log:", error);
        if (error.response) {
          console.error(
            "Server response:",
            error.response.status,
            error.response.data
          );
        }
        setError("Failed to load food log. Please try again.");
        setLoading(false);
      }
    };

    fetchFoodLog();
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "" || (!isNaN(value) && Number(value) >= 0)) {
      setQuantity(value);
    }
  };

  const handleLogTypeChange = (e) => {
    setLogType(e.target.value);
  };

  const handleSubmit = async () => {
    if (!foodLog) return;

    setSaving(true);
    setError("");

    try {
      await updateFoodLog(id, {
        quantity: Number(quantity),
        logType,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Failed to update food log:", error);
      setError("Failed to update food log. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <Layout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!foodLog) {
    return (
      <Layout>
        <Container maxWidth="md">
          <Alert severity="error">Food log not found</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Box mb={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ mb: 2 }}
          >
            Back to Dashboard
          </Button>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Edit Food Log
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Food log updated successfully!
              </Alert>
            )}

            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                {foodLog.foodName}
              </Typography>
              {foodLog.brandName && (
                <Typography variant="body2" color="text.secondary">
                  {foodLog.brandName}
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={3}>
              <TextField
                label="Quantity"
                value={quantity}
                onChange={handleQuantityChange}
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
                helperText={
                  foodLog.servingSize && foodLog.servingUnit
                    ? `Serving size: ${foodLog.servingSize} ${foodLog.servingUnit}`
                    : "Serving size"
                }
              />

              <FormControl fullWidth>
                <InputLabel>Log Type</InputLabel>
                <Select
                  value={logType}
                  onChange={handleLogTypeChange}
                  label="Log Type"
                >
                  <MenuItem value="consumed">Consumed</MenuItem>
                  <MenuItem value="avoided">Avoided</MenuItem>
                  <MenuItem value="prepped">Prepped for Later</MenuItem>
                </Select>
              </FormControl>

              <Box mt={2}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nutritional Information (per serving):
                </Typography>
                <Stack
                  direction="row"
                  spacing={2}
                  divider={<Divider orientation="vertical" flexItem />}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Calories
                    </Typography>
                    <Typography variant="body1">
                      {Math.round(foodLog.calories || 0)} kcal
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Protein
                    </Typography>
                    <Typography variant="body1">
                      {Math.round(foodLog.protein || 0)}g
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Carbs
                    </Typography>
                    <Typography variant="body1">
                      {Math.round(foodLog.carbs || 0)}g
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Fat
                    </Typography>
                    <Typography variant="body1">
                      {Math.round(foodLog.fat || 0)}g
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button variant="outlined" onClick={handleCancel} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Layout>
  );
};

export default EditFoodLog;
