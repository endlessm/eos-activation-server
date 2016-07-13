// vim ts=2 sw=2 expandtab
'use strict';

let express = require('express');

let config = require('../config');

let activation = require('./activation');

let router = express.Router();
router = activation(router, config.logger);

exports = module.exports = {
  router: router
};
