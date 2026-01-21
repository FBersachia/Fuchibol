const bcrypt = require('bcryptjs');
const { User, Player } = require('../models');

async function listUsers(_req, res, next) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'gender', 'created_at', 'updated_at'],
      order: [['id', 'ASC']],
    });
    return res.json(users);
  } catch (err) {
    return next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, gender } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password_hash,
      role: role || 'user',
      gender: gender || null,
    });

    return res.status(201).json({
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

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, password, role, gender } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (gender !== undefined) user.gender = gender;
    if (password !== undefined) {
      user.password_hash = await bcrypt.hash(password, 10);
    }

    await user.save();
    if (gender !== undefined) {
      await Player.update({ gender }, { where: { user_id: user.id } });
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

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ error: 'new_password is required' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};
