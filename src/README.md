# NutriByte Frontend

This directory contains the React-based frontend for the NutriByte nutrition tracking application. The frontend is built with React, Vite, and Material UI.

## Frontend Structure

```
src/
├── api/                # API integration modules
│   ├── analyticsApi.js # Analytics data fetching
│   ├── foodApi.js      # USDA Food API integration
│   ├── logApi.js       # Food logging endpoints
│   └── userApi.js      # User settings endpoints
├── components/         # Reusable UI components
│   ├── Layout.jsx      # Main application layout
│   └── OptimizedImage.jsx # Image optimization component
├── contexts/           # React contexts for state management
│   ├── AuthContext.jsx # User authentication state
│   └── CompareContext.jsx # Food comparison state
├── pages/              # Application pages
│   ├── AnalyticsDashboard.jsx # Nutrition analytics
│   ├── CompareItems.jsx       # Food comparison tool
│   ├── Dashboard.jsx          # Main user dashboard
│   ├── EditFoodLog.jsx        # Food log editing (Phase 2 - Phase 1 is a popup)
│   ├── FoodDetail.jsx         # Detailed food info
│   ├── FoodSearch.jsx         # Food search interface
│   ├── Login.jsx              # Authentication (Phase 1 - email-only)
│   └── Settings.jsx           # User preferences
├── utils/              # Utility functions
│   ├── analyticsUtils.js # Data processing for charts
│   ├── debounce.js       # Input debouncing
│   └── nutrientUtils.js  # Nutrient calculations
├── App.js              # Main application component
├── App.css             # Global styles
├── index.js            # Application entry point
├── index.html          # HTML template
└── theme.js            # Material UI theme customization
```

## Key Features

### Simple, Clean UI
- Material UI components provide a consistent and familiar interface
- Custom theme with nutrition-focused color palette
- Responsive layout adapts to different screen sizes

### Food Search
- Real-time search against USDA's Food Data Central database
- Filters for food categories and brands
- Detailed nutritional information display

### Nutrition Dashboard
- Daily food log with nutritional summary
- Macro and micronutrient tracking
- Interactive charts for visualizing nutritional patterns

### Food Comparison
- Side-by-side comparison of multiple food items
- Detailed nutrient breakdown
- Visual representation of nutritional differences

### Image Optimization
- `OptimizedImage.jsx` component provides:
  - Lazy loading for improved performance
  - Loading skeleton placeholders
  - Error handling with fallback images
  - Client-side caching

## State Management

The application uses React's Context API for global state management:

- **AuthContext**: Manages user authentication state and session persistence
- **CompareContext**: Tracks foods selected for comparison

## API Integration

The `api/` directory contains modules for interacting with:

1. Backend Express.js API endpoints
2. USDA Food Data Central API (proxied through backend)

## Data Visualization

The analytics dashboard uses Chart.js to visualize:
- Macronutrient distribution
- Calorie intake trends
- Micronutrient consumption patterns

## Development Notes

### Adding New Components
When creating new UI components:
1. Follow the existing component structure
2. Use Material UI components for consistency
3. Implement the `OptimizedImage` component for any images

### Style Guidelines
- Material UI's `sx` prop is preferred for component styling
- Global styles are in App.css
- Theme customization is in theme.js

### Running the Frontend
From the project root:
```bash
npm install
npm run dev
```