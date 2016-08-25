// vim: ts=2 sw=2 expandtab
'use strict';

const _ = require('underscore');

const logger = require('../util').logger;

const IGNORED_FIELDS = [ 'count',
                         'release' ];

const getIdFor = (db, record) => {
  var configuration = _.clone(record);
  for (var fieldName of IGNORED_FIELDS) {
    delete configuration[fieldName];
  }

  logger.silly("Trying to find config id for", configuration);

  return db.Configuration.upsert(configuration);
}

exports = module.exports = {
  getIdFor: getIdFor
}
