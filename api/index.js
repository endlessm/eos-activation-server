// vim: ts=2 sw=2 expandtab
'use strict';

const express = require('express');

const config = require('../config');

const activation = require('./activation');
const ping = require('./ping');

const router = express.Router();

const dbBackend = require('../db');

dbBackend((db) => {
  // Add all routes here
  activation(router, db, config.logger);
  ping(router, db, config.logger);
});

exports = module.exports = {
  router: router
};
