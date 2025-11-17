import * as fs from "fs";
import * as path from "path";

// Determine the correct path for screenshots.json
// Always use the screenshot-api directory where the server runs
function getScreenshotsFilePath(): string {
  const cwd = process.cwd();
  
  // Check if we're already in screenshot-api directory
  let baseDir: string;
  if (cwd.endsWith("screenshot-api") || path.basename(cwd) === "screenshot-api") {
    baseDir = cwd;
  } else {
    // Assume we're in workspace root, so use screenshot-api subdirectory
    baseDir = path.join(cwd, "screenshot-api");
  }
  
  const screenshotsPath = path.join(baseDir, "screenshots.json");
  
  // Ensure the directory exists
  const dir = path.dirname(screenshotsPath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Screenshots] Created directory: ${dir}`);
    } catch (error) {
      console.error(`[Screenshots] Failed to create directory ${dir}:`, error);
      throw error;
    }
  }
  
  console.log(`[Screenshots] Screenshot database file: ${screenshotsPath}`);
  return screenshotsPath;
}

const SCREENSHOTS_FILE = getScreenshotsFilePath();

interface ScreenshotData {
  id: string;
  timestamp: string;
  robotId: number;
  position: [number, number];
  water: number;
  light: number;
  image: string; // base64 PNG
}

// Initialize screenshots file if it doesn't exist
function ensureScreenshotsFile(): void {
  if (!fs.existsSync(SCREENSHOTS_FILE)) {
    fs.writeFileSync(SCREENSHOTS_FILE, JSON.stringify([], null, 2));
  }
}

export function saveScreenshot(req: any, res: any): void {
  try {
    console.log(`[Screenshots] Received save request`);
    console.log(`[Screenshots] Request body keys:`, Object.keys(req.body || {}));
    console.log(`[Screenshots] Full request body:`, JSON.stringify(req.body, null, 2).substring(0, 500)); // Log first 500 chars
    ensureScreenshotsFile();
    
    const { robotId, image, segmentData, position } = req.body || {};

    // More detailed validation
    const missingFields: string[] = [];
    if (robotId === undefined || robotId === null) missingFields.push('robotId');
    if (image === undefined || image === null) missingFields.push('image');
    if (!segmentData) missingFields.push('segmentData');
    if (!position || !Array.isArray(position) || position.length !== 2) missingFields.push('position (must be [x, y] array)');

    if (missingFields.length > 0) {
      console.error("[Screenshots] Missing required fields:", missingFields);
      console.error("[Screenshots] Received data:", {
        robotId: robotId !== undefined ? robotId : 'MISSING',
        hasImage: image !== undefined,
        hasSegmentData: !!segmentData,
        segmentDataKeys: segmentData ? Object.keys(segmentData) : 'N/A',
        hasPosition: !!position,
        positionType: position ? typeof position : 'N/A',
        positionValue: position
      });
      res.status(400).json({ 
        error: "Missing required fields",
        missingFields: missingFields,
        received: {
          robotId: robotId !== undefined,
          image: image !== undefined,
          segmentData: !!segmentData,
          position: !!position
        }
      });
      return;
    }

    console.log(`[Screenshots] Reading existing screenshots from: ${SCREENSHOTS_FILE}`);
    // Read existing screenshots
    const screenshots: ScreenshotData[] = JSON.parse(
      fs.readFileSync(SCREENSHOTS_FILE, "utf8")
    );

    // Create new screenshot entry
    const newScreenshot: ScreenshotData = {
      id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      robotId,
      position,
      water: segmentData.Water,
      light: segmentData.Light,
      image, // base64 PNG
    };

    // Add to array
    screenshots.push(newScreenshot);

    console.log(`[Screenshots] Writing ${screenshots.length} screenshots to: ${SCREENSHOTS_FILE}`);
    // Write back to file
    fs.writeFileSync(SCREENSHOTS_FILE, JSON.stringify(screenshots, null, 2));

    console.log(`[Screenshots] Successfully saved screenshot: ${newScreenshot.id}`);
    res.json({ success: true, id: newScreenshot.id });
  } catch (error) {
    console.error("[Screenshots] Error saving screenshot:", error);
    console.error("[Screenshots] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    res.status(500).json({
      error: "Failed to save screenshot",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export function getScreenshots(req: any, res: any): void {
  try {
    ensureScreenshotsFile();

    const screenshots: ScreenshotData[] = JSON.parse(
      fs.readFileSync(SCREENSHOTS_FILE, "utf8")
    );

    // Sort by timestamp descending (newest first)
    screenshots.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json(screenshots);
  } catch (error) {
    console.error("[Screenshots] Error reading screenshots:", error);
    res.status(500).json({
      error: "Failed to read screenshots",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export function clearAllScreenshots(req: any, res: any): void {
  try {
    console.log(`[Screenshots] Clearing all screenshots - deleting file: ${SCREENSHOTS_FILE}`);
    
    // Delete the screenshots.json file if it exists
    if (fs.existsSync(SCREENSHOTS_FILE)) {
      fs.unlinkSync(SCREENSHOTS_FILE);
      console.log(`[Screenshots] Successfully deleted screenshots file`);
    } else {
      console.log(`[Screenshots] Screenshots file does not exist, nothing to delete`);
    }
    
    res.json({ success: true, message: "All screenshots cleared" });
  } catch (error) {
    console.error("[Screenshots] Error clearing screenshots:", error);
    res.status(500).json({
      error: "Failed to clear screenshots",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

