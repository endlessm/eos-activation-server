// vim: ts=2 sw=2 expandtab
'use strict';

let db;

const useNoSql = true;
const useMockDb = false;

var callbackFunction;

const setUpDb = (callback) => {
  if (useMockDb && process.env.NODE_ENV == 'test') {
    db = require('./mock_db');
    callback(db);
  } else if (useNoSql) {
    const noSqlDb = require('./nosql_db');
    noSqlDb((database) => {
      callback(database);
    });
  } else {
    throw new Error('SQL database API currently disabled!');
    db = require('./sql_db');
    callback(db);
  }
}

exports = module.exports = (callback) => {
  setUpDb(callback);
};
