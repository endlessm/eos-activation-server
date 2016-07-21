// vim: ts=2 sw=2 expandtab
'use strict';

const countries = require("i18n-iso-countries");
const express = require('express');
const geoip = require('geoip-lite');

const db = require('../db');

const Validator = require('jsonschema').Validator;

const activation = (router, logger) => {
  const validator = new Validator();

  const activation_schema = {
    'type': 'object',
    'properties': {
      'image':   { 'type': 'string' },
      'vendor':  { 'type': 'string' },
      'product': { 'type': 'string' },
      'serial':  { 'type': 'string' },
      'release': { 'type': 'string' },
      'live':    { 'type': 'boolean' }
    },
    'required': ['image',
                 'vendor',
                 'product',
                 'release']
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
        // TODO: req.ips
        const geoLookup = geoip.lookup(req.ip);
        if (geoLookup) {
          logger.info("Geo:");
          logger.info(geoLookup);

          // Store 3-letter code vs 2-letter one since vendor wants it that way
          activation.country = countries.alpha2ToAlpha3(geoLookup.country);
          activation.region = geoLookup.region;
          activation.city = geoLookup.city;

          if (geoLookup.ll) {
            activation.latitude = geoLookup.ll[0];
            activation.longitude = geoLookup.ll[1];
          }
        }

        db.Activation.upsert(activation)
                     .then((activation) => {
          logger.info("Activation saved:");
          logger.info(activation);

          res.status(200)
             .json({ success: true });
        }).catch((err) => {
          logger.error(err);

          res.status(500)
             .json({ error: err.toString(),
                     success: false });

          throw err;
        });
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
