// vim ts=2 sw=2 expandtab
'use strict';

const express = require('express');

const config = require('../config');

const activation = require('./activation');

const router = express.Router();

// Add all routes here
activation(router, config.logger);

exports = module.exports = {
  router: router
};
