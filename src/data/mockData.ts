import { PipeSegment } from '../types/pipeData'

// Test data: 3 original data points replicated 1000 times
const baseData: PipeSegment[][] = [
  [
    { SegmentID: 0, Water: 0.5, Light: 0.17425237672683574 },
    { SegmentID: 1, Water: 0.75, Light: 0.735999212181522 },
    { SegmentID: 2, Water: 0.75, Light: 0.8515383979579941 }
  ],
  [
    { SegmentID: 0, Water: 0.5, Light: 0.18983751261578805 },
    { SegmentID: 1, Water: 0.75, Light: 0.761986604208926 },
    { SegmentID: 2, Water: 0.75, Light: 0.8427548852890338 }
  ],
  [
    { SegmentID: 0, Water: 0.5, Light: 0.19610149830453527 },
    { SegmentID: 1, Water: 0.75, Light: 0.7716672338517682 },
    { SegmentID: 2, Water: 0.75, Light: 0.8393998236628457 }
  ]
]

// Replicate the 3 data points 1000 times
export const mockData: PipeSegment[][] = []
for (let i = 0; i < 1000; i++) {
  mockData.push(...baseData)
}

