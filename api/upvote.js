// Vercel Serverless Function for /api/upvote
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
    upvotes: Number,
});

const Misinformation = mongoose.models.Misinformation || mongoose.model('Misinformation', misinformationSchema);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDatabase();

        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'ID required' });
        }

        const updated = await Misinformation.findByIdAndUpdate(
            id,
            { $inc: { upvotes: 1 } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ success: true, upvotes: updated.upvotes });

    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ error: 'Failed to upvote' });
    }
};
