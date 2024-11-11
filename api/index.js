// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

import express from 'express';

import config from '../config/index.js';

import activation from './activation.js';
import ping from './ping.js';
import health from './health.js';

export const router = express.Router();

import { getRedis as redisBackend } from '../util/redis.js';

redisBackend((redis) => {
  activation(router, redis, config.logger);
  ping(router, redis, config.logger);
  health(router, redis, config.logger);
});
