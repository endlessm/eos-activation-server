// vim: ts=2 sw=2 expandtab
'use strict';

const countries = require("i18n-iso-countries");
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

  const handleError = (res, err) => {
    logger.error(err);

    res.status(500)
       .json({ error: err.toString(),
               success: false });

    throw err;
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
        handleError(res, err);
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
          logger.info('Geo: ' + geoLookup);

          // Store 3-letter code vs 2-letter one
          ping.country = countries.alpha2ToAlpha3(geoLookup.country);
        }

        ping.createdAt = new Date().toISOString();
        ping.updatedAt = new Date().toISOString();

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
