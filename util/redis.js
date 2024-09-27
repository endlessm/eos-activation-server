// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

const Redis = require('ioredis');

const config = require('../config');

exports = module.exports = {
  redisHost: config.redis_host,
  redisPort: config.redis_port,
  redisPassword: config.redis_password,
  getRedis: (callback) => {
    const redis = new Redis({
      host: config.redis_host,
      port: config.redis_port,
      password: config.redis_password,
      reconnectOnError(err) {
        /* Reconnect when ElastiCache has promoted some other node to primary & 
         * demoted the node we are connected to a replica.
         * https://github.com/redis/ioredis/blob/main/README.md#reconnect-on-error
         */
        var targetError = 'READONLY';
        if (err.message.slice(0, targetError.length) === targetError) {
          config.logger.info(`Reconnecting due to error: ${err.message}`);
          /* Possible return values:
           * - 0: don't reconnect
           * - 1 or true: reconnect
           * - 2: reconnect, and then resend the failed command
           * Returning 2 is appealing but if, after reconnecting, the resent
           * command fails with READONLY, then we will loop; and unlike in the
           * case of a connection error, there is no backoff between
           * reconnection attempts.
           *
           * The client (eos-phone-home) will retry failed requests on its next
           * run (typically after 3 hours or after a network change) so it is
           * not imperative to retry on the server.
           */
          return 2;
        }
      },
    });

    callback(redis);
  },
};
