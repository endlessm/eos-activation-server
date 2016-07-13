// vim ts=2 sw=2 expandtab
'use strict';

let express = require('express');
let router = express.Router();

let activation = (router, logger) => {
  router.put('/v1/activate', (req, res) => {
    res.format({
      'application/json': () => {
        let success = true;
        let statusCode = 200;

        let ip = req.ip; //TODO: req.ips

        for (let checkedParam of ['image', 'vendor', 'product', 'release', 'live']) {
          if (!req.body[checkedParam]) {
            logger.warn("Parameter \'" + checkedParam + "\' not provided!");
            success = false;
            statusCode = 400;
          }
        }

        res.status(statusCode)
           .json({
               success: success
           });
      },

      'default': function() {
        logger.warn("Got request for non-JSON type");
        res.status(406).send('Not Acceptable');
      }
    });
  });

  return router;
}

exports = module.exports = activation;

//export default activation;
