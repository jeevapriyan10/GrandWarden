const express = require('express');
const router = express.Router();
const { getDB } = require('../services/database');

router.get('/', async (req, res) => {
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

        // Calculate time threshold based on period
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

        // Build query
        const query = { timestamp: { $gte: timeThreshold } };

        // Build sort
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

        // Get trending items
        const items = await db.collection('misinformation')
            .find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .toArray();

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

module.exports = router;
