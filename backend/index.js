require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./services/database');

const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // max 100 requests per IP per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api', globalLimiter);

// Specific rate limit for verification endpoint
const verifyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // max 20 verifications per minute
    message: { error: 'Too many verification requests, please slow down' },
});

// Connect to MongoDB
connectDB().catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Continuing without database...');
});

// API Routes
app.use('/api/verify', verifyLimiter, require('./routes/verify'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upvote', require('./routes/upvote'));
app.use('/api/trending', require('./routes/trending'));
app.use('/api/export', require('./routes/export'));

// Serve static files from frontend build (for Render deployment)
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'GrandWarden API',
        version: '1.0.0',
    });
});

// Fallback to frontend for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server (only for local development)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`\n🚀 GrandWarden Backend running on port ${PORT}`);
        console.log(`📡 Health check: http://localhost:${PORT}/health`);
        console.log(`🌐 CORS enabled for: ${corsOrigin}\n`);
    });
}

// Export for Vercel
module.exports = app;
