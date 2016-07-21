// vim: ts=2 sw=2 expandtab
'use strict';

let db;

if (process.env.NODE_ENV == 'test') {
  // db = require('./mockDb');
  db = require('./sqlDb');
} else {
  db = require('./sqlDb');
}

exports = module.exports = db;
