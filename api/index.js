// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

const express = require('express');

const config = require('../config');

const activation = require('./activation');
const ping = require('./ping');

const router = express.Router();

const redisBackend = require('../util/redis').getRedis;

redisBackend((redis) => {
  activation(router, redis, config.logger);
  ping(router, redis, config.logger);
});

exports = module.exports = {
  router: router
};
