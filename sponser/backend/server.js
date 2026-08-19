require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api.routes');

const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3005;

// Serve compiled dist if built, fallback to raw frontend with JS MIME fix
const sponserDistPath = path.join(__dirname, '../frontend/dist');
const sponserFrontendPath = fs.existsSync(sponserDistPath) ? sponserDistPath : path.join(__dirname, '../frontend');

app.use(express.static(sponserFrontendPath, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

// Middleware
app.use(cors()); // Allow all origins for dev simplicity

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`📢 [REQUEST] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', apiRoutes);
const voiceRoutes = require('./routes/voice.routes');
app.use('/api/voice', voiceRoutes);
app.use('/api', voiceRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Sponsor Backend API is running' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Sponsor Backend Server running on port ${PORT}`);

    // Start auto-repair service
    require('./services/auto-repair');
});

