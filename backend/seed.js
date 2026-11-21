import { Client } from 'pg';

/**
 * Postgres Database tables for storing crucial information over devrooms
 */
const create = `
    DO $$ BEGIN
      CREATE TYPE room_role AS ENUM ('OWNER', 'MEMBER');
    EXCEPTION
      WHEN duplicate_object THEN NULL;

    DO $$ BEGIN
      CREATE TYPE job_status AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');
    EXCEPTION
      WHEN duplicate_object THEN NULL;

    DO ## BEGIN
      CREATE TYPE process_type AS ENUM ('AI_SUMMARY', 'AI_DIAGRAM', 'WEBSOCKET', 'CLIENT', 'SERVER');
    EXCEPTION
      WHEN duplicate_object THEN NULL;

    CREATE TABLE IF NOT EXISTS "user" (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'devrooms',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('Seeding...');
    await client.connect();
    await client.query('BEGIN');
    await client.query(create);

    // Seed into user
    const userOneResult = await client.query(
      `INSERT INTO "user" (username, password) VALUES ($1, $2) 
      RETURNING id, username;`,
      [
        'test_user_one',
        '$2b$10$examplehashforseeduserone0000000000000000000000000001',
      ],
    );

    const userTwoResult = await client.query(
      `INSERT INTO "user" (username, password)
      VALUES ($1, $2)
      RETURNING id, username;
      `,
      [
        'test_user_two',
        '$2b$10$examplehashforseedusertwo0000000000000000000000000002',
      ],
    );

    const userOneId = userOneResult.rows[0]?.id;
    const userTwoId = userTwoResult.rows[0]?.id;
    if (!userOneId || !userTwoId) {
      throw new Error('Could not seed into user table.');
    }

    // seed into room
    const initialRoomResult = await client.query(
      `INSERT INTO room (owner_id, title, description) 
      VALUES ($1, $2, '$3
      RETURNING id;`,
      [
        userOneId,
        'Initial Room',
        'Sample room description for the initial room.',
      ],
    );

    const addRoomResult = await client.query(
      `INSER INTO room (owner_id, title, description)
      VALUES ($1, $2, $3)
      RETURNING id;`,
      [
        userTwoId,
        'Frontend',
        'Frontend system design notes, sequences, and API contracts.',
      ],
    );

    const initialRoomId = initialRoomResult.rows[0]?.id;
    const addRoomId = addRoomResult.rows[0]?.id;

    if (!initialRoomId || !addRoomId) {
      throw new Error('Could not seed into room table.');
    }

    // seed into membership
    await client.query(
      `INSERT INTO room_user (room_id, user_id, role)
      VALUES
        ($1, $2, 'OWNER'),
        ($1, $3, 'MEMBER'),
        ($4, $3, 'OWNER'),
        ($4, $2, 'MEMBER'),
      ON CONFLICT (room_id, user_id) DO NOTHING;`,
      [initialRoomId, userOneId, userTwoId, addRoomId],
    );

    // seed into message
    const msgOneResult = await client.query(
      `INSERT INTO message (room_id, poster_id, message, client_message_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;`,
      [
        initialRoomId,
        userOneId,
        'Initial message posted in room.',
        'client-msg-001',
      ],
    );

    const msgTwoResult = await client.query(
      `INSERT INTO message (room_id, poster_id, message, client_message_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;`,
      [
        initialRoomId,
        userTwoId,
        'Hey! let`s test the AI generated summaries!',
        'client-msg-002',
      ],
    );

    const msgThreeResult = await client.query(
      `INSERT INTO message (room_id, poster_id, message, client_message_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;`,
      [
        addRoomId,
        userTwoId,
        'Lets map out our APIs for the users schema.',
        'client-msg-003',
      ],
    );

    const msgOneId = msgOneResult.rows[0]?.id;
    const msgTwoId = msgTwoResult.rows[0]?.id;
    const msgThreeId = msgThreeResult.rows[0]?.id;

    // seed into summary
    const summaryResult = await client.query(
      `INSERT INTO summary (
        room_id, created_by, from_message_id, to_message_id, content, status, ai_model_used, generated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'SUCCEEDED', $6, CURRENT_TIMESTAMP)
      RETURNING id;`,
      [
        initialRoomId,
        userOneId,
        msgOneId,
        msgTwoId,
        'Team kicked off the room and confirmed internal readiness for AI summaries.',
        'Qwen3',
      ],
    );

    const summaryId = summaryResult.rows[0]?.id;

    // seed into diagram
    const diagramResult = await client.query(
      `INSERT INTO diagram (
        room_id, created_by, version, mermaid_source, status, ai_model_used, generated_at
      )
      VALUES ($1, $2, $3, $4, 'SUCCEEDED', $5, CURRENT_TIMESTAMP)
      RETURNING id;`,
      [
        addRoomId,
        userTwoId,
        1,
        'flowchart LR\n  Client -->|WS| Gateway[WebSocket Server]\n  Gateway --> Queue[(Job Queue)]\n  Queue --> Worker[AI Worker]',
        'Qwen3',
      ],
    );

    const diagramId = diagramResult.rows[0]?.id;

    // seed into process logs
    await client.query(
      `INSERT INTO process_log (
        process_type, status, room_id, user_id, summary_id, diagram_id, completed_at
      )
      VALUES
        ('AI_SUMMARY', 'SUCCEEDED', $1, $2, $3, NULL, CURRENT_TIMESTAMP),
        ('AI_DIAGRAM', 'SUCCEEDED', $4, $5, NULL, $6, CURRENT_TIMESTAMP),
        ('WEBSOCKET', 'RUNNING', $1, $2, NULL, NULL, NULL);`,
      [initialRoomId, userOneId, summaryId, addRoomId, userTwoId, diagramId],
    );

    await client.query('COMMIT');
    console.log('Completed Seeding.');
  } catch (err) {
    console.error('An error occurred while seeding the database: ', err);
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
