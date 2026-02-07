// Vercel Serverless Function for /api/dashboard
const mongoose = require('mongoose');

let cachedDb = null;

async function connectDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    const MONGO_URI = process.env.MONGO_URI;
    const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'hermes_ai';

    await mongoose.connect(MONGO_URI, {
        dbName: MONGO_DB_NAME,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    cachedDb = mongoose.connection;
    return cachedDb;
}

const misinformationSchema = new mongoose.Schema({
    text: String,
    is_misinformation: Boolean,
    verdict: String,
    confidence: Number,
    category: String,
    explanation: String,
    timestamp: Date,
    upvotes: Number,
    clusterId: String,
    isClusterHead: Boolean,
    messageTemplate: String,
    variations: Number,
});

const Misinformation = mongoose.models.Misinformation || mongoose.model('Misinformation', misinformationSchema);

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDatabase();

        const category = req.query.category;
        const query = category && category !== 'all' ? { category } : {};

        const allItems = await Misinformation.find(query)
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        const stats = await Misinformation.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalUpvotes: { $sum: '$upvotes' },
                },
            },
        ]);

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
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
};
