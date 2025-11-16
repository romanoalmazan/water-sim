import { PipeSegment } from '../types/pipeData'

// Test data: 3 original data points replicated 1000 times
const baseData: PipeSegment[][] = [
  [
    { Position: [0.8371000029146671, 0], SegmentID: 0, Water: 0.5, Light: 0.17425237672683574, Status: "OK" },
    { Position: [1.2914898029888275, 1.5276598686592184], SegmentID: 1, Water: 0.75, Light: 0.735999212181522, Status: "LOWLIGHT" },
    { Position: [1.25, 1.2410034769701834], SegmentID: 2, Water: 0.75, Light: 0.8515383979579941, Status: "OK" }
  ],
  [
    { Position: [0.8122666664421558, 0], SegmentID: 0, Water: 0.5, Light: 0.18983751261578805, Status: "OK" },
    { Position: [1.2708272180674838, 1.5138848120449893], SegmentID: 1, Water: 0.75, Light: 0.761986604208926, Status: "LOWLIGHT" },
    { Position: [1.25, 1.2658368134426947], SegmentID: 2, Water: 0.75, Light: 0.8427548852890338, Status: "OK" }
  ],
  [
    { Position: [0.8028833344578743, 0], SegmentID: 0, Water: 0.5, Light: 0.19610149830453527, Status: "OK" },
    { Position: [1.2630198139280928, 1.5086798759520619], SegmentID: 1, Water: 0.75, Light: 0.7716672338517682, Status: "LOWLIGHT" },
    { Position: [1.25, 1.2752201454269763], SegmentID: 2, Water: 0.75, Light: 0.8393998236628457, Status: "OK" }
  ]
]

// Replicate the 3 data points 1000 times
export const mockData: PipeSegment[][] = []
for (let i = 0; i < 1000; i++) {
  mockData.push(...baseData)
}

