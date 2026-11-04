const express = require('express');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Fetch rooms corresponding to this user from the database
 */
app.get('/api/rooms', (req, res) => {});

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
