// vim: ts=2 sw=2 expandtab
'use strict';

const _ = require('underscore');

const logger = require('../util').logger;

const IGNORED_FIELDS = [ 'count',
                         'country',
                         'release' ];

const getIdFor = (db, record) => {
  var configuration = _.clone(record);
  for (var fieldName of IGNORED_FIELDS) {
    delete configuration[fieldName];
  }

  // Old versions of eos-phone-home did not include a 'dualboot' flag. We don't
  // want to spuriously create a new configuration for every old non-dualboot
  // system, so:
  if (configuration['dualboot'] === false) {
    delete configuration['dualboot'];
  }

  logger.silly("Trying to find config id for", configuration);

  return db.Configuration.upsert(configuration);
}

exports = module.exports = {
  getIdFor: getIdFor
}
