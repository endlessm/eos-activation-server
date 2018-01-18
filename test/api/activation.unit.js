// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

const dbDriver = require('../../db');

const logger = require('../../util').logger;

const helpers = require('../util/unit_test_helpers');

let db;

describe('Activation (unit)', () => {
  before((done) => {
    dbDriver((database) => {
      db = database;
      done();
    });
  });

  const testClass = require('../../api/activation');

  let goodParams;

  const testHandler = (params, options, done, testCallback) => {
    helpers.invokeHandler(testClass, db, params, options).then((response) => {
      testCallback(response);

      if (options === undefined ||
          options['skip_done'] === undefined ||
          options.skip_done === false) {
        done();
      }
    })
    .catch(done);
  };

  describe('(v1)', () => {
    beforeEach((done) => {
      goodParams = { image: 'image',
                     vendor: 'vendor',
                     product: 'product',
                     release: 'release',
                     live: true };
      done();
    });

    describe('routing', ()  => {
      it('adds the activation route', (done) => {
        let mockRouter = {
          routes: {},
          put: (endpoint, func) => {
            expect(endpoint).to.be.equal('/v1/activate');
            done();
          }
        }

        const testInstance = testClass(mockRouter, db, logger);
      });
    });

    describe('content type', ()  => {
      it('of json is accepted', (done) => {
        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('of bad json is not accepted', (done) => {
        testHandler("{ 'testing': ", undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('of something else is rejected', (done) => {
        testHandler(goodParams, { type: 'default' }, done, (response) => {
          expect(response.body).to.be.eql('Not Acceptable');
          expect(response.status).to.be.equal(406);
        });
      });
    });

    describe('parameter test', ()  => {
      it('should not fail if full params are good', (done) => {
        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should not fail if live param is omitted', (done) => {
        delete goodParams.live;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should not fail if dualboot param is included', (done) => {
        delete goodParams.live;
        goodParams.dualboot = true;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should fail if image name is not included', (done) => {
        delete goodParams.image;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if vendor name is not included', (done) => {
        delete goodParams.vendor;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if product name is not included', (done) => {
        delete goodParams.product;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if release name is not included', (done) => {
        delete goodParams.release;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if mac_hash is string', (done) => {
        goodParams.mac_hash = 'sasquatch';

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if mac_hash is float', (done) => {
        goodParams.mac_hash = 3.14159;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if mac_hash is negative', (done) => {
        goodParams.mac_hash = -1;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if mac_hash is too large', (done) => {
        goodParams.mac_hash = 2 ** 32;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });
    });

    describe('hooks', () => {
      it('are invoked correctly', (done) => {
        let hook = (record) => {
          expect(record).to.be.not.equal(undefined);

          for (let prop in goodParams) {
            expect(record).to.have.property(prop);
            expect(record[prop]).to.be.eql(goodParams[prop]);
          }

          done();
        }

        testHandler(goodParams, { hook: hook , skip_done: true }, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('aren\'t invoked when data is bad', (done) => {
        delete goodParams.image;
        let hook = (record) => {
          done(new Error('Should not have gotten here'));
        }

        testHandler(goodParams, { hook: hook }, done, (response) => {
          // Sanity check
          expect(response.body.success).to.not.be.eql(true);
        });
      });
    });

    describe('geolocation', ()  => {
      it('should not fail if geolocation is unknown', (done) => {
        testHandler(goodParams, { ip: '127.0.0.1' }, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });
    });

    describe('data persistence', ()  => {
      xit('works', (done) => {
        throw new Error('!! Covered already by integration tests !!');
      });
    });
  });
});
