const { sequelize } = require('../config/database');
const User = require('./user');
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

Match.hasMany(Team, { foreignKey: 'match_id' });
Team.belongsTo(Match, { foreignKey: 'match_id' });

Court.hasMany(Match, { foreignKey: 'court_id' });
Match.belongsTo(Court, { foreignKey: 'court_id' });

Team.belongsToMany(Player, { through: TeamPlayer, foreignKey: 'team_id', otherKey: 'player_id' });
Player.belongsToMany(Team, { through: TeamPlayer, foreignKey: 'player_id', otherKey: 'team_id' });

User.hasOne(Player, { foreignKey: 'user_id' });
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

AppConfig.hasMany(ConfigHistory, { foreignKey: 'config_id' });
ConfigHistory.belongsTo(AppConfig, { foreignKey: 'config_id' });

const db = {
  sequelize,
  User,
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
