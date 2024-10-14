// Copyright © 2016-2024 Endless OS Foundation LLC
// SPDX-License-Identifier: GPL-2.0-or-later
// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

import { expect } from 'chai';

import { getRedis as redisBackend } from '../../util/redis.js';

import { logger } from '../../util/index.js';

import * as helpers from '../util/unit_test_helpers.js';

import testClass from '../../api/activation.js';

let redis;

describe('Activation (unit)', () => {
  before((done) => {
    redisBackend((redisClient) => {
      redis = redisClient;
      done();
    });
  });

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
        goodParams.mac_hash = Math.pow(2, 32);

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
