const express = require('express');
const router = express.Router();
const { getDB } = require('../services/database');

router.get('/', async (req, res) => {
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

        // Get all misinformation items, sorted by most recent first
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

        // Get total stats
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
            details: error.message, // Exposed for debugging
            items: [],
        });
    }
});

module.exports = router;
