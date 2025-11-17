import { useState, useEffect } from 'react'
import { PipeSegment } from '../types/pipeData'
import { fetchCameraData } from '../services/api'
import type { Camera } from '../types/camera'

/**
 * Hook for fetching pipe data from static JSON file
 * Converts Camera[] to PipeSegment[] format and polls every second
 */
export const usePipeData = (): PipeSegment[] => {
  const [segments, setSegments] = useState<PipeSegment[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const cameras = await fetchCameraData()
        // Convert Camera[] to PipeSegment[]
        const pipeSegments: PipeSegment[] = cameras.map((cam: Camera) => ({
          SegmentID: cam.SegmentID,
          Water: cam.Water,
          Light: cam.Light
        }))
        setSegments(pipeSegments)
      } catch (error) {
        console.error('Error fetching pipe data:', error)
        // Keep existing segments on error
      }
    }

    // Load data immediately
    loadData()
    
    // Poll every second to match map update frequency
    const interval = setInterval(loadData, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return segments
}

