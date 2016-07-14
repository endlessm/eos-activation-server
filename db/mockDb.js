// vim: ts=2 sw=2 expandtab
'use strict';

const fs = require('fs');
const logger = require('../util').logger;

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
  }
};

db.Activation = {
  _db: () => {
    return db._readDb('Activation');
  },
  sync: (params) => {
    logger.silly("Clearing the DB");

    db.Activation._db().length = 0;
    db._writeDb('Activation', []);

    return {
      then: (func) => { func() }
    };
  },
  upsert: (object) => {
    logger.silly("Upserted");
    logger.silly(db.Activation._db());

    let new_data = db.Activation._db();
    new_data.push(object);

    db._writeDb('Activation', new_data);

    logger.silly("Current item count: " + db.Activation._db().length);

    const saved_object = db.Activation._db().slice(-1)[0];

    logger.silly("Upsert saved");
    logger.silly(saved_object);

    return {
      then: (func) => { func(saved_object) }
    };
  },
  findAndCountAll: () => {
    let result = {};
    result.rows = db.Activation._db();
    result.count = result.rows.length;

    return {
      then: (func) => { func(result) }
    };
  }
};

exports = module.exports = db;
