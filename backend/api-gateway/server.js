import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 4000;

const SERVICES = {
  users: process.env.user || 'http://localhost:4001',
  rooms: process.env.room || 'http://localhost:4002',
  ai: process.env.ai || 'http://localhost:4003',
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

// ---------- WebSockets ----------
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

// ---------- Helper: forward a request to a service ----------
async function forward(res, serviceName, path, options = {}) {
  try {
    const response = await fetch(`${SERVICES[serviceName]}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch {
    res.status(502).json({
      error: `The API Gateway could not reach the ${serviceName} service.`,
    });
  }
}

// ---------- User ----------

// ---------- Room ----------
app.get('/api/rooms', (req, res) => {
  forward(res, 'rooms', '/rooms', { method: 'POST', body: req.body });
});

app.post('/api/rooms', (req, res) => {});

app.get('/api/rooms/:id', (req, res) => {
  forward(res, 'rooms', `/rooms/${encodeURIComponent(req.params.id)}`);
});

app.post('/api/rooms/:id/members', (req, res) => {
  forward(res, 'rooms', `/rooms/${encodeURIComponent(req.params.id)}/members`);
});

app.delete('/api/rooms/:id/members/:userId', (req, res) => {
  forward(
    res,
    'rooms',
    `/rooms/${encodeURIComponent(req.params.id)}/members/${encodeURIComponent(req.params.userId)}`,
  );
});

app.post('/api/rooms/:id/invites', (req, res) => {
  forward(res, 'rooms', `/rooms/${encodeURIComponent(req.params.id)}/invites`);
});

app.post('/api/invites/:code/join', (req, res) => {
  forward(res, 'rooms', `/rooms/${encodeURIComponent(req.params.code)}/join`);
});

app.get('/api/rooms/:id/messages', (req, res) => {
  forward(res, 'rooms', `/rooms/${encodeURIComponent(req.params.id)}/messages`);
});

// ---------- AI ----------
app.get('/api/rooms/:id/summaries', (req, res) => {});

app.post('/api/rooms/:id/summaries', (req, res) => {});

app.get('/api/rooms/:id/diagrams', (req, res) => {});

app.post('/api/rooms/:id/diagrams', (req, res) => {});

// ---------- Other ----------
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ error: 'Request body is not valid JSON.' });
});

httpServer.listen(PORT, (error) => {
  if (error) {
    throw new Error(error);
  }
  console.log(`Server listening on PORT ${PORT}.`);
});
