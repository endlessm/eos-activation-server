// vim ts=2 sw=2 expandtab
'use strict';

let config = require('./config');

let logger = config.logger;
let app = config.app;

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

logger.info('Server starting on port ' + config.server_port + '...');
app.listen(config.server_port, function () {
  logger.info('Server started');
});
