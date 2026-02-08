const { MongoClient } = require('mongodb');

let db = null;
let client = null;
let connectionPromise = null;

const connectDB = async () => {
    // If already connected, return the existing database instance
    if (db) return db;

    // If a connection is currently in progress, wait for it
    if (connectionPromise) return connectionPromise;

    // Start a new connection attempt
    connectionPromise = (async () => {
        try {
            const mongoUri = process.env.MONGO_URI;

            if (!mongoUri || mongoUri.includes('your_mongodb')) {
                console.log('⚠️  MongoDB URI not configured. Running without database.');
                return null;
            }

            // In serverless, we want to cache the client
            if (!client) {
                client = new MongoClient(mongoUri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    connectTimeoutMS: 10000,
                });
                await client.connect();
            }

            db = client.db(process.env.MONGO_DB_NAME || 'grandwarden_ai');
            console.log('✅ Connected to MongoDB');
            return db;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            db = null;
            client = null;
            throw error; // Propagate error so checking code knows it failed
        } finally {
            connectionPromise = null; // Reset promise wrapper
        }
    })();

    return connectionPromise;
};

const getDB = () => {
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('MongoDB connection closed');
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await closeDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    getDB,
    closeDB,
};
