const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

/**
 * Insert a new room from this user into the database
 */
app.get('/rooms', async (req, res) => {
  try {
    // TEMPORARY
    const rooms = await pool.query(`SELECT * FROM rooms;`);
    if (!rooms.rows || rooms.rows.length === 0) {
      return res
        .status(422)
        .json({ message: 'Error: No rooms were found for this user.' });
    }
    res.status(200).json({
      data: rooms.rows || [],
      message: 'Rooms fetched successfully.',
    });
  } catch (err) {
    console.error('Issue fetching room for this user: ', err);
    res.status(500).json({
      message: 'Error: a issue occurred while trying to query your rooms.',
      error: err,
    });
  }
});

app.post('/rooms', async (req, res) => {
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

app.get('/rooms/:id', (req, res) => {});

app.post('/rooms/:id/members', (req, res) => {});

app.delete('/rooms/:id/members/:userId', (req, res) => {});

app.post('/rooms/:id/invites', (req, res) => {});

app.post('/invites/:code/join', (req, res) => {});

/**
 * Fetch messages to the corresponding room id
 */
app.get('/rooms/:id/messages', async (req, res) => {
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

// ---------- Internal Routes ----------
app.get('/internal/users/:id', (req, res) => {});

app.post('/internal/users/verify', (req, res) => {});
