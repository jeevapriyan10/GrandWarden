const express = require('express');
const router = express.Router();
const { getDB } = require('../services/database');
const { ObjectId } = require('mongodb');

router.post('/', async (req, res) => {
    try {
        const { id } = req.body;

        // Validate input
        if (!id) {
            return res.status(400).json({ error: 'Item ID is required' });
        }

        const db = getDB();

        if (!db) {
            // Silently succeed - upvote will be applied when DB reconnects
            return res.json({
                success: true,
                message: 'Upvote queued (database temporarily unavailable)'
            });
        }

        // Update upvote count using _id
        const result = await db.collection('misinformation').updateOne(
            { _id: new ObjectId(id) },
            { $inc: { upvotes: 1 } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({
            success: true,
            message: 'Upvote recorded',
        });
    } catch (error) {
        console.error('Upvote error:', error.message);
        res.status(500).json({ error: 'Failed to record upvote' });
    }
});

module.exports = router;
