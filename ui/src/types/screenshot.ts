import { PipeSegment } from './pipeData'

export interface ScreenshotData {
  id: string
  timestamp: string
  robotId: number
  position: [number, number]
  water: number
  light: number
  image: string // base64 PNG
  segmentData?: PipeSegment // Optional, for compatibility
}

export interface ScreenshotPayload {
  robotId: number
  image: string // base64 PNG
  segmentData: PipeSegment
  position: [number, number]
}

