// vim ts=2 sw=2 expandtab
'use strict';

let bodyParser = require('body-parser');
let express = require('express');
let winston = require('winston');

let app = express();

let LOGGING_LEVEL = 'debug';
let HTTP_PORT = process.env.HTTP_PORT || 3000;

// Set up our logger
let loggingLevel = process.env.NODE_ENV == 'test' ? 'error' : 'info';
let logger = new (winston.Logger)({
 transports: [
   new (winston.transports.Console)({ level: loggingLevel })
 ]
});

// If we crash hard, we want to know why
process.on('uncaughtException', function (err) {
  logger.error(err.stack)
  process.exit(1)
})

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

logger.info('Server starting on port ' + HTTP_PORT + '...');

app.listen(HTTP_PORT, function () {
  logger.info('Server started');
});
