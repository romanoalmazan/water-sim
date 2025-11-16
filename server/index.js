import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Large limit for base64 images

// Path to screenshots database
const screenshotsPath = path.join(__dirname, 'screenshots.json')

// Initialize screenshots file if it doesn't exist
if (!fs.existsSync(screenshotsPath)) {
  fs.writeFileSync(screenshotsPath, JSON.stringify([], null, 2))
}

// POST endpoint to save screenshots
app.post('/api/screenshots', (req, res) => {
  try {
    const { robotId, image, segmentData } = req.body

    if (!robotId || !image || !segmentData) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Read existing screenshots
    const screenshots = JSON.parse(fs.readFileSync(screenshotsPath, 'utf8'))

    // Create new screenshot entry
    const newScreenshot = {
      id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      robotId,
      image, // base64 PNG
      segmentData
    }

    // Add to array
    screenshots.push(newScreenshot)

    // Write back to file
    fs.writeFileSync(screenshotsPath, JSON.stringify(screenshots, null, 2))

    res.json({ success: true, id: newScreenshot.id })
  } catch (error) {
    console.error('Error saving screenshot:', error)
    res.status(500).json({ error: 'Failed to save screenshot' })
  }
})

// GET endpoint to retrieve screenshots (optional, for testing)
app.get('/api/screenshots', (req, res) => {
  try {
    const screenshots = JSON.parse(fs.readFileSync(screenshotsPath, 'utf8'))
    res.json(screenshots)
  } catch (error) {
    console.error('Error reading screenshots:', error)
    res.status(500).json({ error: 'Failed to read screenshots' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

