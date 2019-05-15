// vim: ts=2 sw=2 expandtab
'use strict';

const winston = require('winston');

const loggingLevel = process.env.NODE_ENV == 'test' ? 'debug'
                                                    : 'info';
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: loggingLevel,
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp({
          format: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
        }),
        winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`),
      ),
    })
  ]
});

exports = module.exports = {
  logger: logger
}
