// USE "npm install, then npm run zybooks" in the console to build and launch the app
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompareProvider } from './contexts/CompareContext';
import { theme } from './theme.js';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FoodSearch from './pages/FoodSearch';
import FoodDetail from './pages/FoodDetail';
import Settings from './pages/Settings';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CompareItems from './pages/CompareItems';
import EditFoodLog from './pages/EditFoodLog';

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
                        </Routes>
                    </Router>
                </CompareProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;