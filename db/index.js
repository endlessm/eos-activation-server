// vim: ts=2 sw=2 expandtab
'use strict';

let db;

const useNoSql = true;
const useMockDb = false;

var callbackFunction;

const setUpDb = (callback) => {
  if (useMockDb && process.env.NODE_ENV == 'test') {
    db = require('./mockDb');
    callback(db);
  } else if (useNoSql) {
    const noSqlDb = require('./noSqlDb');
    noSqlDb((database) => {
      callback(database);
    });
  } else {
    throw new Error('SQL database API currently disabled!');
    db = require('./sqlDb');
    callback(db);
  }
}

exports = module.exports = (callback) => {
  setUpDb(callback);
};
