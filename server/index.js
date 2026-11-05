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
        .json({ message: 'Error: no rooms were found for this user.' });
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
app.post('/api/rooms', (req, res) => {});

/**
 * Fetch messages corresponding to this room (id)
 */
app.get('/api/rooms/:id/messages', (req, res) => {});

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
