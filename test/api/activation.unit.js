// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

const logger = require('winston');

const db = require('../../db');


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
      xit('of json is accepted', (done) => {
        const testInstance = testClass(mockRouter, logger);
        done();
      });

      xit('of bad json is not accepted', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('of something else is rejected', (done) => {
        throw new Error('Finish me');
        done();
      });
    });

    describe('parameter test', ()  => {
      xit('should not fail if full params are good', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('should fail if image name is not included', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('should fail if vendor name is not included', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('should fail if product name is not included', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('should fail if release name is not included', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('calls the expected hooks', (done) => {
        throw new Error('Finish me');
        done();
      });
    });

    describe('geolocation', ()  => {
      xit('should not fail if geolocation is unknown', (done) => {
        throw new Error('Finish me');
        done();
      });
    });

    describe('data persistence', ()  => {
      let image =   'image '   + Math.random();
      let vendor =  'vendor '  + Math.random();
      let product = 'product ' + Math.random();
      let release = 'release ' + Math.random();
      let serial =  'serial '  + Math.random();
      let live = Math.random() > 0.5 ? true : false;

      beforeEach((done) => {
        goodParams = { image: image,
                       vendor: vendor,
                       product: product,
                       release: release,
                       serial: serial,
                       live: live };

        db.Activation.sync({ force : true }).then(() => {
          done();
        });
      });

      xit('saves correct data in the database', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('saves the 3-letter country code instead of the 2-letter one', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('does not create duplicates of same serial', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('does not fail if there\'s no serial', (done) => {
        throw new Error('Finish me');
        done();
      });

      xit('stores the record creation date', (done) => {
        throw new Error('Finish me');
        done();
      });
    });
  });
});
