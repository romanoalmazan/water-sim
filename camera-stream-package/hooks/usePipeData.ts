import { useState, useEffect } from 'react'
import { PipeSegment } from '../types/pipeData'

/**
 * Hook for fetching pipe data
 * 
 * NOTE: This currently uses mock data. You need to adapt this to use your existing API.
 * 
 * Example adaptation:
 * 
 * import { fetchCameraData } from '../services/api' // Your existing API
 * 
 * export const usePipeData = () => {
 *   const [segments, setSegments] = useState<PipeSegment[]>([])
 * 
 *   useEffect(() => {
 *     const loadData = async () => {
 *       const cameras = await fetchCameraData()
 *       // Convert Camera[] to PipeSegment[]
 *       const pipeSegments: PipeSegment[] = cameras.map(cam => ({
 *         SegmentID: cam.SegmentID,
 *         Water: cam.Water,
 *         Light: cam.Light
 *       }))
 *       setSegments(pipeSegments)
 *     }
 * 
 *     loadData()
 *     const interval = setInterval(loadData, 1000) // Poll every second
 *     return () => clearInterval(interval)
 *   }, [])
 * 
 *   return segments
 * }
 */

// Mock data for development/testing
const mockData: PipeSegment[][] = [
  [
    { SegmentID: 0, Water: 0.5, Light: 0.174 },
    { SegmentID: 1, Water: 0.75, Light: 0.736 },
    { SegmentID: 2, Water: 0.75, Light: 0.852 }
  ],
  [
    { SegmentID: 0, Water: 0.5, Light: 0.190 },
    { SegmentID: 1, Water: 0.75, Light: 0.762 },
    { SegmentID: 2, Water: 0.75, Light: 0.843 }
  ],
  [
    { SegmentID: 0, Water: 0.5, Light: 0.196 },
    { SegmentID: 1, Water: 0.75, Light: 0.772 },
    { SegmentID: 2, Water: 0.75, Light: 0.839 }
  ]
]

// Hook into rolling dataset - simulates backend polling
export const usePipeData = () => {
  const [currentDataIndex, setCurrentDataIndex] = useState(0)

  // Cycle through test data every 1 second to simulate backend polling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDataIndex((prev) => (prev + 1) % mockData.length)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const currentSegments: PipeSegment[] = mockData[currentDataIndex] || []

  return currentSegments
}

