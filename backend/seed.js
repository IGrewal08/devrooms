require('dotenv/config');
const { Client } = require('pg');

const createTablesSQL = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) NOT NULL UNIQUE,
      role VARCHAR(100) DEFAULT 'Developer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
      room_id VARCHAR(100) PRIMARY KEY,
      user_id UUID,
      title VARCHAR(100) NOT NULL,
      scope VARCHAR(30) DEFAULT 'ISOLATED',
      branch VARCHAR(100) DEFAULT 'main',
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
      message_id VARCHAR(100) PRIMARY KEY,
      room_id VARCHAR(100) REFERENCES rooms(room_id) ON DELETE CASCADE,
      poster_name VARCHAR(100) NOT NULL,
      initials VARCHAR(10) DEFAULT 'DV',
      is_agent BOOLEAN DEFAULT FALSE,
      message TEXT NOT NULL,
      artifact_type VARCHAR(50),
      artifact_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function main() {
    if (!process.env.DB_CONNECTION_STRING && !process.env.DB_HOST) {
        console.log('ℹ️ No PostgreSQL .env connection string detected. Backend will use auto-seeded store.');
        return;
    }

    const client = new Client(
        process.env.DB_CONNECTION_STRING
            ? { connectionString: process.env.DB_CONNECTION_STRING }
            : {
                user: process.env.DB_USER || 'postgres',
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'devrooms',
                password: process.env.DB_PASSWORD || '',
                port: Number(process.env.DB_PORT) || 5432
            }
    );

    try {
        console.log('🌱 Connecting to PostgreSQL and seeding DevRooms tables...');
        await client.connect();
        await client.query(createTablesSQL);

        const userRes = await client.query(
            `INSERT INTO users (username, role)
       VALUES ('Vin Ong', 'Front-End & Back-End Lead'),
              ('Inder Grewal', 'Agentic AI & WebSocket Lead')
       ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role
       RETURNING user_id, username;`
        );

        const vinId = userRes.rows[0]?.user_id;

        await client.query(
            `INSERT INTO rooms (room_id, user_id, title, scope, branch, description)
       VALUES
         ('central', $1, 'Central', 'SHARED', 'main', 'System planning, AI summaries & Mermaid.js architecture diagrams'),
         ('frontend', $1, 'Front-end', 'ISOLATED', 'feat/room-presence', 'Isolated feature workspace — React UI & WebSocket presence'),
         ('backend', $1, 'Back-end', 'ISOLATED', 'feat/express-socket-api', 'Isolated feature workspace — Express REST API & PostgreSQL'),
         ('qa', $1, 'QA & testing', 'ISOLATED', 'chore/docker-github-actions', 'Automated GitHub Actions & Docker container tests')
       ON CONFLICT (room_id) DO NOTHING;`,
            [vinId]
        );

        console.log('✅ Completed PostgreSQL Seeding for Velocity Labs (Group 12).');
    } catch (err) {
        console.error('⚠️ Seed error:', err.message);
    } finally {
        await client.end().catch(() => { });
    }
}

main();