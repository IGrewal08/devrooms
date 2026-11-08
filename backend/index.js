const env = require('dotenv/config');
const express = require('express');
const cors = require('cors');
const pool = require('db.config.js');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

/**
 * Fetch rooms corresponding to this user from the database
 */
app.get('/api/rooms', async (req, res) => {
  try {
    const { userId } = req.body;
    const rooms = await pool.query(
      `SELECT * FROM rooms where user_id = ${userId}`,
    );
    if (rooms.rows === undefined) {
      return res
        .status(422)
        .json({ message: 'Error: No rooms were found for this user.' });
    }
    res
      .status(200)
      .json({ data: rooms.rows, message: 'Rooms fetched successfully.' });
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
    const { userId, title, description } = req.body;
    const room = await pool.query(
      `INSERT INTO rooms (user_id, title, description) VALUES (${userId}, ${title}, ${description})`,
    );
    if (room.rows === undefined) {
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
  try {
    const roomId = req.params.id;
    const messages = await pool.query(
      `SELECT * FROM messages WHERE room_id = ${roomId}`,
    );
    if (messages.rows === undefined) {
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
    const { userId, userMessage } = req.body;
    const message = await pool.query(
      `INSERT INTO messages (room_id, poster_id, message) VALUES (${roomId}, ${userId}, ${userMessage})`,
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
  res.status(404).send(`The path: "${res.path}" was not found.`);
});

app.listen(process.env.PORT, 'localhost', (error) => {
  if (error) {
    throw new Error(error);
  }
  console.log(`Express server listening on PORT ${process.env.PORT}.`);
});
