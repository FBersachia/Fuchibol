const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Player } = require('../models');

function buildAuthResponse(user) {
  const payload = { id: user.id, role: user.role, name: user.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '8h',
  });
  return { token, user: payload };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.json(buildAuthResponse(user));
  } catch (err) {
    return next(err);
  }
}

function logout(_req, res) {
  return res.json({ ok: true });
}

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: email,
      email,
      password_hash,
      role: 'user',
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'gender'],
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { name, email, gender } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (gender !== undefined) user.gender = gender;

    await user.save();
    if (gender !== undefined) {
      await Player.update({ gender: user.gender }, { where: { user_id: user.id } });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
    });
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password are required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ok = await bcrypt.compare(current_password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, logout, register, me, updateMe, changePassword };
