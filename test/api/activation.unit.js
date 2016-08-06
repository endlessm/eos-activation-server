// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

const logger = require('../../util').logger;

describe('Activation (unit)', () => {
  const testClass = require('../../api/activation');

  let goodParams;

  const errorHandler = (err) => {
    if (err) {
      logger.error("---------------");
      logger.error(err);
      logger.error("---------------");
    }
  };

  const isExpectedDate = (dateString) => {
    var savedDate = new Date(dateString);
    return Math.abs(savedDate - new Date()) < 1000;
  };

  const getHandler = (options) => {
    let handler;
    let hook;

    let mockRouter = {
      routes: {},
      put: (endpoint, func) => {
        handler = func;
      }
    }

    if (options && options.hook) {
      logger.debug("Attaching test hook to activation class");
      hook = options.hook;
    }

    const testInstance = testClass(mockRouter, logger, hook);

    // Sanity check
    expect(handler).to.be.not.equal(undefined);

    return handler;
  }

  const invokeHandler = (type, value, options) => {

    const promise = new Promise((resolve, reject) => {
      logger.debug('Handler options:', options);
      const handler = getHandler(options);

      let req = {};
      let res = {};

      let formats;

      res.format = (formatSpec) => {
        logger.debug('Format spec set');
        formats = formatSpec;
      }

      res.status = (statusCode) => {
        logger.debug('API set status code to', statusCode);
        return { json: (json) => {
                   logger.debug('API returning', json);
                   resolve({ status: statusCode,
                             body: json });
                 },
                 send: (data) => {
                   logger.debug('API returning', data);
                   resolve({ status: statusCode,
                             body: data });
                 }
        }
      }

      req.body = value;
      req.headers = {};

      if (options && options.ip) {
        req.ip = options.ip;
      }

      handler(req, res);

      expect(formats).to.be.not.equal(undefined);

      logger.debug('Invoking type handler');

      const typeHandler = formats[type];
      logger.debug('Type handler', typeHandler);
      typeHandler();

      logger.debug('Waiting for async resolution');
    });

    return promise;
  }

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

        const testInstance = testClass(mockRouter, logger);
      });
    });

    describe('content type', ()  => {
      it('of json is accepted', (done) => {
        invokeHandler('application/json', goodParams).then((response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);

          done();
        });
      });

      it('of bad json is not accepted', (done) => {
        invokeHandler('application/json', "testing").then((response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);

          done();
        });
      });

      it('of something else is rejected', (done) => {
        invokeHandler('default', goodParams).then((response) => {
          expect(response.body).to.be.eql('Not Acceptable');
          expect(response.status).to.be.equal(406);

          done();
        });
      });
    });

    describe('parameter test', ()  => {
      it('should not fail if full params are good', (done) => {
        invokeHandler('application/json', goodParams).then((response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);

          done();
        });
      });

      it('should fail if image name is not included', (done) => {
        delete goodParams.image;

        invokeHandler('application/json', goodParams).then((response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);

          done();
        });
      });

      it('should fail if vendor name is not included', (done) => {
        delete goodParams.vendor;

        invokeHandler('application/json', goodParams).then((response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);

          done();
        });
      });

      it('should fail if product name is not included', (done) => {
        delete goodParams.product;

        invokeHandler('application/json', goodParams).then((response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);

          done();
        });
      });

      it('should fail if release name is not included', (done) => {
        delete goodParams.release;

        invokeHandler('application/json', goodParams).then((response) => {
          expect(response.body.success).to.be.eql(false);
          expect(response.status).to.be.equal(400);

          done();
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

        invokeHandler('application/json', goodParams, { hook: hook }).then((response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);
        });
      });

      it('aren\'t invoked when data is bad', (done) => {
        delete goodParams.image;
        let hook = (record) => {
          done(new Error('Should not have gotten here'));
        }

        invokeHandler('application/json', goodParams, { hook: hook }).then((response) => {
          // Sanity check
          expect(response.body.success).to.not.be.eql(true);

          done();
        });
      });
    });

    describe('geolocation', ()  => {
      it('should not fail if geolocation is unknown', (done) => {
        invokeHandler('application/json', goodParams, { ip: '127.0.0.1' }).then((response) => {
          expect(response.body.success).to.be.eql(true);
          expect(response.status).to.be.equal(200);

          done();
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
