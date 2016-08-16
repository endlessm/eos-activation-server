// vim: ts=2 sw=2 expandtab
'use strict';

let db;

let useMockDb = true;

if (useMockDb && process.env.NODE_ENV == 'test') {
  db = require('./mockDb');
} else {
  db = require('./sqlDb');
}

exports = module.exports = db;
