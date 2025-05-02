# NutriByte Frontend

This directory contains the React-based frontend for the NutriByte app. The frontend is built with React, Material UI, and integrates with our Express.js backend for data persistence and USDA data access.

## Frontend Structure

```
src/
├── api/                # API integration modules
│   ├── analyticsApi.js # Analytics data fetching with client-side fallback
│   ├── foodApi.js      # USDA Food API integration
│   ├── logApi.js       # Food logging endpoints
│   └── userApi.js      # User settings endpoints
├── components/         # Reusable UI components
│   ├── Layout.jsx      # Main application layout
│   └── OptimizedImage.jsx # Image optimization with lazy loading
├── contexts/           # React contexts for state management
│   ├── AuthContext.jsx # User authentication state
│   └── CompareContext.jsx # Food comparison state
├── pages/              # Application pages
│   ├── AnalyticsDashboard.jsx # Nutrition analytics with charting
│   ├── CompareItems.jsx       # Food comparison tool
│   ├── Dashboard.jsx          # Main user dashboard with daily logs
│   ├── EditFoodLog.jsx        # Food log editing
│   ├── FoodDetail.jsx         # Detailed food info
│   ├── FoodSearch.jsx         # Food search interface with filters
│   ├── Login.jsx              # Authentication
│   └── Settings.jsx           # User preferences and nutrient targets
├── tests/              # Test suites
│   ├── components/     # Component tests
│   ├── pages/          # Page component tests
│   └── utils/          # Utility function tests
├── utils/              # Utility functions
│   ├── analyticsUtils.js # Data processing for charts
│   ├── debounce.js       # Input debouncing
│   └── nutrientUtils.js  # Nutrient calculations
├── App.js              # Main application component
├── App.css             # Global styles
├── index.js            # Application entry point
├── index.html          # HTML template
├── setupTests.js       # Jest test configuration
└── theme.js            # Material UI theme customization
```

## Key Features

### Modern, Responsive UI
- Material UI components provide a consistent and familiar interface
- Custom theme with nutrition-focused color palette
- Fully responsive layout across mobile, tablet, and desktop
- Optimized image loading for performance

### Enhanced Food Search
- Real-time search against USDA's Food Data Central database
- Intelligent filters for food categories, brands, and ingredients
- Color-coded retailer quick links
- Detailed nutritional information with visualization

### Comprehensive Analytics
- Customizable date range analysis
- Macro and micronutrient tracking with daily targets
- Trend visualization with time-series charts
- Breakdown of caloric sources

### Personalized Settings
- Custom nutrient target configuration
- Dynamic calculation of nutrient targets based on calorie goals
- Multiple food logging types (consumed, avoided, prepped)

### Performance Optimizations
- Client-side data processing fallbacks when server is unavailable
- Debounced search to minimize API calls
- Optimized rendering with React best practices

## Code Quality

- Consistent code style (double quotes, proper spacing)
- Modern JavaScript with arrow functions and ES6+ features
- Comprehensive test suite
- ESLint and Prettier integration
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