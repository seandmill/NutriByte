import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { CompareProvider } from "./contexts/CompareContext.jsx";
import { theme } from "./theme.js";

// Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FoodSearch from "./pages/FoodSearch.jsx";
import FoodDetail from "./pages/FoodDetail.jsx";
import Settings from "./pages/Settings.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import CompareItems from "./pages/CompareItems.jsx";
import EditFoodLog from "./pages/EditFoodLog.jsx";
import ClusterDashboard from "./pages/ClusterDashboard.jsx";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CompareProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Navigate to="/dashboard" replace />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <PrivateRoute>
                    <FoodSearch />
                  </PrivateRoute>
                }
              />
              <Route
                path="/food/edit/:id"
                element={
                  <PrivateRoute>
                    <EditFoodLog />
                  </PrivateRoute>
                }
              />
              <Route
                path="/food/:id"
                element={
                  <PrivateRoute>
                    <FoodDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/compare"
                element={
                  <PrivateRoute>
                    <CompareItems />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PrivateRoute>
                    <AnalyticsDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/cluster"
                element={
                  <PrivateRoute>
                    <ClusterDashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
        </CompareProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
