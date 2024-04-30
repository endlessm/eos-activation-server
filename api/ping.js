// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

const express = require('express');
const geoip = require('geoip-lite');
const Validator = require('jsonschema').Validator;

// Overridable on import of this module
let redis;

const ping = (router, logger) => {
  const validator = new Validator();

  const ping_schema = {
    'type': 'object',
    'properties': {
      'image': {
        'type': 'string',
      },
      'vendor': {
        'type': 'string',
      },
      'product': {
        'type': 'string',
      },
      'release': {
        'type': 'string',
      },
      'dualboot': {
        'type': 'boolean',
      },
      'count': {
        'type': 'integer',
        'minimum': 0,
      },
      'metrics_enabled': {
        'type': 'boolean',
      },
      'metrics_environment': {
        'type': 'string',
      },
    },
    'required': [
      'image',
      'vendor',
      'product',
      'release',
    ]
  }

  const insertPingRecord = (res, version, record) => {
    let recordSerialized = JSON.stringify(record);
    logger.info('Ping attempt: ' + recordSerialized);

    redis.lpush(`ping-${version}`, recordSerialized)
                 .then((changed) => {
      logger.info('Ping saved: ' + recordSerialized);

      res.status(200)
         .json({ success: true });
    }).catch((err) => {
      logger.error(err);

      res.status(500)
         .json({ error: err.toString(),
                 success: false });

      throw err;
    });
  }

  router.put('/v1/ping', (req, res) => {
    res.format({
      'application/json': () => {
        let success = true;

        // Validate things
        const validationResult = validator.validate(req.body, ping_schema)
        if (validationResult.errors.length > 0) {
          logger.warn("Request failed schema validation!");

          for (let errorMesage of validationResult.errors) {
            logger.debug(" - " + errorMesage);
          }

          res.status(400)
             .json({ error: "Request failed schema validation",
                     success: false });

          return;
        }

        let ping = req.body;

        // Get geolocation
        // 'X-Real-IP' is provided by NGINX
        const ip = req.headers['X-Real-IP'] || req.ip;

        const geoLookup = geoip.lookup(ip);
        if (geoLookup) {
          ping.country = geoLookup.country;
        }

        ping.created_at = new Date().toISOString();

        // The 1 represents the API version ('/v1/' part of the URL)
        insertPingRecord(res, 1, ping);
      },

      'default': () => {
        logger.warn("Got request for non-JSON type");
        res.status(406).send('Not Acceptable');
      }
    });
  });

  return router;
}

exports = module.exports = (router, redisClient, logger) => {
  redis = redisClient;

  return ping(router, logger);
};
