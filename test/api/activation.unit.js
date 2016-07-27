// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

const db = require('../../db');
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
    logger.debug('Handler options defined:', options);
    const handler = getHandler(options);

    let req = {};
    let res = {};

    let formats;
    let returnVal;
    let status;

    res.format = (formatSpec) => {
      formats = formatSpec;
    }

    res.status = (statusCode) => {
      status = statusCode;
      return { json: (json) => {
                 returnVal = json;
               },
               send: (data) => {
                 returnVal = data;
               }
      }
    }

    req.body = value;

    if (options && options.ip) {
      req.ip = options.ip;
    }

    handler(req, res);

    expect(formats).to.be.not.equal(undefined);

    const typeHandler = formats[type];
    typeHandler();

    return { status: status,
             body: returnVal };
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
        const response = invokeHandler('application/json', goodParams);

        expect(response.body.success).to.be.eql(true);
        expect(response.status).to.be.equal(200);

        done();
      });

      it('of bad json is not accepted', (done) => {
        const response = invokeHandler('application/json', "sadsasd");

        expect(response.body.success).to.be.eql(false);
        expect(response.status).to.be.equal(400);

        done();
      });

      it('of something else is rejected', (done) => {
        const response = invokeHandler('default', goodParams);

        expect(response.body).to.be.eql('Not Acceptable');
        expect(response.status).to.be.equal(406);

        done();
      });
    });

    describe('parameter test', ()  => {
      it('should not fail if full params are good', (done) => {
        const response = invokeHandler('application/json', goodParams);

        expect(response.body.success).to.be.eql(true);
        expect(response.status).to.be.equal(200);

        done();
      });

      it('should fail if image name is not included', (done) => {
        delete goodParams.image;

        const response = invokeHandler('application/json', goodParams);

        expect(response.body.success).to.be.eql(false);
        expect(response.status).to.be.equal(400);

        done();
      });

      it('should fail if vendor name is not included', (done) => {
        delete goodParams.vendor;

        const response = invokeHandler('application/json', goodParams);

        expect(response.body.success).to.be.eql(false);
        expect(response.status).to.be.equal(400);

        done();
      });

      it('should fail if product name is not included', (done) => {
        delete goodParams.product;

        const response = invokeHandler('application/json', goodParams);

        expect(response.body.success).to.be.eql(false);
        expect(response.status).to.be.equal(400);

        done();
      });

      it('should fail if release name is not included', (done) => {
        delete goodParams.release;

        const response = invokeHandler('application/json', goodParams);

        expect(response.body.success).to.be.eql(false);
        expect(response.status).to.be.equal(400);

        done();
      });

    });

    describe('hooks', () => {
      it('are invoked correctly', (done) => {
        let recordSentToHook;
        let hook = (record) => {
          expect(record).to.be.not.equal(undefined);

          for (let prop in goodParams) {
            expect(record).to.have.property(prop);
            expect(record[prop]).to.be.eql(goodParams[prop]);
          }

          done();
        }

        const response = invokeHandler('application/json', goodParams, { hook: hook });

        // Sanity check
        expect(response.body.success).to.be.eql(true);
        expect(response.status).to.be.equal(200);
      });

      it('aren\'t invoked when data is bad', (done) => {
        delete goodParams.image;

        let recordSentToHook;
        let hook = (record) => {
          throw new Error('Should not have gotten here');
        }

        const response = invokeHandler('application/json', goodParams, { hook: hook });

        // Sanity check
        expect(response.body.success).to.not.be.eql(true);

        done();
      });
    });

    describe('geolocation', ()  => {
      it('should not fail if geolocation is unknown', (done) => {
        const response = invokeHandler('application/json', goodParams, { ip: '127.0.0.1' });

        expect(response.body.success).to.be.eql(true);
        expect(response.status).to.be.equal(200);

        done();
      });
    });

    describe('data persistence', ()  => {
      xit('works', (done) => {
        throw new Error('!! Covered already by integration tests !!');
      });
    });
  });
});
