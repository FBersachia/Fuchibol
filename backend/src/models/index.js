const { sequelize } = require('../config/database');
const User = require('./user');
const Group = require('./group');
const GroupMember = require('./groupMember');
const GroupInvite = require('./groupInvite');
const Player = require('./player');
const Match = require('./match');
const Court = require('./court');
const Team = require('./team');
const TeamPlayer = require('./teamPlayer');
const MatchResult = require('./matchResult');
const Distinction = require('./distinction');
const EloHistory = require('./eloHistory');
const AppConfig = require('./appConfig');
const ConfigHistory = require('./configHistory');

Group.hasMany(GroupMember, { foreignKey: 'group_id' });
GroupMember.belongsTo(Group, { foreignKey: 'group_id' });

User.hasMany(GroupMember, { foreignKey: 'user_id' });
GroupMember.belongsTo(User, { foreignKey: 'user_id' });

Group.hasMany(GroupInvite, { foreignKey: 'group_id' });
GroupInvite.belongsTo(Group, { foreignKey: 'group_id' });
GroupInvite.belongsTo(Player, { foreignKey: 'player_id' });
GroupInvite.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Group.hasMany(Player, { foreignKey: 'group_id' });
Player.belongsTo(Group, { foreignKey: 'group_id' });

Group.hasMany(Match, { foreignKey: 'group_id' });
Match.belongsTo(Group, { foreignKey: 'group_id' });

Group.hasMany(Team, { foreignKey: 'group_id' });
Team.belongsTo(Group, { foreignKey: 'group_id' });

Group.hasMany(Court, { foreignKey: 'group_id' });
Court.belongsTo(Group, { foreignKey: 'group_id' });

Match.hasMany(Team, { foreignKey: 'match_id' });
Team.belongsTo(Match, { foreignKey: 'match_id' });

Court.hasMany(Match, { foreignKey: 'court_id' });
Match.belongsTo(Court, { foreignKey: 'court_id' });

Team.belongsToMany(Player, { through: TeamPlayer, foreignKey: 'team_id', otherKey: 'player_id' });
Player.belongsToMany(Team, { through: TeamPlayer, foreignKey: 'player_id', otherKey: 'team_id' });

User.hasMany(Player, { foreignKey: 'user_id' });
Player.belongsTo(User, { foreignKey: 'user_id' });

Match.hasOne(MatchResult, { foreignKey: 'match_id' });
MatchResult.belongsTo(Match, { foreignKey: 'match_id' });

Match.hasMany(Distinction, { foreignKey: 'match_id' });
Distinction.belongsTo(Match, { foreignKey: 'match_id' });

Player.hasMany(Distinction, { foreignKey: 'player_id' });
Distinction.belongsTo(Player, { foreignKey: 'player_id' });

Match.hasMany(EloHistory, { foreignKey: 'match_id' });
Player.hasMany(EloHistory, { foreignKey: 'player_id' });
EloHistory.belongsTo(Match, { foreignKey: 'match_id' });
EloHistory.belongsTo(Player, { foreignKey: 'player_id' });

Group.hasOne(AppConfig, { foreignKey: 'group_id' });
AppConfig.belongsTo(Group, { foreignKey: 'group_id' });

AppConfig.hasMany(ConfigHistory, { foreignKey: 'config_id' });
ConfigHistory.belongsTo(AppConfig, { foreignKey: 'config_id' });
ConfigHistory.belongsTo(Group, { foreignKey: 'group_id' });

const db = {
  sequelize,
  User,
  Group,
  GroupMember,
  GroupInvite,
  Player,
  Match,
  Court,
  Team,
  TeamPlayer,
  MatchResult,
  Distinction,
  EloHistory,
  AppConfig,
  ConfigHistory,
};

module.exports = db;
