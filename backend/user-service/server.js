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