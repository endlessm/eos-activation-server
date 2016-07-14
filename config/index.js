// vim: ts=2 sw=2 expandtab
'use strict';

const winston = require('winston');

const server_port = process.env.HTTP_PORT || 3000;
const server_bind_address = process.env.NODE_ENV == 'test' ? '127.0.0.1'
                                                           : '0.0.0.0';

// Logger config
const loggingLevel = 'info';
const logger = new (winston.Logger)({
 transports: [
   new (winston.transports.Console)({ level: loggingLevel })
 ]
});

// Crash handler
process.on('uncaughtException', (err) => {
  logger.error(err.stack);
  process.exit(1);
});

exports = module.exports = {
  logger: logger,
  server_port: server_port,
  server_bind_address: server_bind_address
};
