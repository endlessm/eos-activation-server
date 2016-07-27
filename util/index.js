// vim: ts=2 sw=2 expandtab
'use strict';

const winston = require('winston');

const loggingLevel = process.env.NODE_ENV == 'test' ? 'error'
                                                    : 'info';
const logger = new (winston.Logger) ({
  transports: [
    new (winston.transports.Console)({ level: loggingLevel })
  ]
});

exports = module.exports = {
  logger: logger
}
