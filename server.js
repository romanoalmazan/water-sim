const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true
}));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Route for the main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Sewer Camera Frontend Server is running',
        timestamp: new Date().toISOString(),
        backend_url: 'http://localhost:3000/api/json'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚰 Sewer Camera Frontend Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
    console.log(`🔗 Backend API should be running at: http://localhost:3000/api/json`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Frontend server shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Frontend server shutting down...');
    process.exit(0);
});