import cluster from "cluster";
import os from "os";
import { dirname } from "path";
import { fileURLToPath } from "url";
import process from "process";

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Get the number of available CPU cores
const numCPUs = os.cpus().length;

// Store worker information
const workers = {};

// Create a unique ID for each worker
let workerId = 1;

// Store cluster info when requested by workers
let cachedClusterInfo = {
  totalCPUs: numCPUs,
  activeWorkers: 0,
  workers: [],
};

// Update the cached cluster info every 2 seconds
function updateCachedClusterInfo() {
  if (cluster.isPrimary) {
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
      activeWorkers: workerList.length,
      workers: workerList,
    };

    console.log(`Cluster info updated: ${workerList.length} workers tracked`);
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

// Initialize the cluster
export const initCluster = () => {
  // Determine if clustering is enabled via environment variable
  const clusteringEnabled = process.env.ENABLE_CLUSTERING === "true";

  if (!clusteringEnabled) {
    console.log("⚠️ Clustering is disabled. Running in single-process mode.");
    process.env.WORKER_ID = "1";
    return true; // Run app in the current process
  }

  if (cluster.isPrimary) {
    console.log(`🚀 Primary ${process.pid} is running`);
    console.log(`🧠 Starting ${numCPUs} workers...`);

    // Fork workers for each available CPU
    for (let i = 0; i < numCPUs; i++) {
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

      console.log(
        `👷 Worker ${workerIndex} started (PID: ${worker.process.pid})`
      );
    }

    // Handle worker exit event
    cluster.on("exit", (worker, code, signal) => {
      const deadWorkerId = workers[worker.id]?.id || "unknown";
      console.log(
        `👷 Worker ${deadWorkerId} died (PID: ${worker.process.pid})`
      );
      console.log(`💀 Exit code: ${code}`);
      console.log(`🚦 Signal: ${signal}`);

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

      console.log(
        `👷 New worker ${newWorkerIndex} started (PID: ${newWorker.process.pid})`
      );
    });

    // Listen for messages from workers
    cluster.on("message", (worker, msg) => {
      console.log(`Message from worker ${worker.id}:`, msg);

      if (msg.type === "INCREMENT_REQUESTS") {
        if (workers[worker.id]) {
          // Increment request count for the specific worker
          workers[worker.id].requestsHandled =
            (workers[worker.id].requestsHandled || 0) + 1;
          console.log(
            `Worker ${workers[worker.id].id} request count updated to ${
              workers[worker.id].requestsHandled
            }`
          );

          // Update cluster info after incrementing request count
          updateCachedClusterInfo();

          // Broadcast updated info to all workers immediately
          for (const id in cluster.workers) {
            try {
              cluster.workers[id].send({
                type: "CLUSTER_INFO",
                data: cachedClusterInfo,
              });
            } catch (error) {
              console.error(
                `Failed to send updated info to worker ${id}:`,
                error
              );
            }
          }
        } else {
          console.warn(`Worker ${worker.id} not found in workers registry`);
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

      // Broadcast updated info to all workers with extensive logging
      console.log(
        `Broadcasting cluster info to ${
          Object.keys(cluster.workers).length
        } workers, containing ${cachedClusterInfo.workers.length} workers data`
      );

      for (const id in cluster.workers) {
        try {
          cluster.workers[id].send({
            type: "CLUSTER_INFO",
            data: cachedClusterInfo,
          });
        } catch (err) {
          console.error(`Failed to send cluster info to worker ${id}:`, err);
        }
      }
    }, 1000); // Update every second for faster feedback

    return false; // Primary doesn't run the app
  } else {
    // This is a worker process
    console.log(`🔧 Worker ${process.pid} started`);

    // Set a default worker ID if message hasn't arrived yet
    if (!process.env.WORKER_ID) {
      process.env.WORKER_ID = `w${process.pid}`;
    }

    // Listen for messages from primary
    process.on("message", (msg) => {
      if (msg.type === "WORKER_ID") {
        process.env.WORKER_ID = msg.id.toString();
        console.log(
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
    }, 5000); // Request every 5 seconds

    return true; // Workers run the app
  }
};

// Increment request counter for current worker
export const incrementRequestCount = () => {
  if (process.send) {
    process.send({ type: "INCREMENT_REQUESTS" });
  }
};
