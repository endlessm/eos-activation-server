// vim: ts=2 sw=2 expandtab
'use strict';

const _ = require('underscore');

const logger = require('../util').logger;

const CONFIG_FIELDS = [ 'country',
                        'vendor',
                        'model',
                        'image',
                        'release' ];

const getIdFor = (db, record) => {

  var configuration = _.clone(record);
  delete configuration.count;

  logger.silly("Trying to find config id for", configuration);

  return db.Configuration.upsert(configuration);
}

exports = module.exports = {
  getIdFor: getIdFor
}
