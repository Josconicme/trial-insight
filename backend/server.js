// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/database');
const trialRoutes = require('./api/routes/trialRoutes');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000' // Allow requests from your React app
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/trials', trialRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'TrialInsight API is running!',
        status: 'OK',
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const startServer = async () => {
    const isDbConnected = await connectDatabase();
    if (isDbConnected) {
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
            console.log(`Access the API at http://localhost:${PORT}`);
        });
    } else {
        console.error('FATAL: Database connection failed. Server will not start.');
        process.exit(1);
    }
};

startServer();