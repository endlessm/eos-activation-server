// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

// Overridable on import of this module
let redis;

const health = (router, logger) => {
  router.get('/health', (req, res) => {
    redis.incr('healthy').then(() => {
      res.status(200)
         .json({ status: 'ok' });
    }).catch((err) => {
      res.status(500)
         .json({ status: 'unhealthy',
                 error: err.toString() });
    });
  });

  return router;
}

export default (router, redisClient, logger) => {
  redis = redisClient;

  return health(router, logger);
};
