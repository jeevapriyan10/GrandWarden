const express = require('express');
const router = express.Router();
const { getDB } = require('../services/database');
const { analyzeText, validateContent } = require('../services/aiService');

// Helper function for content rejection messages
function getContentRejectionMessage(contentType) {
    const messages = {
        personal_attack: 'This appears to be a personal attack. Our platform is designed for fact-checking news and public information, not personal disputes.',
        hate_speech: 'Hate speech is not allowed on this platform. Please refrain from posting content that targets individuals or groups.',
        threat: 'This content contains threats or harassment. Such content violates our terms and may be reported to authorities.',
        spam: 'This appears to be spam or repetitive content. Please submit genuine news or informational content for verification.',
        promotional: 'Promotional content is not suitable for fact-checking. This platform is for verifying news and factual claims.',
        private: 'This appears to be private conversation content. Please only submit public news or informational statements.',
        cyberbullying: 'Cyberbullying content is strictly prohibited. This platform is for fact-checking news, not personal attacks.',
        unknown: 'This content doesn\'t appear to be news or factual information suitable for fact-checking.'
    };
    return messages[contentType] || messages.unknown;
}


router.post('/', async (req, res) => {
    try {
        const { text } = req.body;

        // Validate input
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required and must be a string' });
        }

        if (text.trim().length === 0) {
            return res.status(400).json({ error: 'Text cannot be empty' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text is too long (max 5000 characters)' });
        }

        // Validate content type (reject non-news content)
        const validation = await validateContent(text.trim());

        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Content not suitable for fact-checking',
                reason: validation.rejectionReason,
                contentType: validation.contentType,
                message: getContentRejectionMessage(validation.contentType)
            });
        }

        // Analyze with AI
        const aiResult = await analyzeText(text.trim());

        // Store in database if misinformation detected
        const db = getDB();
        let insertedId = null;

        if (db && aiResult.is_misinformation) {
            try {
                const insertResult = await db.collection('misinformation').insertOne({
                    text: text.trim(),
                    category: aiResult.category,
                    confidence: aiResult.confidence,
                    explanation: aiResult.explanation,
                    timestamp: new Date(),
                    upvotes: 0,
                    clusterId: null,
                    isClusterHead: false,
                    messageTemplate: null,
                    variations: 0
                });

                insertedId = insertResult.insertedId;

                // Check for similar messages and create/update cluster
                try {
                    const { findSimilarMessages, updateMessageCluster } = require('../services/similarityService');
                    const similarMessages = await findSimilarMessages(text.trim());

                    if (similarMessages.length > 0) {
                        await updateMessageCluster(insertedId, similarMessages);
                    }
                } catch (similarityError) {
                    console.error('⚠️  Similarity check failed:', similarityError.message);
                }

            } catch (dbError) {
                console.error('❌ Database error:', dbError.message);
                // Continue even if DB insert fails
            }
        } else if (!db && aiResult.is_misinformation) {
            console.warn('⚠️  Database unavailable - misinformation result not stored');
        }

        // Return result
        res.json({
            verdict: aiResult.is_misinformation ? 'misinformation' : 'reliable',
            is_misinformation: aiResult.is_misinformation,
            confidence: aiResult.confidence,
            category: aiResult.category,
            explanation: aiResult.explanation,
            analyzed_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Verification error:', error.message);
        res.status(500).json({
            error: 'Failed to verify text. Please try again.',
            details: error.message,
        });
    }
});

module.exports = router;
