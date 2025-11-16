class SewerCameraDashboard {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/json';
        this.updateInterval = 1000; // 1 second
        this.cameras = [];
        this.isConnected = false;
        this.canvas = null;
        this.ctx = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.startDataStream();
        this.updateConnectionStatus();
    }

    setupCanvas() {
        this.canvas = document.getElementById('map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawMapBackground();
    }

    drawMapBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#16213e';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y < height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw sewer system representation (based on the map data)
        this.drawSewerSystem();
    }

    drawSewerSystem() {
        const ctx = this.ctx;
        
        // Draw sewer pipes/segments (simplified representation)
        ctx.strokeStyle = '#4a4a6a';
        ctx.lineWidth = 3;
        
        // Segment connections based on the sewer map
        const segments = [
            [[50, 50], [150, 50], [150, 150], [50, 150]],  // Segment 0 path
            [[150, 150], [150, 250], [250, 250], [200, 200]], // Segment 1 path
            [[400, 250], [400, 150], [200, 150]] // Segment 2 path
        ];
        
        segments.forEach((segment, index) => {
            ctx.beginPath();
            ctx.moveTo(segment[0][0], segment[0][1]);
            for (let i = 1; i < segment.length; i++) {
                ctx.lineTo(segment[i][0], segment[i][1]);
            }
            ctx.stroke();
        });
    }

    async fetchCameraData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const jsonString = await response.text();
            // Parse the JSON string that comes wrapped in quotes
            const parsedData = JSON.parse(JSON.parse(jsonString));
            
            this.cameras = parsedData;
            this.isConnected = true;
            this.updateDashboard();
            
        } catch (error) {
            console.error('Error fetching camera data:', error);
            this.isConnected = false;
            this.updateConnectionStatus();
        }
    }

    updateDashboard() {
        this.updateConnectionStatus();
        this.updateSystemStats();
        this.updateCameraCards();
        this.updateMap();
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        statusElement.className = `status-dot ${this.isConnected ? 'online' : 'offline'}`;
    }

    updateSystemStats() {
        document.getElementById('active-cameras').textContent = this.cameras.length;
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    }

    updateCameraCards() {
        const gridContainer = document.getElementById('camera-grid');
        gridContainer.innerHTML = '';
        
        this.cameras.forEach(camera => {
            const card = this.createCameraCard(camera);
            gridContainer.appendChild(card);
        });
    }

    createCameraCard(camera) {
        const card = document.createElement('div');
        card.className = `camera-card status-${camera.Status.toLowerCase()}`;
        
        const waterPercentage = Math.round(camera.Water * 100);
        const lightLevel = Math.round((camera.Light / 1) * 255); // Normalize light level
        
        card.innerHTML = `
            <div class="camera-header">
                <h3>Camera ${camera.SegmentID}</h3>
                <span class="status-badge ${camera.Status.toLowerCase()}">${camera.Status}</span>
            </div>
            
            <div class="camera-data">
                <div class="data-row">
                    <span class="data-label">Position:</span>
                    <span class="data-value">(${camera.Position[0].toFixed(2)}, ${camera.Position[1].toFixed(2)})</span>
                </div>
                
                <div class="data-row">
                    <span class="data-label">Water Level:</span>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${waterPercentage}%"></div>
                        </div>
                        <span class="progress-text">${waterPercentage}%</span>
                    </div>
                </div>
                
                <div class="data-row">
                    <span class="data-label">Light Level:</span>
                    <div class="light-indicator">
                        <div class="light-meter" style="background: linear-gradient(90deg, #333 0%, #fff ${lightLevel/255*100}%)"></div>
                        <span class="light-value">${lightLevel}/255</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    updateMap() {
        // Redraw background
        this.drawMapBackground();
        
        // Draw camera positions
        this.cameras.forEach(camera => {
            this.drawCameraPosition(camera);
        });
    }

    drawCameraPosition(camera) {
        const ctx = this.ctx;
        
        // Convert camera coordinates to canvas coordinates
        const x = camera.Position[0] * 100 + 50;
        const y = camera.Position[1] * 100 + 50;
        
        // Choose color based on status
        let color;
        switch (camera.Status) {
            case 'OK':
                color = '#4CAF50';
                break;
            case 'LOWLIGHT':
                color = '#FFC107';
                break;
            case 'WARNING':
                color = '#F44336';
                break;
            default:
                color = '#9E9E9E';
        }
        
        // Draw camera position
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw camera ID
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(camera.SegmentID.toString(), x, y + 4);
        
        // Draw water level indicator (blue circle)
        if (camera.Water > 0) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 12 + (camera.Water * 10), 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    startDataStream() {
        // Initial fetch
        this.fetchCameraData();
        
        // Set up recurring fetch every second
        setInterval(() => {
            this.fetchCameraData();
        }, this.updateInterval);
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new SewerCameraDashboard();
    
    // Add some interactivity
    window.dashboard = dashboard; // For debugging
    
    // Optional: Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'r' || event.key === 'R') {
            dashboard.fetchCameraData();
        }
    });
});

// Add error handling for unhandled promises
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
});