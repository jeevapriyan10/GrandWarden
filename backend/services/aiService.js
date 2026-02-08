const axios = require('axios');

/**
 * Validate if content is appropriate for fact-checking (news/informational only)
 */
const validateContent = async (text) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.includes('your_gemini')) {
            return { isValid: true, contentType: 'unknown', rejectionReason: null };
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: `You are a content moderator. Classify this text and determine if it's appropriate for fact-checking.

ONLY ALLOW: News, factual claims, public information, historical events, scientific statements, political statements, health information

REJECT: Personal attacks, hate speech, threats, harassment, doxxing, spam, promotional content, private conversations, trash talk, cyberbullying

Respond ONLY with valid JSON:
{"isValid": boolean, "contentType": "news"|"personal_attack"|"hate_speech"|"threat"|"spam"|"promotional"|"private"|"cyberbullying"|"unknown", "rejectionReason": "Brief explanation if rejected, null if valid"}

Text: "${text.replace(/"/g, '\\"')}"`
                    }]
                }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 200 }
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        const content = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                isValid: Boolean(result.isValid),
                contentType: result.contentType || 'unknown',
                rejectionReason: result.rejectionReason || null
            };
        }

        return { isValid: true, contentType: 'unknown', rejectionReason: null };
    } catch (error) {
        console.error('⚠️  Content validation error:', error.message);
        return { isValid: true, contentType: 'unknown', rejectionReason: null };
    }
};

/**
 * Call Gemini API for misinformation detection
 */
const callGeminiAPI = async (text) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.includes('your_gemini')) {
            throw new Error('Gemini API key not configured');
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `You are an expert fact-checker. Analyze the following text for misinformation, false claims, or misleading information.

Respond ONLY with valid JSON in this exact format:
{
  "is_misinformation": boolean,
  "confidence": number between 0 and 1,
  "category": "politics" | "health" | "science" | "climate" | "technology" | "finance" | "entertainment" | "general",
  "explanation": "Brief explanation of your verdict"
}

Text to analyze: "${text.replace(/"/g, '\\"')}"`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500,
                },
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
            }
        );

        const content = response.data.candidates[0].content.parts[0].text;

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);

            // Validate and normalize result
            return {
                is_misinformation: Boolean(result.is_misinformation),
                confidence: Math.min(Math.max(Number(result.confidence) || 0.5, 0), 1),
                category: result.category || 'general',
                explanation: result.explanation || 'Analysis completed',
            };
        }

        throw new Error('Invalid JSON response from Gemini');
    } catch (error) {
        console.error('❌ Gemini API error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Call Grok API for misinformation detection (optional fallback)
 */
const callGrokAPI = async (text) => {
    try {
        const apiKey = process.env.GROK_API_KEY;

        if (!apiKey || apiKey.includes('your_grok')) {
            throw new Error('Grok API key not configured');
        }

        // Placeholder for Grok API integration
        // Update with actual Grok API endpoint when available
        throw new Error('Grok API integration pending');
    } catch (error) {
        console.error('❌ Grok API error:', error.message);
        throw error;
    }
};

/**
 * Analyze text with fallback logic
 */
const analyzeText = async (text) => {
    // Try Gemini first
    try {
        return await callGeminiAPI(text);
    } catch (geminiError) {
        console.log('⚠️  Gemini failed, trying Grok...');

        // Try Grok as fallback
        try {
            return await callGrokAPI(text);
        } catch (grokError) {
            console.error('❌ AI Analysis Failed (Gemini & Grok):', {
                gemini: geminiError?.message,
                grok: grokError?.message
            });

            // Final fallback: return safe default with explanation
            return {
                is_misinformation: false,
                confidence: 0.0,
                category: 'general', // Default category
                explanation: 'AI analysis service is temporarily unavailable (API Key issue or quota exceeded). Please try again later.',
            };
        }
    }
};

module.exports = {
    validateContent,
    callGeminiAPI,
    callGrokAPI,
    analyzeText,
};
