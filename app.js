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

app.use(api.router);

logger.info('Server starting on port ' + config.server_port + '...');
app.listen(config.server_port, () => {
  logger.info('Server started');
});
