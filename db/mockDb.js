// vim: ts=2 sw=2 expandtab
'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('../util').logger;

const basename  = path.basename(module.filename);

// Mock data
const db = {
  _readDb: (name) => {
    logger.silly("Reading db...");

    let data;
    try {
      data = fs.readFileSync('./tmp/mockdb_' + name.toLowerCase() +'.json', 'utf8');
    } catch (err) {
      logger.info("Cannot open " + name + " file. Returning empty db");
      data = "[]";
    }

    logger.silly(data);

    return JSON.parse(data);
  },
  _writeDb: (name, data) => {
    if (data == undefined) {
      logger.error("No data to save!");
      throw Error("There was no data to save!");
    }

    logger.silly("Writing db...");

    let stringData = JSON.stringify(data);
    logger.silly(stringData);

    fs.writeFileSync('./tmp/mockdb_' + name.toLowerCase() +'.json', stringData, 'utf8');
  },
  catchFunc: { catch: (func) => {} }
};

db.createMockDb = (name) => {
  db[name] = {
    _db: () => {
      return db._readDb(name);
    },
    sync: (params) => {
      logger.silly("Clearing the DB");

      db[name]._db().length = 0;
      db._writeDb(name, []);

      return {
        then: (func) => { func();
                          return db.catchFunc; }
      };
    },
    upsert: (object) => {
      logger.silly("Upserted");
      logger.silly(db[name]._db());

      db[name].findOne(object).then((record) => {
        if (record == undefined) {
          let new_data = db[name]._db();
          object.createdAt = new Date();
          object.updatedAt = new Date();
          new_data.push(object);

          db._writeDb(name, new_data);

          logger.silly("Current item count: " + db[name]._db().length);

          logger.silly("Upsert saved");
        }
      });

      return {
        then: (func) => { func(true);
                          return db.catchFunc; },
      };
    },
    findOne: (params) => {
      let match = undefined;

      let records = db[name]._db();
      for (let record of records) {
        record_loop:
        for (let param in params) {
          if (record[param] != params[param]) {
            break record_loop;
          }
        }

        match = record;
        break;
      }

      return {
        then: (func) => { func(match);
                          return db.catchFunc; }
      };
    },
    findAndCountAll: () => {
      let result = {};
      result.rows = db[name]._db();
      result.count = result.rows.length;

      return {
        then: (func) => { func(result);
                          return db.catchFunc; }
      };
    }
  };
};

// Find out which models we have and create DB associations
fs.readdirSync(path.join(__dirname, '..' , 'models'))
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-9) === '.model.js');
  })
  .forEach(function(file) {
    // Strip '.model.js'
    const name = file.slice(0, -9);
    const capitalizeName = name.charAt(0).toUpperCase() + name.slice(1);
    db.createMockDb(capitalizeName);

    logger.debug('Associated model: ' + capitalizeName);
  });

exports = module.exports = db;
