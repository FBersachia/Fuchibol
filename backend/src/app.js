const express = require('express');
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
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

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
app.use('/', socialRoutes);
app.use('/', rankingRoutes);
app.use('/', configRoutes);
app.use('/', exportRoutes);

app.use(errorHandler);

module.exports = { app };
