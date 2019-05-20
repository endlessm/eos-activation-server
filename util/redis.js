// vim: ts=2 sw=2 expandtab
'use strict';

const Redis = require('ioredis');

const redisHost = '172.17.0.1';
const redisPort = 6379;
const redisPassword = '';

exports = module.exports = {
  redisHost,
  redisPort,
  redisPassword,
  getRedis: (callback) => {
    const redis = new Redis({
      port: redisPort,
      host: redisHost,
      password: redisPassword,
    });

    callback(redis);
  },
};
