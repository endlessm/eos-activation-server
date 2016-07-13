// vim ts=2 sw=2 expandtab
'use strict';

let winston = require('winston');
let bodyParser = require('body-parser');
let express = require('express');

let server_port = process.env.HTTP_PORT || 3000;

// Logger config
let loggingLevel = process.env.NODE_ENV == 'test' ? 'error' : 'info';
let logger = new (winston.Logger)({
 transports: [
   new (winston.transports.Console)({ level: loggingLevel })
 ]
});

// Crash handler
process.on('uncaughtException', function (err) {
  logger.error(err.stack);
  process.exit(1);
})

let app = express();

// We don't want to leak info out about our infrastructure
app.disable('x-powered-by');

// Parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


exports = module.exports = {};

exports.logger = logger;
exports.server_port = server_port;
exports.app = app;
