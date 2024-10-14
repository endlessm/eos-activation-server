// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

import bodyParser from 'body-parser';
import express from 'express'

import * as api from './api/index.js';
import config from './config/index.js';

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
  logger.error(`while handling ${req.method} ${req.url}: ${err}`);

  if (res.headersSent) {
    return next(err);
  }

  let errorMessage = "Server error";
  if (process.env.NODE_ENV == 'test') {
    errorMessage = err.stack;
  }

  res.status(500)
     .json({ error: errorMessage,
             success: false });
});

logger.info('Server starting on ' +
             config.server_bind_address + ':' + config.server_port + '...');

app.listen(config.server_port, config.server_bind_address, () => {
  logger.info('Server started (' + process.env.NODE_ENV + ')');
});
