import { Client } from 'pg';

/**
 * These tables are for sprint 1 and are due to change
 */
const create = `
    CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
        room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
        message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID,
        poster_id UUID,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(room_id),
        FOREIGN KEY (poster_id) REFERENCES users(user_id)
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

    const usersResult = await client.query(
      `INSERT INTO users (username) VALUES ('test_user_one') RETURNING user_id, username;`,
    );

    const { userId, userName } = usersResult.rows[0];

    if (!userId || !userName) {
      throw new Error('Could not seed into users table.');
    }

    const roomsResults = await client.query(
      `INSERT INTO rooms (user_id, title, description) VALUES ($1, 'Initial Room', 'Sample room description for the initial room.') RETURNING room_id;`,
      [userId],
    );

    const { roomId } = roomsResults.rows[0];

    if (!roomId) {
      throw new Error('Could not seed into rooms table.');
    }

    await query.query(
      `INSERT INTO messages (room_id, poster_id, message) VALUES ('$1', '$2', 'Initial message posted in room.');`,
      [roomId, userId],
    );

    await await client.end();
    console.log('Completed Seeding.');
  } catch (err) {
    console.error('An error occurred while seeding the database: ', err);
  }
}

main();
