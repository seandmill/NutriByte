/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Stack,
  Link,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Fastfood as FastfoodIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Restaurant as RestaurantIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const FeatureCard = ({ icon, title, description }) => (
  <Card
    sx={{
      width: "100%",
      height: "240px",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.2s",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      "&:hover": {
        transform: "translateY(-4px)",
      },
    }}
  >
    <CardContent
      sx={{
        height: "100%",
        p: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        {React.cloneElement(icon, {
          sx: { fontSize: "2rem", color: "primary.main" },
        })}
        <Typography
          variant="h6"
          ml={2}
          sx={{
            fontSize: "1.25rem",
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          flex: 1,
          lineHeight: 1.6,
          fontSize: "1.1rem",
        }}
      >
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const AuthDialog = ({ open, onClose, isSignUp, setIsSignUp }) => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    if (isSignUp) {
      if (!formData.firstName?.trim()) {
        setError("First name is required");
        return false;
      }
      if (!formData.lastName?.trim()) {
        setError("Last name is required");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signup(formData);
      } else {
        await login(formData.email);
      }
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Auth error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: "450px",
          margin: "16px",
        },
      }}
    >
      <DialogContent sx={{ p: 4, minHeight: "500px" }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "text.secondary",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <FastfoodIcon
            sx={{
              fontSize: 48,
              color: "primary.main",
              mb: 2,
            }}
          />
          <Typography variant="h4" component="h2" gutterBottom>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            {isSignUp
              ? "Sign up to start tracking your nutrition journey"
              : "Sign in to continue your nutrition journey"}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {isSignUp && (
              <>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={isSignUp && error?.includes("First name")}
                />
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={isSignUp && error?.includes("Last name")}
                />
              </>
            )}
            <TextField
              required
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              error={error?.includes("email")}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            component="button"
            variant="body2"
            onClick={toggleMode}
            sx={{ textDecoration: "none" }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Link>
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleOpenDialog = (signUp) => {
    setIsSignUp(signUp);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const features = [
    {
      icon: <SearchIcon fontSize="large" color="primary" />,
      title: "Smart Food Search",
      description:
        "Access a comprehensive database of foods with detailed nutritional information.",
    },
    {
      icon: <TimelineIcon fontSize="large" color="primary" />,
      title: "Track Progress",
      description:
        "Monitor your nutritional intake and track your progress over time.",
    },
    {
      icon: <RestaurantIcon fontSize="large" color="primary" />,
      title: "Meal Planning",
      description:
        "Plan your meals and ensure you meet your nutritional goals.",
    },
    {
      icon: <TrendingUpIcon fontSize="large" color="primary" />,
      title: "Insights",
      description:
        "Get personalized insights and recommendations based on your eating habits.",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Navigation Bar */}
      <Box
        sx={{
          width: "100%",
          height: "64px",
          display: "flex",
          alignItems: "center",
          px: 4,
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          bgcolor: "white",
          position: "fixed",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          NutriByte
        </Typography>
        <Button color="inherit" onClick={() => handleOpenDialog(false)}>
          Log In
        </Button>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog(true)}
          sx={{ ml: 2 }}
        >
          Sign Up
        </Button>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          width: "100%",
          position: "relative",
          bgcolor: "white",
          pt: 15,
          pb: 10,
          textAlign: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url(/hero_image.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.92,
            zIndex: 0,
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              fontWeight: 800,
              mb: 3,
              color: "white",
              textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            Science-backed nutrition tracking at your fingertips
          </Typography>
          <Typography
            variant="h5"
            sx={{
              maxWidth: "800px",
              mx: "auto",
              mb: 6,
              color: "white",
              textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            From macros to micros, NutriByte gives you personalized insight into
            your diet, exercise, and health data so you can make more informed
            decisions about your health.
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          bgcolor: "background.default",
          py: 12,
          px: 4,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Grid
            container
            spacing={3}
            sx={{
              justifyContent: "center",
            }}
          >
            {features.map((feature, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={3}
                key={index}
                sx={{
                  maxWidth: "280px",
                }}
              >
                <FeatureCard {...feature} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Bottom CTA */}
      <Box
        sx={{
          width: "100%",
          bgcolor: "white",
          py: 12,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Start Your Health Journey Today
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Join thousands of users who are making better nutritional choices
            with NutriByte.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => handleOpenDialog(true)}
            sx={{
              py: 2,
              px: 6,
              fontSize: "1.1rem",
              borderRadius: 3,
            }}
          >
            Get Started Free
          </Button>
        </Container>
      </Box>

      <AuthDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
      />
    </Box>
  );
};

export default Login;
