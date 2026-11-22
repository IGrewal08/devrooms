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
/**
 * POST /auth/register
 * Registers a new user account in PostgreSQL and returns the created profile + stub token.
 * Expected body: { username, email, password, role? }
 */
async function registerUser(req, res) {
    try {
        const { username, email, password, role = 'member' } = req.body;

        // Basic input validation
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'username, email, and password are required.',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedUsername = username.trim();
        const passwordHash = hashPassword(password);

        // VERIFY: Match column names against backend/seed.js (e.g., password_hash vs password, role)
        const insertQuery = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;

        const result = await pool.query(insertQuery, [
            trimmedUsername,
            normalizedEmail,
            passwordHash,
            role,
        ]);

        const newUser = result.rows[0];
        const token = createStubToken(newUser); // TODO (JWT): Swap for real JWT

        return res.status(201).json({
            message: 'User registered successfully.',
            user: newUser,
            token,
        });
    } catch (err) {
        // PostgreSQL unique_violation error code (duplicate email or username)
        if (err.code === '23505') {
            return res.status(409).json({
                error: 'An account with that email or username already exists.',
            });
        }
        console.error('[registerUser] Error:', err);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
}

app.post('/auth/register', registerUser);

/**
 * POST /auth/login
 * Authenticates a user by email (or username) and password.
 * Expected body: { email, password } or { username, password }
 */
async function loginUser(req, res) {
    try {
        const { email, username, password } = req.body;

        if ((!email && !username) || !password) {
            return res.status(400).json({
                error: 'email (or username) and password are required.',
            });
        }

        // Allow login with either email or username for flexible frontend testing
        const lookupValue = email ? email.trim().toLowerCase() : username.trim();
        const lookupColumn = email ? 'email' : 'username';

        // VERIFY: Match table and password column names with backend/seed.js
        const query = `
      SELECT id, username, email, password_hash, role, created_at
      FROM users
      WHERE ${lookupColumn} = $1
      LIMIT 1
    `;

        const result = await pool.query(query, [lookupValue]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const userRecord = result.rows[0];
        const isValid = verifyPassword(password, userRecord.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Never expose password_hash in API responses
        const { password_hash, ...safeUser } = userRecord;
        const token = createStubToken(safeUser); // TODO (JWT): Swap for real JWT

        return res.status(200).json({
            message: 'Login successful.',
            user: safeUser,
            token,
        });
    } catch (err) {
        console.error('[loginUser] Error:', err);
        return res.status(500).json({ error: 'Internal server error during login.' });
    }
}

app.post('/auth/login', loginUser);

/**
 * GET /users/me
 * Returns the authenticated user's profile.
 * Reads user ID from API Gateway header (`x-user-id`) or stub Bearer token.
 * TODO (JWT): Validate real JWT or rely on gateway-verified identity headers.
 */
async function getCurrentUser(req, res) {
    try {
        // Prefer gateway-forwarded user ID; fall back to stub token for direct testing
        const gatewayUserId = req.headers['x-user-id'];
        const token = extractToken(req);
        const userId = gatewayUserId || parseStubToken(token);

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized: missing user identity header or valid token.',
            });
        }

        const query = `
      SELECT id, username, email, role, created_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

        const result = await pool.query(query, [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('[getCurrentUser] Error:', err);
        return res.status(500).json({ error: 'Internal server error fetching profile.' });
    }
}

app.get('/users/me', getCurrentUser);


/**
 * GET /internal/users/:id
 * Internal microservice endpoint called by room-service to look up usernames/profiles.
 * Not intended to be exposed directly to public clients through the API Gateway.
 */
async function getInternalUserById(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'User ID parameter is required.' });
        }

        // Return only lightweight, non-sensitive identity fields needed by room-service
        const query = `
      SELECT id, username, role
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `User with id ${id} not found.` });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('[getInternalUserById] Error:', err);
        return res.status(500).json({ error: 'Internal server error during user lookup.' });
    }
}

app.get('/internal/users/:id', getInternalUserById);

/**
 * POST /internal/users/verify
 * Internal endpoint for verifying a token outside the HTTP API Gateway (e.g., Socket.IO handshake).
 * Accepts token in `req.body.token` or `Authorization: Bearer <token>`.
 *
 * TODO (JWT): Replace parseStubToken(token) with jwt.verify(token, process.env.JWT_SECRET)
 *             and handle TokenExpiredError / JsonWebTokenError cleanly.
 */
async function verifyInternalToken(req, res) {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(400).json({
                valid: false,
                error: 'Token is required for verification.',
            });
        }

        const userId = parseStubToken(token);
        if (!userId) {
            return res.status(401).json({
                valid: false,
                error: 'Invalid or malformed token.',
            });
        }

        const query = `
      SELECT id, username, email, role
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

        const result = await pool.query(query, [userId]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                valid: false,
                error: 'Token does not match an active user.',
            });
        }

        return res.status(200).json({
            valid: true,
            user: result.rows[0],
        });
    } catch (err) {
        console.error('[verifyInternalToken] Error:', err);
        return res.status(500).json({
            valid: false,
            error: 'Internal server error during token verification.',
        });
    }
}

app.post('/internal/users/verify', verifyInternalToken);
