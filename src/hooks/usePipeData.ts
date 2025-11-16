import { useState, useEffect, useRef } from 'react'
import { PipeSegment } from '../types/pipeData'
import { mockData } from '../data/mockData'

// Hook into rolling dataset - simulates backend polling
export const usePipeData = () => {
  const data = useRef(mockData)
  const [currentDataIndex, setCurrentDataIndex] = useState(0)

  // Cycle through test data every 1 second to simulate backend polling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDataIndex((prev) => (prev + 1) % data.current.length)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const currentSegments: PipeSegment[] = data.current[currentDataIndex] || []

  return currentSegments
}

