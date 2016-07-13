// vim:ff=unix ts=2 sw=2 expandtab
'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var winston = require('winston');

var app = express();

var LOGGING_LEVEL = 'debug';
var HTTP_PORT = process.env.HTTP_PORT || 3000;

// If we crash hard, we want to know why
process.on('uncaughtException', function (err) {
  logger.error(err.stack)
  process.exit(1)
})

// Set up our logger
var loggingLevel = process.env.NODE_ENV == 'test' ? 'error' : info;
var logger = new (winston.Logger)({
 transports: [
   new (winston.transports.Console)({ level: loggingLevel })
 ]
});

// We don't want to leak info out about our infrastructure
app.disable('x-powered-by');

// Parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.put('/v1/activate', function (req, res) {
  res.format({
    'application/json': function() {
      var success = true;
      var statusCode = 200;

      var ip = req.ip; //TODO: req.ips

      if (!req.body.image) {
        logger.warn("Image parameter not provided!");
        success = false;
        statusCode = 400;
      };

      if (!req.body.vendor) {
        logger.warn("Vendor parameter not provided!");
        success = false;
        statusCode = 400;
      };

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

logger.info('Server starting on port ' + HTTP_PORT + '...');

app.listen(HTTP_PORT, function () {
  logger.info('Server started');
});
