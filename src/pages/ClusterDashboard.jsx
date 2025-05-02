import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Memory as MemoryIcon,
  AccessTime as AccessTimeIcon,
  Computer as ComputerIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import axios from "axios";
import Layout from "../components/Layout";

function formatTime(timestamp) {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function ClusterDashboard() {
  const [clusterInfo, setClusterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestCounter, setRequestCounter] = useState(0);

  const fetchClusterStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/cluster/status");
      console.log("Cluster data received:", response.data);

      // Debug worker info
      if (response.data.clusterInfo && response.data.clusterInfo.workers) {
        console.log("Workers count:", response.data.clusterInfo.workers.length);
        console.log("Workers data:", response.data.clusterInfo.workers);
      } else {
        console.warn("No workers data found in response");
      }

      setClusterInfo(response.data);
      setError(null);

      // Increment the request counter
      setRequestCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error fetching cluster status:", err);
      setError(err.message || "Failed to fetch cluster data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterStatus();

    // Poll for updates every 3 seconds
    const intervalId = setInterval(fetchClusterStatus, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleManualRefresh = () => {
    fetchClusterStatus();
  };

  return (
    <Layout>
      <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            <MemoryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Cluster Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleManualRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading && requestCounter === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, bgcolor: "#ffebee" }}>
            <Typography color="error">Error: {error}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Clustering may not be enabled.
            </Typography>
          </Paper>
        ) : clusterInfo ? (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Current Worker
                    </Typography>
                    <Typography variant="h5" component="div">
                      <ComputerIcon
                        sx={{
                          mr: 1,
                          verticalAlign: "middle",
                          color: "primary.main",
                        }}
                      />
                      Worker #{clusterInfo.currentWorker}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      sx={{ mt: 1, fontSize: "0.875rem" }}
                    >
                      This request was handled by Worker #
                      {clusterInfo.currentWorker}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      CPU Cores
                    </Typography>
                    <Typography variant="h5" component="div">
                      <MemoryIcon
                        sx={{
                          mr: 1,
                          verticalAlign: "middle",
                          color: "success.main",
                        }}
                      />
                      {clusterInfo.clusterInfo.totalCPUs} Cores
                    </Typography>
                    <Typography
                      color="textSecondary"
                      sx={{ mt: 1, fontSize: "0.875rem" }}
                    >
                      {clusterInfo.clusterInfo.activeWorkers} active workers (1
                      per core)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Last Update
                    </Typography>
                    <Typography variant="h5" component="div">
                      <AccessTimeIcon
                        sx={{
                          mr: 1,
                          verticalAlign: "middle",
                          color: "info.main",
                        }}
                      />
                      {formatTime(clusterInfo.timestamp).split(" ")[1]}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      sx={{ mt: 1, fontSize: "0.875rem" }}
                    >
                      {formatTime(clusterInfo.timestamp).split(" ")[0]}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper sx={{ mb: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Worker ID</TableCell>
                      <TableCell>Process ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>Requests Handled</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clusterInfo.clusterInfo.workers.map((worker) => (
                      <TableRow
                        key={worker.id}
                        sx={{
                          bgcolor:
                            worker.id.toString() === clusterInfo.currentWorker
                              ? "rgba(33, 150, 243, 0.08)"
                              : "inherit",
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <ComputerIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                            Worker #{worker.id}
                            {worker.id.toString() ===
                              clusterInfo.currentWorker && (
                              <Chip
                                label="Current"
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{worker.pid}</TableCell>
                        <TableCell>
                          <Chip
                            label={worker.status}
                            color={
                              worker.status === "online" ? "success" : "warning"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatTime(worker.startTime)}</TableCell>
                        <TableCell>{worker.requestsHandled}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, color: "primary.main" }}>
                Distributed Systems / Computing Implementation
              </Typography>
              <Typography variant="h6">
                Node.js Clustering & Load Balancing Architecture
              </Typography>
              <Typography paragraph>
                This dashboard demonstrates the implementation of distributed
                systems concepts through Node.js clustering, which creates a
                scalable web application capable of utilizing multiple CPU
                cores.
              </Typography>
              <Typography paragraph>
                <strong>Technical Implementation:</strong> When NutriByte starts
                with clustering enabled (ENABLE_CLUSTERING=true in Heroku config
                variables), a primary process spawns worker processes (one per
                CPU core). The primary process distributes incoming HTTP
                requests among these workers in a round-robin fashion,
                implementing load balancing.
              </Typography>
              <Typography paragraph>
                <strong>Real-time Demonstration:</strong> Each HTTP request to
                the application is handled by a different worker, distributing
                the load. This dashboard visualizes the cluster state in
                real-time, showing which worker handled the current request
                alongside statistics on all active workers.
              </Typography>
              <Typography paragraph>
                <strong>Validation:</strong> Refresh this page multiple times to
                observe different workers handling subsequent requests. This
                demonstrates both the load balancing algorithm in action and the
                inter-process communication (IPC) mechanisms implemented to
                share state across the distributed worker processes.
              </Typography>
            </Paper>
          </>
        ) : (
          <Typography>No data available</Typography>
        )}
      </Box>
    </Layout>
  );
}

export default ClusterDashboard;
