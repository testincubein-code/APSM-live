import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConnectionOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {
        rejectUnauthorized: false
    },
    // Upstash-specific configurations to prevent idle ECONNRESET
    keepAlive: 10000, 
    pingInterval: 30000,
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000); // Auto-reconnect quietly
    }
};

let redisClient = null;

if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, redisConnectionOptions);

    redisClient.on('connect', () => {
        console.log('🟢 Successfully connected to Upstash Redis');
    });

    redisClient.on('error', (err) => {
        if (err.message.includes('ECONNRESET')) return; // Ignore expected Upstash disconnects
        console.error('🔴 Redis connection error:', err.message);
    });
} else {
    console.warn('⚠️ REDIS_URL is not defined. Redis will not be connected. Automation features may not work.');
}

// Export the URL and options for BullMQ
export const connectionOptions = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisConnectionOptions)
    : null;

if (connectionOptions) {
    // Prevent unhandled promise rejections on the BullMQ connection instance
    connectionOptions.on('error', (err) => {
        if (err.message.includes('ECONNRESET')) return;
        console.error('🔴 BullMQ Redis error:', err.message);
    });
}

// Kept for backward compatibility if needed elsewhere
export default redisClient;
