// vim ts=2 sw=2 expandtab
'use strict';

let bodyParser = require('body-parser');
let config = require('./config');
let express = require('express');

let logger = config.logger;
let app = express();

// We don't want to leak info out about our infrastructure
app.disable('x-powered-by');

// Parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.put('/v1/activate', (req, res) => {
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

logger.info('Server starting on port ' + config.server_port + '...');
app.listen(config.server_port, () => {
  logger.info('Server started');
});
