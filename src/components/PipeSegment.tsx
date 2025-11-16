import { PipeSegment as PipeSegmentType } from '../types/pipeData'

// Convert light intensity (0-1) to color gradient 
// Higher light = cleaner (lighter blue), lower light = dirtier (brown)
// Applied as an overlay/mix with base water blue
const lightToColor = (light: number): string => {
  const clampedLight = Math.max(0, Math.min(1, light))
  
  // Base water blue
  const baseR = 74
  const baseG = 158
  const baseB = 255
  
  // Dirty brown to mix in
  const dirtyR = 139
  const dirtyG = 69
  const dirtyB = 19
  
  // Mix: high light = more blue (clean), low light = more brown (dirty)
  // Invert so low light values show as dirty
  const dirtyMix = 1 - clampedLight
  
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
  
  // Calculate water level from bottom (0 = empty, 1 = full)
  const waterFillRatio = segment.Water
  const waterHeightFromBottom = waterFillRatio * innerDiameter
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
      
      {/* Segment info overlay */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '14px',
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '5px 10px',
        borderRadius: '4px'
      }}>
        Camera {segment.SegmentID} | Water: {(segment.Water * 100).toFixed(0)}% | Light: {segment.Light.toFixed(2)}
      </div>
    </div>
  )
}

