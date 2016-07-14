// vim: ts=2 sw=2 expandtab
'use strict';

// Mock data
const db = {};
db.Activation = {
  sync: (params) => {
    return {
      then: (func) => { func() }
    };
  },
  findAndCountAll: () => {
    let result = {};
    result.count = 1;
    result.rows = [{
      image: 'image',
      vendor: 'vendor',
      product: 'product',
      serial: 'serial',
      release: 'release',
      live: 'true',
      country: 'country',
      region: 'region',
      city: 'city',
      coordinates: [12.345, 67.890],
    }];

    return {
      then: (func) => { func(result) }
    };
  }
};

exports = module.exports = db;
