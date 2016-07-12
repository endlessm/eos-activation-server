'use strict';

var express = require('express');
var winston = require('winston');

var app = express();

var LOGGING_LEVEL = 'debug';
var HTTP_PORT = process.env.HTTP_PORT || 3000;

// If we crash hard, we want to know why
process.on('uncaughtException', function (err) {
  winston.error(err.stack)
  process.exit(1)
})

// We don't want to leak info out about our infrastructure
app.disable('x-powered-by');

app.get('/activate', function (req, res) {
  res.json({
    success: true
  });
});

winston.info('Server starting on port ' + HTTP_PORT + '...');

app.listen(HTTP_PORT, function () {
  winston.info('Server started');
});
