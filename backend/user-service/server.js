/**
 * DevRooms - User Service (Port 4001)
 * Owner: Vin Ong | Teammate: Inder Grewal
 *
 * Responsibilities:
 * - Public/Gateway auth & profile endpoints (/auth/register, /auth/login, /users/me)
 * - Internal microservice endpoints (/internal/users/:id, /internal/users/verify)
 *
 * Note: JWT signing/verification is intentionally stubbed for now.
 *       Look for "TODO (JWT)" markers when integrating jsonwebtoken.
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

// VERIFY: Match the exact export style of backend/db.config.js (e.g., `module.exports = pool` vs `{ pool }`)
const db = require('../db.config');
const pool = db.pool || db;

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 4001;

app.use(cors());
app.use(express.json());

/**
 * Health check endpoint for verifying service availability.
 */
function healthCheck(req, res) {
    return res.status(200).json({
        service: 'user-service',
        status: 'ok',
        port: Number(PORT),
    });
}

app.get('/health', healthCheck);

// --- Helper functions & route handlers will be added below in subsequent commits ---

app.listen(PORT, () => {
    console.log(`User Service listening on port ${PORT}`);
});

/**
 * Hashes a plaintext password using Node's built-in scrypt with a random salt.
 * Stored format: "<salt>:<derivedKeyHex>"
 */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored "<salt>:<hash>" string.
 * Falls back to direct comparison only if seeded test rows in seed.js store plaintext.
 */
function verifyPassword(password, storedHash) {
    if (!storedHash) return false;

    // Support salted scrypt hashes created by registerUser
    if (storedHash.includes(':')) {
        const [salt, key] = storedHash.split(':');
        const derivedKey = crypto.scryptSync(password, salt, 64);
        const keyBuffer = Buffer.from(key, 'hex');
        return (
            derivedKey.length === keyBuffer.length &&
            crypto.timingSafeEqual(derivedKey, keyBuffer)
        );
    }

    // Fallback for local dev seed data if seed.js uses plain passwords
    return password === storedHash;
}

/**
 * Generates a temporary placeholder token until JWT is implemented.
 * Format: "stub-token:<userId>"
 * TODO (JWT): Replace with jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' })
 */
function createStubToken(user) {
    return `stub-token:${user.id}`;
}

/**
 * Extracts a bearer token from the Authorization header or request body.
 */
function extractToken(req) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    if (req.body && typeof req.body.token === 'string') {
        return req.body.token.trim();
    }
    return null;
}

/**
 * Parses the stub token and returns the embedded user ID.
 * TODO (JWT): Replace with jwt.verify(token, process.env.JWT_SECRET)
 */
function parseStubToken(token) {
    if (!token || !token.startsWith('stub-token:')) {
        return null;
    }
    const userId = token.slice('stub-token:'.length).trim();
    return userId || null;
}