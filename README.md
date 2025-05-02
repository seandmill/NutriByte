# NutriByte

## How To Run The App

```bash
npm install
npm run zybooks
```

This will build the React frontend and start the integrated server on port 8080.

## Project Overview
NutriByte is a user-friendly web app designed to empower consumers seeking greater insight into their dietary habits. 
Utilizing the comprehensive food composition data provided by the USDA, NutriByte will offer tools for users to look up, track, 
and analyze the nutritional information and ingredients of the food products they consume. The application will be developed using the 
MERN (MongoDB, Express.js, React, Node.js) technology stack, providing distinct scalability as both the size of the database 
and the featureset of the application grow.

## Learning Outcomes
Through this project, I've gained experience with:
- Building full-stack web applications with React and Node.js
- Working with external APIs and integrating third-party services
- Implementing responsive, accessible UI designs
- Creating data visualization components
- Proper state management in React applications

### Main Features
- **Food Search & Discovery**: Search USDA's database of hundreds of thousands of foods
- **Nutrition Logging**: Track daily food consumption with detailed nutrient breakdown
- **Nutrition Analytics**: Visualize nutrition intake patterns over time 
- **Food Comparison**: Compare nutritional profiles of different foods side-by-side
- **Custom Nutrition Targets**: Set and track personalized nutrition goals

## Tech Stack
- **Frontend**: React with Vite, Material UI, Chart.js
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **APIs**: USDA Food Data Central API
- **Authentication**: Email-based user authentication (no password in Phase 1)

## Directory Structure
```
NutriByte/
├── public/               # Static assets
├── server/               # Backend code
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── index.js          # Server entry point
│   └── integrated.js     # Integrated server (for ZyBooks)
├── src/                  # Frontend code
│   ├── api/              # API integration modules
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── pages/            # Application pages
│   └── utils/            # Utility functions
├── .env                  # Environment variables
├── package.json          # Project dependencies
└── vite.config.js        # Vite configuration
```

## Implementation Details
- **Component-Based Architecture**: Used React's component model for modular UI
- **Context API**: Implemented React contexts for global state management (user auth, food comparison)
- **Responsive Design**: Material UI's responsive components
- **API Integration**: Custom modules to integrate with USDA's nutrition database
- **Data Visualization**: Created visual representations of nutrition data using Chart.js
- **Optimization**: Implemented image optimization, caching, and lazy loading
- **Redis Caching**: Added Redis-based caching for USDA API responses to improve performance and reduce API calls

## Deployment Notes
- The app is configured to run on a single port (8080) for ZyBooks compatibility
- The integrated server (`server/integrated.js`) serves both the API and frontend
