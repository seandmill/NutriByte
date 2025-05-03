import cluster from "cluster";
import os from "os";
import { dirname } from "path";
import { fileURLToPath } from "url";
import process from "process";

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Get the number of available CPU cores
const numCPUs = os.cpus().length;

// WORKER_COUNT environment variable to limit the number of workers
// Default to minimum of CPU count or 2 to avoid memory issues
const WORKER_COUNT = process.env.WORKER_COUNT 
  ? parseInt(process.env.WORKER_COUNT, 10) 
  : Math.min(numCPUs, 2);

// Store worker information
const workers = {};

// Create a unique ID for each worker
let workerId = 1;

// Logging level - set to 'error', 'warn', 'info', or 'debug'
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'warn' : 'info';

// Custom logging with levels to reduce output in production
const logger = {
  error: (...args) => console.error(...args),
  warn: (...args) => LOG_LEVEL !== 'error' && console.warn(...args),
  info: (...args) => ['info', 'debug'].includes(LOG_LEVEL) && console.log(...args),
  debug: (...args) => LOG_LEVEL === 'debug' && console.log(...args)
};

// Store cluster info when requested by workers
let cachedClusterInfo = {
  totalCPUs: numCPUs,
  maxWorkers: WORKER_COUNT,
  activeWorkers: 0,
  workers: [],
};

// Keep track of when we last updated cluster info to reduce frequency
let lastInfoUpdate = 0;
const UPDATE_INTERVAL = 5000; // 5 seconds between updates

// Update the cached cluster info
function updateCachedClusterInfo() {
  if (cluster.isPrimary) {
    // Limit update frequency
    const now = Date.now();
    if (now - lastInfoUpdate < UPDATE_INTERVAL) {
      return;
    }
    
    lastInfoUpdate = now;
    
    // For primary, directly use worker data from the workers object
    const workerList = [];

    // Convert the workers object to an array
    for (const id in workers) {
      if (workers[id]) {
        workerList.push({
          id: workers[id].id,
          pid: workers[id].pid,
          status: workers[id].state || "online",
          startTime: workers[id].startTime,
          requestsHandled: workers[id].requestsHandled || 0,
        });
      }
    }

    // Add workers from cluster.workers that might be missing
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      if (worker && !workers[worker.id]) {
        // This worker exists but isn't in our tracking yet
        workers[worker.id] = {
          id: workerId++,
          pid: worker.process.pid,
          state: "online",
          startTime: new Date(),
          requestsHandled: 0,
          process: worker.process,
        };

        // Add to our list
        workerList.push({
          id: workers[worker.id].id,
          pid: workers[worker.id].pid,
          status: workers[worker.id].state || "online",
          startTime: workers[worker.id].startTime,
          requestsHandled: workers[worker.id].requestsHandled || 0,
        });
      }
    }

    // Update the cached info
    cachedClusterInfo = {
      totalCPUs: numCPUs,
      maxWorkers: WORKER_COUNT,
      activeWorkers: workerList.length,
      workers: workerList,
    };

    logger.debug(`Cluster info updated: ${workerList.length} workers tracked`);
  }
}

// Export cluster information for the dashboard
export const getClusterInfo = () => {
  if (cluster.isPrimary) {
    // Primary process has direct access to workers
    updateCachedClusterInfo();
  }

  // Both primary and workers can access the cached info
  return cachedClusterInfo;
};

// Monitor memory usage and restart workers if needed
function monitorMemoryUsage() {
  if (cluster.isPrimary) {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.rss / 1024 / 1024;
    
    logger.debug(`Memory usage: ${memoryUsageMB.toFixed(2)}MB`);
    
    // If memory usage is above 90% of 512MB limit (Heroku free tier), recycle workers
    if (memoryUsageMB > 450) {
      logger.warn(`Memory usage high (${memoryUsageMB.toFixed(2)}MB), recycling workers...`);
      
      // Gracefully restart workers one at a time
      Object.keys(cluster.workers).forEach((id, index) => {
        setTimeout(() => {
          if (cluster.workers[id]) {
            logger.info(`Recycling worker ${id} due to high memory usage`);
            cluster.workers[id].disconnect();
          }
        }, index * 5000); // Stagger restarts by 5 seconds
      });
    }
  }
}

// Run garbage collection if available
function runGarbageCollection() {
  if (global.gc) {
    logger.debug('Running manual garbage collection');
    global.gc();
  }
}

