// vim: ts=2 sw=2 expandtab
'use strict';

const express = require('express');

const config = require('../config');

const activation = require('./activation');
const ping = require('./ping');

const router = express.Router();

const dbBackend = require('../db');
const redisBackend = require('../util/redis').getRedis;

dbBackend((db) => {
  // Add all routes here
  ping(router, db, config.logger);
});
redisBackend((redis) => {
  activation(router, redis, config.logger);
});

exports = module.exports = {
  router: router
};
