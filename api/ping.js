// vim: ts=2 sw=2 expandtab
'use strict';

const countries = require("i18n-iso-countries");
const express = require('express');
const geoip = require('geoip-lite');
const pingConfigurationMapper = require('../util/ping_configuration_mapper');

// Overridable on import of this module
let db;

const Validator = require('jsonschema').Validator;

const ping = (router, logger) => {
  const validator = new Validator();

  const ping_schema = {
    'type': 'object',
    'properties': {
      'image':               { 'type': 'string' },
      'vendor':              { 'type': 'string' },
      'product':             { 'type': 'string' },
      'release':             { 'type': 'string' },
      'count':               { 'type': 'integer',
                               'minimum': 0 },
      'dualboot':            { 'type': 'boolean' },
      'metrics_enabled':     { 'type': 'boolean' },
      'metrics_environment': { 'type': 'string' },
    },
    'required': ['image',
                 'vendor',
                 'product',
                 'release',
                 'count']
  }

  const handleError = (res, err) => {
    logger.error(err);

    res.status(500)
       .json({ error: err.toString(),
               success: false });

    throw err;
  }

  const insertPingRecord = (res, record) => {
    logger.info('Ping attempt:', record);

    // XXX: Passing in DB isn't the best but we don't want to init
    //      it each time out config manager is invoked and doing
    //      this in other async ways would be pretty tricky.
    pingConfigurationMapper.getIdFor(db, record).then((config_id) => {
      logger.debug('Configuration id:', config_id.toString());
      var pingRecord = {};
      // TODO: Increment total ping count

      pingRecord.config_id = config_id;
      pingRecord.country = record.country;
      pingRecord.count = record.count;
      pingRecord.release = record.release;
      pingRecord.dualboot = record.dualboot;

      if (record.metrics_enabled !== undefined) {
        pingRecord.metrics_enabled = record.metrics_enabled;
      }
      if (record.metrics_environment !== undefined) {
        pingRecord.metrics_environment = record.metrics_environment;
      }

      // XXX: NoSQL-only method for now
      db.Ping().create(pingRecord)
               .then((result) => {
        logger.info('Ping saved:', JSON.stringify(pingRecord));

        res.status(200)
           .json({ success: true });
      }).catch((err) => {
        handleError(res, err);
      });
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
          logger.warn("Data:", req.data);

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
          logger.info('Geo:', geoLookup);

          // Store 3-letter code vs 2-letter one
          ping.country = countries.alpha2ToAlpha3(geoLookup.country);
        }

        insertPingRecord(res, ping);
      },

      'default': () => {
        logger.warn("Got request for non-JSON type");
        res.status(406).send('Not Acceptable');
      }
    });
  });

  return router;
}

exports = module.exports = (router, database, logger) => {
  db = database;

  return ping(router, logger);
};
