// vim ts=2 sw=2 expandtab
'use strict';

let winston = require('winston');

let server_port = process.env.HTTP_PORT || 3000;

// Logger config
let loggingLevel = process.env.NODE_ENV == 'test' ? 'error' : 'info';
let logger = new (winston.Logger)({
 transports: [
   new (winston.transports.Console)({ level: loggingLevel })
 ]
});

// Crash handler
process.on('uncaughtException', (err) => {
  logger.error(err.stack);
  process.exit(1);
})

exports = module.exports = {
  logger: logger,
  server_port: server_port
};
