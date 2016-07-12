'use strict';

var Express = require('express');

var app = Express();

var HTTP_PORT = 8080;

app.get('/activate', function (req, res) {
  res.send('OK');
});

console.log('Server starting on port ' + HTTP_PORT + '...');

app.listen(HTTP_PORT, function () {
  console.log('Server started');
});
