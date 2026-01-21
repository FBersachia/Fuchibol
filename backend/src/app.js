const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const playerRoutes = require('./routes/players');
const matchRoutes = require('./routes/matches');
const teamRoutes = require('./routes/teams');
const resultRoutes = require('./routes/results');
const playerHistoryRoutes = require('./routes/playerHistory');
const socialRoutes = require('./routes/social');
const rankingRoutes = require('./routes/ranking');
const configRoutes = require('./routes/config');
const exportRoutes = require('./routes/export');
const courtRoutes = require('./routes/courts');
const groupRoutes = require('./routes/groups');
const inviteRoutes = require('./routes/invites');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/players', playerRoutes);
app.use('/matches', matchRoutes);
app.use('/teams', teamRoutes);
app.use('/courts', courtRoutes);
app.use('/matches', resultRoutes);
app.use('/players', playerHistoryRoutes);
app.use('/', inviteRoutes);
app.use('/', socialRoutes);
app.use('/', rankingRoutes);
app.use('/', configRoutes);
app.use('/', exportRoutes);
app.use('/', groupRoutes);

app.use(errorHandler);

module.exports = { app };
