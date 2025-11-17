import { PipeSegment as PipeSegmentType } from '../types/pipeData'

// Convert light intensity to color gradient
// Light values range from ~0 to >1.0 (can exceed 1.0)
// Higher light = cleaner (lighter blue), lower light = dirtier (brown)
// Applied as an overlay/mix with base water blue
const lightToColor = (light: number): string => {
  // Convert light to 0-255 scale (matching display format)
  const light255 = light * 255
  
  // Normalize to 0-1 range for color calculation
  // Use a reasonable max (e.g., 300) to handle values >255
  const maxLight = 300 // Accommodate values like 270/255
  const normalizedLight = Math.max(0, Math.min(maxLight, light255)) / maxLight
  
  // Base water blue (clean water)
  const baseR = 74
  const baseG = 158
  const baseB = 255
  
  // Dirty brown (low light = dirty water)
  const dirtyR = 139
  const dirtyG = 69
  const dirtyB = 19
  
  // Mix: high light = more blue (clean), low light = more brown (dirty)
  // Invert so low light values show as dirty
  const dirtyMix = 1 - normalizedLight
  
  const r = Math.round(baseR + dirtyMix * (dirtyR - baseR))
  const g = Math.round(baseG + dirtyMix * (dirtyG - baseG))
  const b = Math.round(baseB + dirtyMix * (dirtyB - baseB))
  
  return `rgb(${r}, ${g}, ${b})`
}

interface PipeSegmentProps {
  segment: PipeSegmentType
  waveOffset: number
}

// Individual pipe segment component - round pipe with concrete walls
export const PipeSegment = ({ segment, waveOffset }: PipeSegmentProps) => {
  const pipeDiameter = 300
  const pipeThickness = 20 // Concrete wall thickness
  const innerDiameter = pipeDiameter - (pipeThickness * 2)
  const centerX = pipeDiameter / 2
  const centerY = pipeDiameter / 2
  const radius = innerDiameter / 2
  
  // Calculate water level from bottom
  // Water value represents fill ratio: 0.5 = 50%, 0.0 = 0%, 0.188 = 18.8%
  // Water is already in 0-1 range where 1.0 = 100% filled
  const waterFillRatio = segment.Water // 0.5 = 50% fill, 0.0 = 0% fill, 1.0 = 100% fill
  const waterHeightFromBottom = waterFillRatio * innerDiameter // Direct mapping: 0-1 ratio to 0-innerDiameter height
  const waterYPosition = centerY + radius - waterHeightFromBottom
  
  // Calculate chord width at water level for circular pipe
  const distanceFromCenter = Math.abs(waterYPosition - centerY)
  const halfChordWidth = Math.sqrt(Math.max(0, radius * radius - distanceFromCenter * distanceFromCenter))
  
  // Generate animated sin wave path for water level interface (thick squiggly line)
  const generateWavePath = (): string => {
    const amplitude = 3
    const frequency = 0.03
    const points: string[] = []
    const startX = centerX - halfChordWidth
    const width = halfChordWidth * 2
    
    for (let x = 0; x <= width; x += 1.5) {
      const xPos = startX + x
      const y = waterYPosition + Math.sin((x * frequency) + waveOffset) * amplitude
      points.push(`${xPos},${y}`)
    }
    
    return `M ${points.join(' L ')}`
  }

  return (
    <div style={{ position: 'relative', width: pipeDiameter, height: pipeDiameter, margin: '20px' }}>
      <svg width={pipeDiameter} height={pipeDiameter} style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="concreteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5a0" />
            <stop offset="50%" stopColor="#9d8b7a" />
            <stop offset="100%" stopColor="#7a6b5e" />
          </linearGradient>
          
          {/* Mask to show water area only below waterline within circle */}
          <mask id={`waterMask-${segment.SegmentID}`}>
            <rect x="0" y="0" width={pipeDiameter} height={pipeDiameter} fill="black" />
            <circle cx={centerX} cy={centerY} r={radius} fill="white" />
            <rect 
              x={centerX - radius} 
              y="0" 
              width={radius * 2} 
              height={waterYPosition} 
              fill="black" 
            />
          </mask>
        </defs>
        
        {/* Outer concrete pipe wall */}
        <circle
          cx={centerX}
          cy={centerY}
          r={pipeDiameter / 2}
          fill="url(#concreteGradient)"
          stroke="#6b5d4f"
          strokeWidth="2"
        />
        
        {/* Inner circle - light grey background */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="#d3d3d3"
        />
        
        {/* Water area with light intensity tint - masked to only show below waterline */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill={lightToColor(segment.Light)}
          mask={`url(#waterMask-${segment.SegmentID})`}
        />
        
        {/* Animated water level sin wave line - fat interface line */}
        <path
          d={generateWavePath()}
          fill="none"
          stroke="#4a9eff"
          strokeWidth="4"
        />
      </svg>
      
    </div>
  )
}

