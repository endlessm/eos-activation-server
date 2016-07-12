'use strict';

var Express = require('express');
var winston = require('winston');

var app = Express();

var LOGGING_LEVEL = 'debug';
var HTTP_PORT = 8080;

app.get('/activate', function (req, res) {
  res.send('OK');
});

winston.info('Server starting on port ' + HTTP_PORT + '...');

app.listen(HTTP_PORT, function () {
  winston.info('Server started');
});
