/* eslint-disable no-unused-vars */
import express, { json } from "express";
import mongoose from "mongoose";
const { connect } = mongoose;
import cors from "cors";
import { config } from "dotenv";
import { resolve, join } from "path";
import axios from "axios";
import { existsSync, readdirSync } from "fs";
import { initRedisClient } from "./utils/redisClient.js";
import { cacheMiddleware } from "./middleware/cache.js";
import cluster from "node:cluster";
import { initCluster, getClusterInfo } from "./cluster.js";

config();

// Log for debugging
console.log(
  "USDA API KEY status:",
  process.env.USDA_API_KEY ? "Key is set" : "Key is missing"
);

const app = express();

// CORS configuration based on environment
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || [process.env.HEROKU_URL]
        : ["http://localhost:8080", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-User-Email"],
  })
);
app.use(json());

// Log middleware to track requests
app.use((req, res, next) => {
  const workerId = process.env.WORKER_ID || "primary";
  const startTime = new Date();

  // Add worker ID to response headers
  res.setHeader("X-Worker-ID", workerId);

  // Log after request is sent
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = new Date() - startTime;
    console.log(
      `${new Date().toISOString()} - Worker ${workerId} - ${req.method} ${
        req.originalUrl || req.url
      } - ${duration}ms`
    );

    if (cluster.isWorker) {
      try {
        // Report the worker that handled the request
        process.send({
          type: "INCREMENT_REQUESTS",
          workerId: workerId,
        });
      } catch (err) {
        console.error("Failed to send message to primary process:", err);
      }
    }

    originalEnd.apply(this, args);
  };

  next();
});

// Routes
import authRoutes from "./routes/auth.js";
import logsRoutes from "./routes/logs.js";
import userRoutes from "./routes/userRoutes.js";

// MongoDB connection
connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log("✅ User model loaded");
    console.log("✅ FoodLog model loaded");

    // Initialize Redis client after MongoDB is connected
    initRedisClient()
      .then((client) => {
        if (client && client.isReady) {
          console.log("✅ Redis caching enabled");
        } else {
          console.warn("⚠️ Redis caching disabled - continuing without cache");
        }
      })
      .catch((err) => {
        console.error("❌ Redis connection error:", err);
        console.warn("⚠️ Continuing without Redis caching");
      });
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/users", userRoutes);

// Cluster status endpoint
app.get("/api/cluster/status", (req, res) => {
  const workerId = process.env.WORKER_ID || "primary";
  const clusterInfo = getClusterInfo();
  res.json({
    currentWorker: workerId,
    timestamp: new Date().toISOString(),
    clusterEnabled: process.env.ENABLE_CLUSTERING === "true",
    clusterInfo,
  });
});

// Handle API JavaScript file requests that should be modules
app.get("/api/:apiFile.js", (req, res) => {
  const { apiFile } = req.params;
  console.log(`Redirecting API file request for ${apiFile}.js to /`);
  res.redirect("/");
});

// Add proxy for USDA API requests with Redis caching (30 minute cache)
app.get("/api/foods/search", cacheMiddleware(1800), async (req, res) => {
  try {
    const apiKey = process.env.USDA_API_KEY;
    console.log(
      "Using API Key for food search:",
      apiKey.substring(0, 3) + "..."
    );

    const requestParams = {
      ...req.query,
      api_key: apiKey,
    };

    console.log("Food search request params:", JSON.stringify(requestParams));

    const response = await axios.get(
      "https://api.nal.usda.gov/fdc/v1/foods/search",
      {
        params: requestParams,
      }
    );

    console.log("USDA API search response status:", response.status);
    res.json(response.data);
  } catch (error) {
    console.error("Error proxying USDA API search request:", error);
    console.error("Request details:", error.config?.url, error.config?.params);
    res.status(error.response?.status || 500).json({
      message: "Error fetching food data",
      error: error.response?.data || error.message,
    });
  }
});

