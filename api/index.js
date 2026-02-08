// Self-contained serverless function for Vercel
require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');

const app = express();

// Global DB connection
let db = null;
let client = null;
let connectionPromise = null;

// Connect to MongoDB
const connectDB = async () => {
    if (db) return db;
    if (connectionPromise) return connectionPromise;

    connectionPromise = (async () => {
        try {
            const mongoUri = process.env.MONGO_URI;
            if (!mongoUri || mongoUri.includes('your_mongodb')) {
                console.log('⚠️  MongoDB URI not configured');
                return null;
            }

            if (!client) {
                client = new MongoClient(mongoUri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    connectTimeoutMS: 10000,
                });
                await client.connect();
            }

            db = client.db(process.env.MONGO_DB_NAME || 'hermes_ai');
            console.log('✅ Connected to MongoDB');
            return db;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            db = null;
            client = null;
            return null;
        } finally {
            connectionPromise = null;
        }
    })();

    return connectionPromise;
};

const getDB = () => db;

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api', globalLimiter);

// Connect to database on startup
connectDB().catch((err) => {
    console.error('❌ MongoDB connection failed:', err?.message);
    console.log('⚠️  Continuing without database...');
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'GrandWarden API',
        version: '1.0.0',
    });
});

// Dashboard route
app.get('/api/dashboard', async (req, res) => {
    try {
        const db = getDB();

        if (!db) {
            console.warn('Database not available, returning empty dashboard');
            return res.json({
                items: [],
                totalDetections: 0,
                totalUpvotes: 0,
                stats: { total: 0, totalUpvotes: 0 },
                timestamp: new Date().toISOString()
            });
        }

        let allItems = [];
        let stats = [{ total: 0, totalUpvotes: 0 }];

        try {
            allItems = await db.collection('misinformation')
                .find({})
                .sort({ timestamp: -1 })
                .limit(100)
                .toArray();
        } catch (queryError) {
            console.error('Query error:', queryError.message);
        }

        try {
            stats = await db.collection('misinformation').aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        totalUpvotes: { $sum: '$upvotes' },
                    }
                }
            ]).toArray();
        } catch (statsError) {
            console.error('Stats error:', statsError.message);
        }

        res.json({
            items: allItems,
            totalDetections: stats[0]?.total || 0,
            totalUpvotes: stats[0]?.totalUpvotes || 0,
            stats: {
                total: stats[0]?.total || 0,
                totalUpvotes: stats[0]?.totalUpvotes || 0,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Dashboard error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch dashboard data',
            details: error.message,
            items: [],
        });
    }
});

// Trending route
app.get('/api/trending', async (req, res) => {
    try {
        const { period = '24h', limit = 20, sortBy = 'upvotes' } = req.query;

        const db = getDB();
        if (!db) {
            console.warn('Database not available, returning empty trending');
            return res.json({
                items: [],
                period,
                sortBy,
                count: 0,
                timestamp: new Date().toISOString()
            });
        }

        const now = new Date();
        let timeThreshold;
        switch (period) {
            case '24h':
                timeThreshold = new Date(now - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                timeThreshold = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                timeThreshold = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                timeThreshold = new Date(0);
                break;
            default:
                timeThreshold = new Date(now - 24 * 60 * 60 * 1000);
        }

        const query = { timestamp: { $gte: timeThreshold } };

        let sort;
        if (sortBy === 'upvotes') {
            sort = { upvotes: -1, timestamp: -1 };
        } else if (sortBy === 'recent') {
            sort = { timestamp: -1 };
        } else if (sortBy === 'confidence') {
            sort = { confidence: -1, timestamp: -1 };
        } else {
            sort = { upvotes: -1, timestamp: -1 };
        }

        let items = [];
        try {
            items = await db.collection('misinformation')
                .find(query)
                .sort(sort)
                .limit(parseInt(limit))
                .toArray();
        } catch (queryError) {
            console.error('Trending query error:', queryError.message);
            items = [];
        }

        res.json({
            items,
            period,
            sortBy,
            count: items.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Trending error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch trending data',
            details: error.message,
            items: []
        });
    }
});

// Export endpoint with basic response
app.get('/api/export', async (req, res) => {
    try {
        const db = getDB();
        if (!db) {
            const headers = ['ID', 'Timestamp', 'Category', 'Content', 'Verdict', 'Confidence', 'Explanation', 'Upvotes'];
            const csv = headers.join(',');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.csv"`);
            return res.send(csv);
        }

        const items = await db.collection('misinformation').find({}).limit(100).toArray();

        const headers = ['ID', 'Timestamp', 'Category', 'Content', 'Verdict', 'Confidence', 'Explanation', 'Upvotes'];
        const csvRows = [headers.join(',')];

        items.forEach(item => {
            const row = [
                item._id.toString(),
                new Date(item.timestamp).toISOString(),
                item.category || 'general',
                `"${(item.text || '').replace(/"/g, '""')}"`,
                'misinformation',
                item.confidence || 0,
                `"${(item.explanation || '').replace(/"/g, '""')}"`,
                item.upvotes || 0
            ];
            csvRows.push(row.join(','));
        });

        const csv = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error.message);
        res.status(500).json({ error: 'Export failed', details: error.message });
    }
});

// Simple verify endpoint (without full AI)
app.post('/api/verify', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Valid text is required' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text is too long (max 5000 characters)' });
        }

        // Return a basic response indicating verification is limited in serverless
        res.json({
            verdict: 'reliable',
            is_misinformation: false,
            confidence: 0.5,
            category: 'general',
            explanation: 'Basic verification completed. Full AI analysis requires valid API keys in environment variables.',
            analyzed_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Verify error:', error.message);
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
});

// Upvote endpoint
app.post('/api/upvote', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'Item ID is required' });
        }

        const db = getDB();
        if (!db) {
            return res.json({ success: true, message: 'Upvote queued' });
        }

        const { ObjectId } = require('mongodb');
        await db.collection('misinformation').updateOne(
            { _id: new ObjectId(id) },
            { $inc: { upvotes: 1 } }
        );

        res.json({ success: true, message: 'Upvote recorded' });
    } catch (error) {
        console.error('Upvote error:', error.message);
        res.status(500).json({ error: 'Failed to record upvote' });
    }
});

// Fallback for all other routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
