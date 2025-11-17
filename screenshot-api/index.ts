import express from "express";

const server: express.Express = express();

// CORS middleware to allow requests from frontend (must come before body parser)
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// JSON body parser must come before routes
server.use(express.json({ limit: "50mb" })); // Large limit for base64 images

// Debug middleware to log request details
server.use((req, res, next) => {
  if (req.path === "/api/screenshots" && req.method === "POST") {
    console.log(`[Server] POST /api/screenshots - Content-Type: ${req.get("Content-Type")}`);
    console.log(`[Server] Request body type: ${typeof req.body}`);
    console.log(`[Server] Request body is array: ${Array.isArray(req.body)}`);
  }
  next();
});

// API routes
server.post("/api/screenshots", async (req, res) => {
  try {
    let edge = await import("./screenshots");
    edge.saveScreenshot(req, res);
  } catch (error) {
    console.error("[Server] Error loading screenshots module:", error);
    res.status(500).json({ 
      error: "Failed to load screenshots module", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

server.get("/api/screenshots", async (req, res) => {
  try {
    let edge = await import("./screenshots");
    edge.getScreenshots(req, res);
  } catch (error) {
    console.error("[Server] Error loading screenshots module:", error);
    res.status(500).json({ 
      error: "Failed to load screenshots module", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

server.listen(3001, () => {
  console.log("=".repeat(60));
  console.log("Screenshot API Server Ready on http://localhost:3001");
  console.log("=".repeat(60));
  console.log("Available API endpoints:");
  console.log("  POST /api/screenshots - Save screenshot");
  console.log("  GET  /api/screenshots - Get all screenshots");
  console.log("=".repeat(60));
  console.log("Screenshot database file: screenshot-api/screenshots.json");
  console.log("=".repeat(60));
});