// Cache individual food api calls for 1 day
app.get("/api/food/:fdcId", cacheMiddleware(86400), async (req, res) => {
  try {
    const apiKey = process.env.USDA_API_KEY;
    console.log(
      "Using API Key for food detail:",
      apiKey.substring(0, 3) + "..."
    );

    const requestParams = {
      ...req.query,
      api_key: apiKey,
    };

    console.log(
      `Food detail request for ID ${req.params.fdcId} with params:`,
      JSON.stringify(requestParams)
    );

    const response = await axios.get(
      `https://api.nal.usda.gov/fdc/v1/food/${req.params.fdcId}`,
      {
        params: requestParams,
      }
    );

    console.log("USDA API detail response status:", response.status);
    res.json(response.data);
  } catch (error) {
    console.error(
      `Error proxying USDA API detail request for ID ${req.params.fdcId}:`,
      error
    );
    console.error("Request details:", error.config?.url, error.config?.params);
    res.status(error.response?.status || 500).json({
      message: "Error fetching food details",
      error: error.response?.data || error.message,
    });
  }
});

// Basic error handling middleware for API routes
app.use("/api", (err, req, res) => {
  console.error("API Error:", err.stack);
  res.status(500).json({ message: "Something went wrong with the API!" });
});

// Simplified static file serving for production
if (
  process.env.NODE_ENV === "production" ||
  process.env.SERVE_STATIC === "true"
) {
  const clientPath = resolve(process.cwd(), "dist");
  console.log("Serving static files from:", clientPath);

  // Debug: List contents of current and dist directories using readdirSync
  try {
    console.log("Current directory:", process.cwd());
    console.log("Current directory contents:", readdirSync(process.cwd()));
    if (existsSync(clientPath)) {
      console.log("Dist directory contents:", readdirSync(clientPath));
    } else {
      console.log("Dist directory does not exist yet.");
    }
  } catch (err) {
    console.error("Error listing directories:", err);
  }

  // Serve the main build directory (handles index.html and root assets like images)
  app.use(express.static(clientPath));

  // Serve assets directory specifically (handles CSS, JS chunks, etc.)
  app.use("/assets", express.static(join(clientPath, "assets")));

  // For any non-API routes, send the React app's index.html
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }
    // Skip requests that look like files (have an extension)
    if (/\/[^/]+\.[^/]+$/.test(req.path)) {
      console.log(`Skipping file-like path for SPA fallback: ${req.path}`);
      return next(); // Let static middleware handle or 404
    }

    const indexPath = join(clientPath, "index.html");
    if (existsSync(indexPath)) {
      console.log(`SPA Fallback: Serving index.html for path: ${req.path}`);
      res.sendFile(indexPath);
    } else {
      console.error("index.html not found at:", indexPath);
      res.status(404).send("Could not find index.html");
    }
  });
} else {
  console.log("Static file serving disabled - development mode");
}

// General error handling
app.use((err, req, res, next) => {
  console.error("General Error:", err.stack);
  res.status(500).send("Something went wrong!");
  // next() is required by Express but not used in this final error handler
});

// Start server with dynamic port
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`API routes accessible at http://localhost:${PORT}/api/`);
        console.log(`Frontend accessible at http://localhost:${PORT}/`);
      }
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Please try these solutions:`
        );
        console.error("1. Kill the process using the port:");
        console.error(`   lsof -i :${PORT} | grep LISTEN`);
        console.error("   kill <PID>");
        console.error("2. Or use a different port:");
        console.error("   PORT=5001 npm run dev");
        process.exit(1);
      } else {
        console.error("Server error:", error);
        process.exit(1);
      }
    });

    // Handle shutdown
    process.on("SIGTERM", () => {
      console.info("SIGTERM signal received. Closing server...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.info("SIGINT signal received. Closing server...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Initialize clustering and start server only if this is a worker or clustering is disabled
if (initCluster()) {
  startServer();
}
