import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Paper,
  Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
  Compare as CompareIcon,
  Engineering as EngineeringIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Search Foods", icon: <SearchIcon />, path: "/search" },
    { text: "Compare Foods", icon: <CompareIcon />, path: "/compare" },
    { text: "Analytics", icon: <AnalyticsIcon />, path: "/analytics" },
    { text: "My Targets", icon: <SettingsIcon />, path: "/settings" },
    { text: "Cluster", icon: <EngineeringIcon />, path: "/cluster" },
  ];

  const drawer = (
    <div>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 3,
          px: 2,
        }}
      >
        <OptimizedImage
          component="img"
          src="/nutribyte_logo.webp"
          alt="NutriByte Logo"
          priority={true}
          sx={{
            width: "calc(100% - 5px)",
            maxHeight: "200px", /* Reduced size for faster loading */
            objectFit: "contain",
          }}
        />
      </Box>
      <Divider sx={{ mx: 2 }} />
      <List sx={{ mt: 3, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              my: 1,
              mx: 1,
              borderRadius: 2,
              transition: "all 0.2s ease",
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "white",
                transform: "translateX(5px)",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                "& .MuiListItemIcon-root": {
                  color: "white",
                },
              },
              "&:hover": {
                bgcolor: "primary.light",
                color: "white",
                transform: "translateX(5px)",
                "& .MuiListItemIcon-root": {
                  color: "goldenrod",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  location.pathname === item.path ? "goldenrod" : "inherit",
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: location.pathname === item.path ? "bold" : "normal",
                color:
                  location.pathname === item.path ? "goldenrod" : "inherit",
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1, minHeight: "100px" }} />
      <Divider sx={{ mx: 2 }} />
      <ListItem
        button
        onClick={handleLogout}
        sx={{
          my: 2,
          mx: 3,
          borderRadius: 2,
          bgcolor: "error.light",
          color: "white",
          boxShadow: "0 2px 8px rgba(211, 47, 47, 0.3)",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "error.main",
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(211, 47, 47, 0.4)",
          },
        }}
      >
        <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText
          primary="Logout"
          primaryTypographyProps={{ fontWeight: "medium" }}
        />
      </ListItem>
      <Box sx={{ pb: 2 }} />
    </div>
  );

  // Mobile header for small screens only
  const mobileHeader = (
    <Box
      sx={{
        display: { xs: "flex", sm: "none" },
        alignItems: "center",
        height: "64px",
        px: 2,
        bgcolor: "primary.main",
        color: "white",
      }}
    >
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ mr: 2 }}
      >
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" component="div">
        {menuItems.find((item) => item.path === location.pathname)?.text ||
          "NutriByte"}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {mobileHeader}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "2px 0px 10px rgba(0, 0, 0, 0.05)",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          bgcolor: "#F7F7F7",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            minHeight: "calc(100vh - 48px)",
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
};

export default Layout;
