// vim: ts=2 sw=2 expandtab
'use strict';

const fs = require('fs');
const path = require('path');
const basename  = path.basename(module.filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/db.json')[env];

const Sequelize = require('sequelize');

const logger = require('../util').logger;

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}

let db = {};
fs.readdirSync(path.join(__dirname, '..' , 'models'))
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, '..', 'models', file));
    db[model.name] = model;

    logger.debug('Associated model: ' + model.name);
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize.authenticate()
         .then(function(err) {
            logger.info('DB Connection established successfully');
          })
          .catch(function (err) {
            logger.error('Unable to connect to the database:', err);
            throw err;
          });

exports = module.exports = db;
