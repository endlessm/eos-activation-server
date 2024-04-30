// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

const logger = require('../util').logger

const server_port = process.env.HTTP_PORT || 3000;
const server_bind_address = process.env.BIND_ADDRESS || '127.0.0.1';

const redis_host = process.env.REDIS_HOST || '127.0.0.1';
const redis_port = parseInt(process.env.REDIS_PORT, 10) || 6379;
const redis_password = process.env.REDIS_PASSWORD || '';

// Crash handler
process.on('uncaughtException', (err) => {
  logger.error(err.stack);
  process.exit(1);
});

exports = module.exports = {
  env: process.env.NODE_ENV,
  logger,
  server_port,
  server_bind_address,
  redis_host,
  redis_port,
  redis_password,
};
