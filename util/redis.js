// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

import Redis from 'ioredis';

import config from '../config/index.js';

export function getRedis(callback) {
  /* ioredis uses tls.connect() if the tls option is set, and passes it as
   * additional options to tls.connect().
   */
  let tls = config.redis_tls ? {} : undefined;

  const redis = new Redis({
    host: config.redis_host,
    port: config.redis_port,
    password: config.redis_password,
    tls,
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
        return 1;
      }
    },
  });

  redis.on('connect', () => {
    config.logger.info('Connected to Redis server');
  });
  redis.on('ready', () => {
    config.logger.info('Redis connection ready');
  });
  redis.on('reconnecting', (delay) => {
    config.logger.info(`Reconnecting to ${config.redis_host}:${config.redis_port} in ${delay} ms`);
  });
  redis.on('close', () => {
    config.logger.info('Disconnected from Redis server');
  });
  redis.on('error', (err) => {
    config.logger.error('Error connecting to Redis server: ' + err);
  });

  callback(redis);
};
