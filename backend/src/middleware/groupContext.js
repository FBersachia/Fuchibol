const { Group, GroupMember } = require('../models');

async function requireGroup(req, res, next) {
  try {
    const rawGroupId = req.headers['x-group-id'];
    if (!rawGroupId) {
      return res.status(400).json({ error: 'Missing X-Group-Id header' });
    }

    const groupId = Number(rawGroupId);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({ error: 'Invalid X-Group-Id header' });
    }

    const group = await Group.findOne({ where: { id: groupId, deleted_at: null } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: req.user.id, deleted_at: null },
    });
    if (!member) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.group = { id: group.id, slug: group.slug, name: group.name };
    req.groupMember = member;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireGroupRole(role) {
  return (req, res, next) => {
    if (!req.groupMember || req.groupMember.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

module.exports = { requireGroup, requireGroupRole };
