interface TestMapProps {
  onRobotClick: (robotId: number) => void
}

const TestMap = ({ onRobotClick }: TestMapProps) => {
  return (
    <div
      style={{
        width: '100%',
        height: '40vh',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#1a1a1a'
      }}
    >
      <h2 style={{ color: '#fff', marginBottom: '20px', position: 'absolute', top: '20px' }}>
        Test Map - Click a Robot Dot
      </h2>
      
      {/* Three robot dots */}
      <div style={{ display: 'flex', gap: '50px' }}>
        {[0, 1, 2].map((robotId) => (
          <button
            key={robotId}
            onClick={() => onRobotClick(robotId)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#4a9eff',
              border: '3px solid #fff',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
            }}
          >
            {robotId}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TestMap

