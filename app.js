// vim ts=2 sw=2 expandtab
'use strict';

let bodyParser = require('body-parser');
let express = require('express');

let api = require('./api');
let config = require('./config');

let app = express();
let logger = config.logger;

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
