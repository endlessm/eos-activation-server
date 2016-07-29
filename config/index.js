// vim: ts=2 sw=2 expandtab
'use strict';

const logger = require('../util').logger

const server_port = process.env.HTTP_PORT || 3000;
const server_bind_address = process.env.BIND_ADDRESS || '127.0.0.1';

// Crash handler
process.on('uncaughtException', (err) => {
  logger.error(err.stack);
  process.exit(1);
});

exports = module.exports = {
  env: process.env.NODE_ENV,
  logger: logger,
  server_port: server_port,
  server_bind_address: server_bind_address
};
