import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

// TODO: authenticate users once with socket connection
io.use((socket, next) => {
  //socket.data.userId = '';
  next();
});

io.on('connection', (socket) => {
  socket.on('room:join', async ({ roomId }, ack) => {
    try {
      // Check user membership in this room
      const member = await pool.query(
        `SELECT * FROM room_user WHERE user_id = $1 AND room_id = $2`,
        [socket.data.userId, roomId],
      );

      // only respond errors and success message to the sender
      if (!member) {
        return ack?.({ ok: false, error: 'Access to this room denied' });
      }

      await socket.join(roomId);
      ack?.({ ok: true, roomId });
    } catch (err) {
      ack?.({ ok: false, error: 'Failed to join room' });
    }
  });

  socket.on('chat:send', async ({ roomId, message }, ack) => {
    try {
      const response = await pool.query(
        `INSERT INTO message (room_id, poster_id, message) VALUES ($1, $2, $3)`[
          (roomId, socket.data.userId, message)
        ],
      );
      // emit the new message to everyone
      io.to(roomId).emit('chat:message', response);
      // let sender know if their message succeeded
      ack?.({ ok: true, message: response });
    } catch (err) {
      ack?.({ ok: false, error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', ({ userId }, ack) => {
    ack?.at({
      ok: true,
      message: `[Socket.io] user ${userId} disconnected successfully.`,
    });
  });
});

/**
 * Fetch rooms corresponding to this user from the database
 */
app.get('/api/rooms', async (req, res) => {
  try {
    // TEMPORARY
    const rooms = await pool.query(`SELECT * FROM rooms;`);
    if (!rooms.rows || rooms.rows.length === 0) {
      return res
        .status(422)
        .json({ message: 'Error: No rooms were found for this user.' });
    }
    res
      .status(200)
      .json({ data: rooms.rows || [], message: 'Rooms fetched successfully.' });
  } catch (err) {
    console.error('Issue fetching room for this user: ', err);
    res.status(500).json({
      message: 'Error: a issue occurred while trying to query your rooms.',
      error: err,
    });
  }
});

/**
 * Insert a new room from this user into the database
 */
app.post('/api/rooms', async (req, res) => {
  try {
    // const { userId, title, description } = req.body;
    const { title, description } = req.body;

    const users = await pool.query(`SELECT * FROM users;`);
    if (!users.rows || users.rows.length === 0) {
      return res
        .status(422)
        .json({ message: 'Error: A internal DB error occurred.' });
    }

    const userId = users.rows[0].user_id;

    const room = await pool.query(
      `INSERT INTO rooms (user_id, title, description) VALUES ($1, $2, $3) RETURNING *`,
      [userId, title, description],
    );
    if (!room.rows || room.rows.length === 0) {
      return res
        .status(422)
        .json({ message: 'Error: A internal DB error occurred.' });
    }
    res
      .status(200)
      .json({ data: room.rows, message: 'Room was created successfully.' });
  } catch (err) {
    console.error('Issue creating a room for this user: ', err);
    res.status(500).json({
      message: 'Error: A issue occurred while trying to create your room.',
      error: err,
    });
  }
});

/**
 * Fetch messages to the corresponding room id
 */
app.get('/api/rooms/:id/messages', async (req, res) => {
  const roomId = req.params.id;
  try {
    const messages = await pool.query(
      `SELECT messages.*, users.username FROM messages JOIN users ON messages.poster_id = users.user_id WHERE messages.room_id = $1`,
      [roomId],
    );
    if (!messages.rows) {
      return res
        .status(422)
        .json({ message: 'Error: A internal DB error occurred.' });
    }
    res.status(200).json({
      data: messages.rows,
      message: 'Messages were fetched successfully.',
    });
  } catch (err) {
    console.error('Issue fetching your messages for this room: ', roomId);
    res.status(500).json({
      message:
        'Error: A issue occurred while trying to fetch this rooms messages.',
      error: err,
    });
  }
});

/**
 * Create a message to the corresponding room id
 */
app.post('/api/rooms/:id/messages', async (req, res) => {
  try {
    const roomId = req.params.id;
    //const { userId, userMessage } = req.body;
    const { userMessage } = req.body;

    const users = await pool.query(`SELECT * FROM users;`);
    if (!users.rows || users.rows.length === 0) {
      return res
        .status(422)
        .json({ message: 'Error: A internal DB error occurred.' });
    }
    const userId = users.rows[0].user_id;

    const message = await pool.query(
      `INSERT INTO messages (room_id, poster_id, message) VALUES ($1, $2, $3) RETURNING *`,
      [roomId, userId, userMessage],
    );
    if (message.rows === undefined) {
      return res
        .status(422)
        .json({ message: 'Error: A internal DB error occurred.' });
    }
    res.status(200).json({
      data: message.rows,
      message: 'Message was created successfully.',
    });
  } catch (err) {
    console.error('Issue creating your message for this room: ', roomId);
    res.status(500).json({
      message: 'Error: A issue occurred while trying to create your message.',
      error: err,
    });
  }
});

/**
 * Catch when no routes match.
 */
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(404).send(`The path: "${req.path}" was not found.`);
});

httpServer.listen(PORT, (error) => {
  if (error) {
    throw new Error(error);
  }
  console.log(`Server listening on PORT ${PORT}.`);
});
