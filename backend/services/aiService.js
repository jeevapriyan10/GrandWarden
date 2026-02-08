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
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: `You are a content moderator. Classify this text and determine if it's appropriate for fact-checking.

ONLY ALLOW: News, factual claims, public information, historical events, scientific statements, political statements, health information

REJECT: Personal attacks, hate speech, threats, harassment, doxxing, spam, promotional content, private conversations, trash talk, cyberbullying

Respond ONLY with valid JSON:
{"isValid": true, "contentType": "news", "rejectionReason": null}

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

        if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini')) {
            console.error('⚠️  GEMINI_API_KEY is not configured or invalid');
            throw new Error('Gemini API key not configured');
        }

        console.log('✅ Using Gemini API (gemini-1.5-flash)');

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: `You are an expert fact-checker. Analyze this text for misinformation.

Respond ONLY with valid JSON:
{
  "is_misinformation": false,
  "confidence": 0.85,
  "category": "general",
  "explanation": "Your analysis"
}

Text: "${text.replace(/"/g, '\\"')}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500,
                },
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000,
            }
        );

        const content = response.data.candidates[0].content.parts[0].text;

        // Parse JSON from response
        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON in response');
            }
        }

        return {
            is_misinformation: Boolean(result.is_misinformation),
            confidence: Math.min(Math.max(Number(result.confidence) || 0.5, 0), 1),
            category: result.category || 'general',
            explanation: result.explanation || 'Analysis completed',
        };
    } catch (error) {
        console.error('❌ Gemini API error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Call Groq API for misinformation detection
 */
const callGroqAPI = async (text) => {
    try {
        const apiKey = process.env.GROK_API_KEY;

        if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_grok')) {
            throw new Error('Groq API key not configured');
        }

        console.log('✅ Using Groq API (llama-3.3-70b-versatile)');

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert fact-checker. Analyze text for misinformation and respond only with valid JSON in this format: {"is_misinformation": false, "confidence": 0.85, "category": "general", "explanation": "Your analysis"}'
                    },
                    {
                        role: 'user',
                        content: `Analyze this text: "${text.replace(/"/g, '\\"')}"`
                    }
                ],
                temperature: 0.3,
                max_tokens: 500,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 20000,
            }
        );

        const content = response.data.choices[0].message.content;

        // Parse JSON from response
        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON in Groq response');
            }
        }

        return {
            is_misinformation: Boolean(result.is_misinformation),
            confidence: Math.min(Math.max(Number(result.confidence) || 0.5, 0), 1),
            category: result.category || 'general',
            explanation: result.explanation || 'Analysis completed',
        };
    } catch (error) {
        console.error('❌ Groq API error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Analyze text with fallback: Gemini -> Groq -> Fallback message
 */
const analyzeText = async (text) => {
    // Try Gemini first
    try {
        return await callGeminiAPI(text);
    } catch (geminiError) {
        console.log('⚠️  Gemini failed, trying Groq...');

        // Try Groq as fallback
        try {
            return await callGroqAPI(text);
        } catch (groqError) {
            console.error('❌ AI Analysis Failed (Gemini & Groq):', {
                gemini: geminiError?.message,
                groq: groqError?.message
            });

            // Final fallback: return safe default
            return {
                is_misinformation: false,
                confidence: 0.0,
                category: 'general',
                explanation: 'AI analysis temporarily unavailable. Both Gemini and Groq services failed. Please try again later.',
            };
        }
    }
};

module.exports = {
    validateContent,
    callGeminiAPI,
    callGroqAPI,
    analyzeText,
};
