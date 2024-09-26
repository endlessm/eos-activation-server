// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

import winston from 'winston';

const loggingLevel = process.env.NODE_ENV == 'test' ? 'debug'
                                                    : 'info';
export const logger = winston.createLogger({
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