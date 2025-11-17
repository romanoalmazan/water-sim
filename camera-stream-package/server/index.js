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

    console.log('Received screenshot request:', {
      hasRobotId: !!robotId,
      hasImage: !!image,
      imageLength: image?.length,
      hasSegmentData: !!segmentData,
      segmentDataKeys: segmentData ? Object.keys(segmentData) : null
    })

    // Check for missing fields (robotId can be 0, so check explicitly)
    if ((robotId === undefined || robotId === null) || !image || !segmentData) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: {
          robotId: robotId,
          hasRobotId: robotId !== undefined && robotId !== null,
          hasImage: !!image,
          imageLength: image?.length,
          hasSegmentData: !!segmentData,
          segmentDataType: typeof segmentData
        }
      })
    }

    // Validate segmentData structure
    if (!segmentData.SegmentID && segmentData.SegmentID !== 0) {
      return res.status(400).json({ error: 'Invalid segmentData: missing SegmentID' })
    }

    // Validate image is base64
    if (typeof image !== 'string' || image.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid image: must be a non-empty string',
        imageType: typeof image,
        imageLength: image?.length
      })
    }
    
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ 
        error: 'Invalid image format: must be base64 data URL',
        imagePrefix: image.substring(0, 50)
      })
    }

    // Read existing screenshots
    let screenshots = []
    if (fs.existsSync(screenshotsPath)) {
      try {
        const fileContent = fs.readFileSync(screenshotsPath, 'utf8')
        screenshots = JSON.parse(fileContent)
        if (!Array.isArray(screenshots)) {
          console.warn('screenshots.json is not an array, resetting to empty array')
          screenshots = []
        }
      } catch (parseError) {
        console.error('Error parsing screenshots.json:', parseError)
        // If file is corrupted, reset it
        screenshots = []
      }
    }

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

    console.log('Screenshot saved successfully:', newScreenshot.id)
    res.json({ success: true, id: newScreenshot.id })
  } catch (error) {
    console.error('Error saving screenshot:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to save screenshot',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// GET endpoint to retrieve screenshots
app.get('/api/screenshots', (req, res) => {
  try {
    if (!fs.existsSync(screenshotsPath)) {
      return res.json([])
    }
    
    const fileContent = fs.readFileSync(screenshotsPath, 'utf8')
    const screenshots = JSON.parse(fileContent)
    
    if (!Array.isArray(screenshots)) {
      console.warn('screenshots.json is not an array, returning empty array')
      return res.json([])
    }
    
    res.json(screenshots)
  } catch (error) {
    console.error('Error reading screenshots:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to read screenshots',
      message: error.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`Screenshot server running on http://localhost:${PORT}`)
})

