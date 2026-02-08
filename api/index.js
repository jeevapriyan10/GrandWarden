const app = require('../backend/index.js');
const { connectDB } = require('../backend/services/database.js');

// Vercel Serverless Function entry point
module.exports = async (req, res) => {
    // Explicitly ensure DB is connected (vital for cold starts)
    try {
        await connectDB();
    } catch (dbError) {
        console.error('Serverless DB Connect Error:', dbError);
        // Continue, as app handles missing DB gracefully
    }

    // Delegate to the Express app
    return app(req, res);
};
