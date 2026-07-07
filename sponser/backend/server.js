require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3005;

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

