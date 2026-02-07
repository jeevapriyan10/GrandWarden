// Vercel Serverless Function for /api/verify
const mongoose = require('mongoose');
const { validateContent, analyzeMisinformation } = require('../backend/services/aiService');
const { findSimilarMessages, generateTemplate } = require('../backend/services/similarityService');

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

// Misinformation Schema
const misinformationSchema = new mongoose.Schema({
    text: { type: String, required: true },
    is_misinformation: { type: Boolean, default: false },
    verdict: { type: String, enum: ['reliable', 'misinformation'], default: 'reliable' },
    confidence: { type: Number, default: 0 },
    category: { type: String, default: 'general' },
    explanation: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    clusterId: { type: String, default: null },
    isClusterHead: { type: Boolean, default: false },
    messageTemplate: { type: String, default: null },
    variations: { type: Number, default: 0 },
});

const Misinformation = mongoose.models.Misinformation || mongoose.model('Misinformation', misinformationSchema);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDatabase();

        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required and must be a string' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text is too long (max 5000 characters)' });
        }

        // Content validation
        const validation = await validateContent(text);
        if (!validation.isValid) {
            const rejectionMessages = {
                personal_attack: 'This content appears to be a personal attack or insult. We only analyze news and factual claims.',
                hate_speech: 'This content contains hate speech or discriminatory language. We only verify news and public information.',
                threat: 'This content contains threatening language. Please only submit news or factual claims for verification.',
                spam: 'This content appears to be spam or promotional. We focus on verifying news and factual information.',
                promotional: 'This content is promotional. We only fact-check news and informational claims.',
                cyberbullying: 'This content appears to be cyberbullying. We only analyze news and factual claims.',
                private: 'This appears to be private communication. We only verify public news and factual claims.',
            };

            return res.status(400).json({
                error: rejectionMessages[validation.contentType] || validation.reason || 'Content not suitable for fact-checking',
                contentType: validation.contentType,
            });
        }

        // AI Analysis
        const analysis = await analyzeMisinformation(text);

        // Duplicate detection
        const similarMessages = await findSimilarMessages(text);
        let clusterId = null;
        let isClusterHead = false;
        let messageTemplate = null;

        if (similarMessages.length > 0) {
            clusterId = similarMessages[0].clusterId || `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            messageTemplate = await generateTemplate([text, ...similarMessages.map(m => m.text)]);

            await Misinformation.updateMany(
                { _id: { $in: similarMessages.map(m => m._id) } },
                { $set: { clusterId, messageTemplate }, $inc: { variations: 1 } }
            );
        } else {
            clusterId = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            isClusterHead = true;
            messageTemplate = text;
        }

        // Save to database
        const misinformationItem = new Misinformation({
            text,
            is_misinformation: analysis.verdict === 'misinformation',
            verdict: analysis.verdict,
            confidence: analysis.confidence,
            category: analysis.category,
            explanation: analysis.explanation,
            clusterId,
            isClusterHead,
            messageTemplate,
            variations: similarMessages.length,
        });

        await misinformationItem.save();

        return res.status(200).json({
            ...analysis,
            clusterId,
            isClusterHead,
            variations: similarMessages.length,
            timestamp: misinformationItem.timestamp,
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            error: 'Unable to analyze due to API errors. Please try again later.',
            details: error.message,
        });
    }
};
