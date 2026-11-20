import { Client } from 'pg';

/**
 * Postgres Database tables for storing crucial information over devrooms
 */
const create = `
    CREATE TYPE room_role AS ENUM ('OWNER', 'MEMBER');

    CREATE TYPE job_status AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

    CREATE TYPE process_type AS ENUM ('AI_SUMMARY', 'AI_DIAGRAM', 'WEBSOCKET', 'CLIENT', 'SERVER');

    CREATE TABLE IF NOT EXISTS user (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS room (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS room_user (
        room_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role room_role DEFAULT 'MEMBER',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, user_id),
        FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS message (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR(255) NOT NULL,
        poster_id VARCHAR(255) NOT NULL,
        message TEXT,
        client_message_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
        FOREIGN KEY (poster_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS summary (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        from_message_id VARCHAR(255),
        to_message_id VARCHAR(255),
        content TEXT,
        status VARCHAR(255) DEFAULT 'PENDING',
        ai_model_used VARCHAR(255) NOT NULL,
        generated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS diagram (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        version INT NOT NULL,
        mermaid_source TEXT,
        status VARCHAR(255) DEFAULT 'PENDING',
        ai_model_used VARCHAR(255) NOT NULL,
        generated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS process_log (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
      process_type VARCHAR(255) NOT NULL,
      status VARCHAR(255) DEFAULT 'RUNNING',
      room_id VARCHAR(255),
      user_id VARCHAR(255),
      summary_id VARCHAR(255),
      diagram_id VARCHAR(255),
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      error_message TEXT,
      FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL,
      FOREIGN KEY (summary_id) REFERENCES summary(id) ON DELETE SET NULL,
      FOREIGN KEY (diagram_id) REFERENCES diagram(id) ON DELETE SET NULL,
      INDEX (status, started_at)
    );
`;

/**
 * Function for connecting Postgres db to create tables and seed
 */
async function main() {
  try {
    console.log('Seeding...');
    const client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'devrooms',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });

    await client.connect();
    await client.query(create);

    const userResult = await client.query(
      `INSERT INTO user (username) VALUES ('test_user_one') RETURNING user_id, username;`,
    );

    const { userId, userName } = userResult.rows[0];

    if (!userId || !userName) {
      throw new Error('Could not seed into user table.');
    }

    const roomResults = await client.query(
      `INSERT INTO room (user_id, title, description) VALUES ($1, 'Initial Room', 'Sample room description for the initial room.') RETURNING room_id;`,
      [userId],
    );

    const { roomId } = roomResults.rows[0];

    if (!roomId) {
      throw new Error('Could not seed into room table.');
    }

    await query.query(
      `INSERT INTO message (room_id, poster_id, message) VALUES ($1, $2, 'Initial message posted in room.');`,
      [roomId, userId],
    );

    await client.end();
    console.log('Completed Seeding.');
  } catch (err) {
    console.error('An error occurred while seeding the database: ', err);
    throw err;
  }
}

main();
