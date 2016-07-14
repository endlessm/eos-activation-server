// vim: ts=2 sw=2 expandtab
'use strict';

let db;

if (process.env.NODE_ENV == 'test') {
  db = require('./mockDb');
} else {
  throw Error("We don't have a real database hooked up!");
}

exports = module.exports = db;
