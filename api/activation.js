// vim ts=2 sw=2 expandtab
'use strict';

const express = require('express');
const geoip = require('geoip-lite');

const Validator = require('jsonschema').Validator;

const activation = (router, logger) => {
  const validator = new Validator();

  const activation_schema = {
    'type': 'object',
    'properties': {
      'image': { 'type': 'string' },
      'vendor': { 'type': 'string' },
      'product': { 'type': 'string' },
      'serial': { 'type': 'string' },
      'release': { 'type': 'string' },
      'live': { 'type': 'boolean' }
    },
    'required': ['image', 'vendor', 'product', 'release']
  }

  router.put('/v1/activate', (req, res) => {
    res.format({
      'application/json': () => {
        let success = true;
        let statusCode = 200;

        // Validate things
        const validationResult = validator.validate(req.body, activation_schema)
        if (validationResult.errors.length > 0) {
          logger.warn("Request failed schema validation!");
          for (let errorMesage of validationResult.errors) {
            logger.debug(" - " + errorMesage);
          }

          success = false;
          statusCode = 400;
        }

        // Get geolocation
        const ip = req.ip; //TODO: req.ips
        logger.warn(geoip.lookup(ip));

        res.status(statusCode)
           .json({ success: success });
      },

      'default': () => {
        logger.warn("Got request for non-JSON type");
        res.status(406).send('Not Acceptable');
      }
    });
  });

  return router;
}

exports = module.exports = activation;
