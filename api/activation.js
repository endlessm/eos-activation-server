// vim: ts=2 sw=2 expandtab
'use strict';

const express = require('express');
const geoip = require('geoip-lite');
const Validator = require('jsonschema').Validator;

// Overridable on import of this module
let redis;

const activation = (router, logger) => {
  const validator = new Validator();

  const activation_schema = {
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
      'serial': {
        'type': 'string',
      },
      'live': {
        'type': 'boolean',
      },
      'mac_hash': {
        'type': 'integer',
        'minimum': 0,
        'maximum': Math.pow(2, 32) - 1,
      },
    },
    'required': [
      'image',
      'vendor',
      'product',
      'release',
    ]
  }

  const insertActivationRecord = (res, version, record) => {
    let recordSerialized = JSON.stringify(record);
    logger.info('Activation attempt: ' + recordSerialized);

    redis.lpush(`activation-${version}`, recordSerialized)
                 .then((changed) => {
      logger.info('Activation saved: ' + recordSerialized);

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

  router.put('/v1/activate', (req, res) => {
    res.format({
      'application/json': () => {
        let success = true;

        // Validate things
        const validationResult = validator.validate(req.body, activation_schema)
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

        let activation = req.body;

        // Get geolocation
        // 'X-Real-IP' is provided by NGINX
        const ip = req.headers['X-Real-IP'] || req.ip;

        const geoLookup = geoip.lookup(ip);
        if (geoLookup) {
          logger.info('Geo: ' + geoLookup);

          activation.country = geoLookup.country;
          activation.region = geoLookup.region;
          activation.city = geoLookup.city;

          if (geoLookup.ll) {
            activation.latitude = geoLookup.ll[0];
            activation.longitude = geoLookup.ll[1];
          }
        }

        activation.created_at = new Date().toISOString();

        // The 1 represents the API version ('/v1/' part of the URL)
        insertActivationRecord(res, 1, activation);
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
  return activation(router, logger);
};
