import { PipeSegment } from './pipeData'

export interface ScreenshotData {
  id: string
  timestamp: string
  robotId: number
  image: string // base64 PNG
  segmentData: PipeSegment
}

export interface ScreenshotPayload {
  robotId: number
  image: string // base64 PNG
  segmentData: PipeSegment
}

