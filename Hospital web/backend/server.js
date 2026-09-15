const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthpulse';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to Real MongoDB Daemon on ' + MONGODB_URI))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        if (process.env.REAL_DATABASE_REQUIRED === 'true') {
            console.error('CRITICAL: REAL_DATABASE_REQUIRED=true and MongoDB connection failed!');
        }
    });


const authRoutes = require('./routes/auth');
const pollutionRoutes = require('./routes/pollution');
const weatherRoutes = require('./routes/weather');
const newsRoutes = require('./routes/news');
const festivalRoutes = require('./routes/festivals');
const triageRoutes = require('./routes/triage');
const ehrRoutes = require('./routes/ehr');
const chatRoutes = require('./routes/chat');
const integrationRoutes = require('./routes/integration');

const app = express();

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3001',
    'https://healthpluse-ai.netlify.app' // New Production URL
].filter(Boolean);

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (like mobile apps or local scripts)
        if (!origin) return cb(null, true);

        // Check if origin is in whitelist or is a netlify subdomain
        const isNetlify = origin.endsWith('.netlify.app');
        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isInWhitelist = allowedOrigins.includes(origin);

        if (isInWhitelist || isNetlify || isLocal) {
            return cb(null, true);
        }

        console.warn(`[CORS REJECTED]: ${origin}`);
        return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Serve Static Uploads (PDFs, etc)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: 'ok',
        database: isDbConnected ? 'healthy' : 'disconnected',
        database_engine: isDbConnected ? 'MongoDB 7.0 (real)' : 'none',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Readiness Check
app.get('/ready', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    const ready = isDbConnected || process.env.REAL_DATABASE_REQUIRED !== 'true';
    res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'not_ready',
        checks: {
            database: isDbConnected ? 'ok' : 'error'
        },
        database_engine: isDbConnected ? 'MongoDB 7.0 (real)' : 'in-memory (fallback)',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pollution', pollutionRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/festivals', festivalRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/ehr', ehrRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/integration', integrationRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   Bharat PulseLink Hospital Backend Server      ║
╠══════════════════════════════════════╣
║  Status: RUNNING                     ║
║  Port: ${PORT}                          ║
║  Environment: ${process.env.NODE_ENV || 'development'}           ║
║  CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'} ║
╚══════════════════════════════════════╝
  `);
});

module.exports = app;

/* updated */
