// vim: ts=2 sw=2 expandtab
'use strict';

const logger = require('../util').logger;

// Mock data
const db = {};
db.Activation = {
  _db: [],
  sync: (params) => {
    logger.info("Clearing the DB");
    db.Activation._db.length = 0;

    return {
      then: (func) => { func() }
    };
  },
  upsert: (object) => {
    db.Activation._db.push(object);

    logger.info("Current item count: " + db.Activation._db.length);

    return {
      then: (func) => { func(db.Activation._db.slice(-1)[0]) }
    };
  },
  findAndCountAll: () => {
    let result = {};
    result.count = db.Activation._db.length;
    result.rows = db.Activation._db;

    return {
      then: (func) => { func(result) }
    };
  }
};

exports = module.exports = db;
