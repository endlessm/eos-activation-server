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
    });

    callback(redis);
  },
};
