// vim: ts=2 sw=2 expandtab
'use strict';

const bodyParser = require('body-parser');
const express = require('express');

const api = require('./api');
const config = require('./config');

const app = express();
const logger = config.logger;

app.disable('x-powered-by');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// XXX: For tests we need to be able to spoof IPs and
//      for prod/staging we are behind NGINX
app.enable('trust proxy');

app.use(api.router);

// Error handler
app.use((err, req, res, next) => {
  if (err) {
    logger.error(err);

    let errorMessage = "Server error";
    if (process.env.NODE_ENV == 'test') {
      errorMessage = err.toString() + '\n' + err.stack;
    }

    res.status(500)
       .json({ error: errorMessage,
               success: false });
  }
});

logger.info('Server starting on ' +
             config.server_bind_address + ':' + config.server_port + '...');

app.listen(config.server_port, config.server_bind_address, () => {
  logger.info('Server started (' + process.env.NODE_ENV + ')');
});
