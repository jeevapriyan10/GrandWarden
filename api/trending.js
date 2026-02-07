// Vercel Serverless Function for /api/trending
const mongoose = require('mongoose');

let cachedDb = null;

async function connectDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB_NAME || 'hermes_ai',
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    cachedDb = mongoose.connection;
    return cachedDb;
}

const misinformationSchema = new mongoose.Schema({
    text: String,
    verdict: String,
    confidence: Number,
    category: String,
    explanation: String,
    timestamp: Date,
    upvotes: Number,
    variations: Number,
});

const Misinformation = mongoose.models.Misinformation || mongoose.model('Misinformation', misinformationSchema);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDatabase();

        const period = req.query.period || '7d';
        const sortBy = req.query.sort || 'upvotes';

        const periodMap = {
            '24h': 1,
            '7d': 7,
            '30d': 30,
        };

        const days = periodMap[period] || 7;
        const since = new Date();
        since.setDate(since.getDate() - days);

        let sortCriteria = {};
        if (sortBy === 'upvotes') sortCriteria = { upvotes: -1 };
        else if (sortBy === 'recent') sortCriteria = { timestamp: -1 };
        else if (sortBy === 'confidence') sortCriteria = { confidence: -1 };

        const items = await Misinformation.find({ timestamp: { $gte: since } })
            .sort(sortCriteria)
            .limit(50)
            .lean();

        res.json({
            items,
            period,
            sortBy,
            count: items.length,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Trending error:', error);
        res.status(500).json({ error: 'Failed to load trending' });
    }
};
