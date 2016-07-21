// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185

process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-datetime'));

const expect = require('chai').expect;
const request = require('supertest');
const winston = require('winston');

const db = require('../../db');

describe('Activation', () => {
  const HOST = 'localhost:3030';

  let goodParams;

  const errorHandler = (err, res) => {
    if (err) {
      winston.error("---------------");
      winston.error(err);
      winston.error(res);
      winston.error(res.status);
      winston.error(res.headers);
      winston.error(res.body);
      winston.error("---------------");

      throw err;
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

    describe('content type', ()  => {
      it('of json is accepted', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('Accept', 'application/json')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200, done);
      });

      it('of bad json is not accepted', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('Accept', 'application/json')
          .send("bacd")
          .expect('Content-Type', /json/)
          .expect(400, done);
      });

      it('of something else is rejected', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('Accept', 'application/xml')
          .send("foobar")
          .expect(406, done);
      });
    });

    describe('parameter test', ()  => {
      it('should not fail if full params are good', (done) => {
        request(HOST)
          .put('/v1/activate')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body).to.have.property('success');
              expect(res.body.success).to.equal(true);

              done();
           });
      });

      const parameterTest = (done, missingParam) => {
        let params = goodParams;
        delete params[missingParam];

        request(HOST)
          .put('/v1/activate')
          .send(params)
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, res)  => {
              errorHandler(err, res);

              expect(res.body).to.have.property('success');
              expect(res.body.success).to.equal(false);

              expect(res.body).to.have.property('error');
              expect(res.body.error).to.equal('Request failed schema validation');

              done();
           });
      }

      it('should fail if image name is not included', (done) => {
        parameterTest(done, 'image');
      });

      it('should fail if vendor name is not included', (done) => {
        parameterTest(done, 'vendor');
      });

      it('should fail if product name is not included', (done) => {
        parameterTest(done, 'product');
      });

      it('should fail if release name is not included', (done) => {
        parameterTest(done, 'release');
      });
    });

    describe('geolocation', ()  => {
      it('should not fail if geolocation is unknown', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('X-Forwarded-For', '127.0.0.1')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body).to.have.property('success');
              expect(res.body.success).to.equal(true);

              done();
           });
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

      it('saves correct data in the database', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              db.Activation.findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);

                const activationRecord = result.rows[0];
                for (let prop in goodParams) {
                  expect(activationRecord[prop]).to.eql(goodParams[prop]);
                }

                expect(activationRecord).to.have.property('createdAt');
                expect(activationRecord).to.have.property('updatedAt');
                expect(activationRecord).to.have.property('country');
                expect(activationRecord).to.have.property('region');
                expect(activationRecord).to.have.property('city');
                expect(activationRecord).to.have.property('latitude');
                expect(activationRecord).to.have.property('longitude');

                expect(isExpectedDate(new Date(activationRecord.createdAt))).to.equal(true);
                expect(isExpectedDate(new Date(activationRecord.updatedAt))).to.equal(true);
                expect(activationRecord.country).to.equal('USA');
                expect(activationRecord.region).to.equal('CA');
                expect(activationRecord.city).to.equal('San Francisco');
                expect(activationRecord.latitude).to.eql(37.7758);
                expect(activationRecord.longitude).to.eql(-122.4128);

                done();
              });
           });
      });

      it('saves the 3-letter country code instead of the 2-letter one', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              db.Activation.findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);
                expect(result.rows[0].country).to.eql('USA');

                done();
              });
           });
      });

      xit('does not create duplicates of same serial', (done) => {});

      it('does not fail if there\'s no serial', (done) => {
        delete goodParams.serial;
        expect(goodParams).to.not.have.property('serial');

        request(HOST)
          .put('/v1/activate')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              db.Activation.findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);

                for (let prop in goodParams) {
                  expect(result.rows[0][prop]).to.eql(goodParams[prop]);
                }

                expect(res.body).to.not.have.property('serial');

                done();
              });
           });
      });

      it('stores the record creation date', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              db.Activation.findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);

                for (let prop in goodParams) {
                  expect(result.rows[0][prop]).to.eql(goodParams[prop]);
                }

                var timeAfterRequest = new Date();
                timeAfterRequest.setMinutes(timeAfterRequest.getMinutes() + 1);

                expect(result.rows[0]).to.have.property('createdAt');
                expect(result.rows[0]).to.have.property('updatedAt');

                expect(isExpectedDate(new Date(result.rows[0].createdAt))).to.equal(true);
                expect(isExpectedDate(new Date(result.rows[0].updatedAt))).to.equal(true);

                done();
              });
           });
      });
    });
  });
});
