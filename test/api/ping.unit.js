// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = require('chai').expect;

const redisBackend = require('../../util/redis').getRedis;

const logger = require('../../util').logger;

const helpers = require('../util/unit_test_helpers');

let redis;

describe('Ping (unit)', () => {
  before((done) => {
    redisBackend((redisClient) => {
      redis = redisClient;
      done();
    });
  });

  const testClass = require('../../api/ping');

  let goodParams;

  const testHandler = (params, options, done, testCallback) => {
    helpers.invokeHandler(testClass, redis, params, options).then((response) => {
      testCallback(response);

      done();
    })
    .catch(done);
  };

  describe('(v1)', () => {
    beforeEach((done) => {
      goodParams = { image: 'image',
                     vendor: 'vendor',
                     product: 'product',
                     release: 'release',
                     count: 100 };
      done();
    });

    describe('routing', ()  => {
      it('adds the ping route', (done) => {
        let mockRouter = {
          routes: {},
          put: (endpoint, func) => {
            expect(endpoint).to.be.equal('/v1/ping');
            done();
          }
        }

        const testInstance = testClass(mockRouter, redis, logger);
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
        testHandler("testing", undefined, done, (response) => {
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

      it('should not fail if dualboot flag is false', (done) => {
        goodParams.dualboot = false;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should not fail if dualboot flag is true', (done) => {
        goodParams.dualboot = true;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should not fail if metrics are enabled', (done) => {
        goodParams.metrics_enabled = true;
        goodParams.metrics_environment = 'production';

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should not fail if metrics are disabled', (done) => {
        goodParams.metrics_enabled = false;
        goodParams.metrics_environment = 'production';

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should not fail if metrics environment is extraordinary', (done) => {
        goodParams.metrics_enabled = true;
        goodParams.metrics_environment = 'extraordinary';

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

      it('should not fail if count is not included', (done) => {
        delete goodParams.count;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('should fail if metrics_enabled is a non-boolean', (done) => {
        goodParams.metrics_enabled = 'true';

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
        });
      });

      it('should fail if metrics_enabled is a non-string', (done) => {
        goodParams.metrics_environment = 42;

        testHandler(goodParams, undefined, done, (response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);
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
  });
});
