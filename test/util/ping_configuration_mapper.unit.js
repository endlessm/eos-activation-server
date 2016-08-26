// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = require('chai').expect;

const logger = require('../../util').logger;

let db;
let goodRecord;

describe('ping_configuration_mapper (unit)', () => {
  before((done) => {
    goodRecord = { image: 'image',
                   vendor: 'vendor',
                   product: 'product',
                   release: 'release',
                   country: 'foo',
                   count: 100 };
    done();
  });

  const testClass = require('../../util/ping_configuration_mapper');

  const testMapper = (record, returnVal, done, testCallback) => {
    db = {};
    db.Configuration = {};

    db.Configuration.upsert = (config) => {
      return new Promise((fulfill, reject) => {
        if (returnVal === undefined) {
          fulfill(config);
        } else {
          fulfill(returnVal);
        }
      });
    }

    testClass.getIdFor(db, record).then((config_id) => {
      testCallback(config_id);
      done();
    })
    .catch(done);
  };

  it('stores/retrieves the correct id', (done)  => {
    testMapper(goodRecord, "abc", done, (config) => {
      expect(config).to.be.equal("abc");
    });
  });

  it('doesn\'t store count', (done)  => {
    testMapper(goodRecord, undefined, done, (config) => {
      expect(config).to.not.have.property('count');
    });
  });

  it('doesn\'t store country', (done) => {
    testMapper(goodRecord, undefined, done, (config) => {
      expect(config).to.not.have.property('country');
    });
  });

  it('doesn\'t store release', (done) => {
    testMapper(goodRecord, undefined, done, (config) => {
      expect(config).to.not.have.property('release');
    });
  });

  it('stores product field', (done) => {
    testMapper(goodRecord, undefined, done, (config) => {
      expect(config).to.have.property('product');
      expect(config.product).to.be.equal('product');
    });
  });

  it('stores vendor field', (done) => {
    testMapper(goodRecord, undefined, done, (config) => {
      expect(config).to.have.property('vendor');
      expect(config.vendor).to.be.equal('vendor');
    });
  });

  it('stores image field', (done) => {
    testMapper(goodRecord, undefined, done, (config) => {
      expect(config).to.have.property('image');
      expect(config.image).to.be.equal('image');
    });
  });
});
