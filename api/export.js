// Vercel Serverless Function for /api/export
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
    clusterId: String,
    variations: Number,
});

const Misinformation = mongoose.models.Misinformation || mongoose.model('Misinformation', misinformationSchema);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDatabase();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trending = await Misinformation.find({ timestamp: { $gte: sevenDaysAgo } })
            .sort({ upvotes: -1 })
            .limit(5)
            .lean();

        const recent = await Misinformation.find({})
            .sort({ timestamp: -1 })
            .limit(25)
            .lean();

        const combined = [...trending, ...recent];
        const unique = Array.from(new Map(combined.map(item => [item._id.toString(), item])).values());

        const csv = [
            'ID,Timestamp,Category,Content,Verdict,Confidence,Explanation,Upvotes,Cluster ID,Variations,Type',
            ...unique.map((item, idx) => {
                const type = idx < 5 ? 'Trending' : 'Recent';
                return [
                    item._id,
                    new Date(item.timestamp).toISOString(),
                    item.category || 'general',
                    `"${(item.text || '').replace(/"/g, '""')}"`,
                    item.verdict || 'unknown',
                    Math.round((item.confidence || 0) * 100),
                    `"${(item.explanation || '').replace(/"/g, '""')}"`,
                    item.upvotes || 0,
                    item.clusterId || '',
                    item.variations || 0,
                    type,
                ].join(',');
            }),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=hermes-report-${Date.now()}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export' });
    }
};