// Initialize the cluster
export const initCluster = () => {
  // Determine if clustering is enabled via environment variable
  const clusteringEnabled = process.env.ENABLE_CLUSTERING === "true";

  if (!clusteringEnabled) {
    logger.info("⚠️ Clustering is disabled. Running in single-process mode.");
    process.env.WORKER_ID = "1";
    return true; // Run app in the current process
  }

  if (cluster.isPrimary) {
    logger.info(`🚀 Primary ${process.pid} is running`);
    logger.info(`🧠 Starting ${WORKER_COUNT} workers (of ${numCPUs} available cores)...`);

    // Setup memory monitoring
    setInterval(monitorMemoryUsage, 60000); // Check every minute

    // Fork workers for each available CPU, limited by WORKER_COUNT
    for (let i = 0; i < WORKER_COUNT; i++) {
      const worker = cluster.fork();
      const workerIndex = workerId++;

      // Store worker info with metadata
      workers[worker.id] = {
        id: workerIndex,
        pid: worker.process.pid,
        state: "online",
        startTime: new Date(),
        requestsHandled: 0,
        process: worker.process,
      };

      // Send worker ID to the worker
      worker.send({ type: "WORKER_ID", id: workerIndex });

      logger.info(
        `👷 Worker ${workerIndex} started (PID: ${worker.process.pid})`
      );
    }

    // Handle worker exit event
    cluster.on("exit", (worker, code, signal) => {
      const deadWorkerId = workers[worker.id]?.id || "unknown";
      logger.warn(
        `👷 Worker ${deadWorkerId} died (PID: ${worker.process.pid})`
      );
      logger.warn(`💀 Exit code: ${code}`);
      logger.warn(`🚦 Signal: ${signal}`);

      // Remove the worker from our records
      delete workers[worker.id];

      // Replace the dead worker
      const newWorker = cluster.fork();
      const newWorkerIndex = workerId++;

      workers[newWorker.id] = {
        id: newWorkerIndex,
        pid: newWorker.process.pid,
        state: "online",
        startTime: new Date(),
        requestsHandled: 0,
        process: newWorker.process,
      };

      // Send worker ID to the new worker
      newWorker.send({ type: "WORKER_ID", id: newWorkerIndex });

      logger.info(
        `👷 New worker ${newWorkerIndex} started (PID: ${newWorker.process.pid})`
      );
    });

    // Listen for messages from workers
    cluster.on("message", (worker, msg) => {
      logger.debug(`Message from worker ${worker.id}:`, msg);

      if (msg.type === "INCREMENT_REQUESTS") {
        if (workers[worker.id]) {
          // Increment request count for the specific worker
          workers[worker.id].requestsHandled =
            (workers[worker.id].requestsHandled || 0) + 1;
          logger.debug(
            `Worker ${workers[worker.id].id} request count updated to ${
              workers[worker.id].requestsHandled
            }`
          );

          // Update cluster info after incrementing request count
          updateCachedClusterInfo();

          // Only broadcast to workers when info has actually been updated
          const now = Date.now();
          if (now - lastInfoUpdate >= UPDATE_INTERVAL) {
            // Broadcast updated info to all workers 
            for (const id in cluster.workers) {
              try {
                cluster.workers[id].send({
                  type: "CLUSTER_INFO",
                  data: cachedClusterInfo,
                });
              } catch (error) {
                logger.error(
                  `Failed to send updated info to worker ${id}:`,
                  error
                );
              }
            }
          }
        } else {
          logger.warn(`Worker ${worker.id} not found in workers registry`);
        }
      } else if (msg.type === "GET_CLUSTER_INFO") {
        // Worker is requesting cluster info
        updateCachedClusterInfo();
        worker.send({ type: "CLUSTER_INFO", data: cachedClusterInfo });
      }
    });

    // Immediately update cluster info when starting
    updateCachedClusterInfo();

    // Periodically update cluster info and broadcast to all workers
    setInterval(() => {
      updateCachedClusterInfo();

      // Broadcast updated info to all workers, but with less logging
      logger.debug(
        `Broadcasting cluster info to ${
          Object.keys(cluster.workers).length
        } workers`
      );

      for (const id in cluster.workers) {
        try {
          cluster.workers[id].send({
            type: "CLUSTER_INFO",
            data: cachedClusterInfo,
          });
        } catch (err) {
          logger.error(`Failed to send cluster info to worker ${id}:`, err);
        }
      }
    }, 10000); // Reduced from 1000ms to 10000ms (10 seconds)

    return false; // Primary doesn't run the app
  } else {
    // This is a worker process
    logger.info(`🔧 Worker ${process.pid} started`);

    // Set a default worker ID if message hasn't arrived yet
    if (!process.env.WORKER_ID) {
      process.env.WORKER_ID = `w${process.pid}`;
    }

    // Listen for messages from primary
    process.on("message", (msg) => {
      if (msg.type === "WORKER_ID") {
        process.env.WORKER_ID = msg.id.toString();
        logger.info(
          `Worker ${process.pid} assigned ID: ${process.env.WORKER_ID}`
        );
      } else if (msg.type === "CLUSTER_INFO") {
        // Update cached cluster info from primary
        cachedClusterInfo = msg.data;
      }
    });

    // Periodically request cluster info from primary
    setInterval(() => {
      if (process.send) {
        process.send({ type: "GET_CLUSTER_INFO" });
      }
    }, 30000); // Reduced from every 5 seconds to every 30 seconds
    
    // Setup garbage collection if available
    if (global.gc) {
      logger.info('Garbage collection available, scheduling periodic collection');
      setInterval(runGarbageCollection, 30000); // Run GC every 30 seconds
    }

    return true; // Workers run the app
  }
};

// Increment request counter for current worker
export const incrementRequestCount = () => {
  if (process.send) {
    process.send({ type: "INCREMENT_REQUESTS" });
  }
};
