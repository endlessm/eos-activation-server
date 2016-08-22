// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-datetime'));

const dbDriver = require('../../db');

const expect = require('chai').expect;
const request = require("supertest-as-promised");

let db;

const logger = require('../../util').logger;

describe('Ping (integration)', () => {
  before((done) => {
    dbDriver((database) => {
      db = database;
      done();
    });
  });

  const HOST = 'localhost:3030';

  let goodParams;

  const errorHandler = (err, res) => {
    if (err) {
      logger.error("---------------");
      logger.error(err);

      if (res) {
        //logger.error(res);
        logger.error(res.status);
        logger.error(res.headers);
        logger.error(res.body);
      }

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
                     count: 123 };
      done();
    });

    describe('content type', ()  => {
      it('of json is accepted', (done) => {
        request(HOST)
          .put('/v1/ping')
          .set('Accept', 'application/json')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200, done);
      });

      it('of bad json is not accepted', (done) => {
        request(HOST)
          .put('/v1/ping')
          .set('Accept', 'application/json')
          .send("bacd")
          .expect('Content-Type', /json/)
          .expect(400, done);
      });

      it('of something else is rejected', (done) => {
        request(HOST)
          .put('/v1/ping')
          .set('Accept', 'application/xml')
          .send("foobar")
          .expect(406, done);
      });
    });

    describe('parameter test', ()  => {
      it('should not fail if full params are good', (done) => {
        request(HOST)
          .put('/v1/ping')
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
          .put('/v1/ping')
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

      it('should fail if count is not included', (done) => {
        parameterTest(done, 'count');
      });
    });

    describe('geolocation', ()  => {
      it('should not fail if geolocation is unknown', (done) => {
        request(HOST)
          .put('/v1/ping')
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

    xdescribe('data persistence', ()  => {
      let image =   'image '   + Math.random();
      let vendor =  'vendor '  + Math.random();
      let product = 'product ' + Math.random();
      let release = 'release ' + Math.random();
      let count = Math.floor((Math.random() * 100000) + 1);

      beforeEach((done) => {
        goodParams = { image: image,
                       vendor: vendor,
                       product: product,
                       release: release,
                       serial: serial,
                       live: live };

        db.Ping.sync({ force : true }).then(() => {
          done();
        });
      });

      it('saves correct data in the database', (done) => {
        request(HOST)
          .put('/v1/ping')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              db.Ping.findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);

                const pingRecord = result.rows[0];
                for (let prop in goodParams) {
                  expect(pingRecord[prop]).to.eql(goodParams[prop]);
                }

                expect(pingRecord).to.have.property('createdAt');
                expect(pingRecord).to.have.property('updatedAt');
                expect(pingRecord).to.have.property('country');
                expect(pingRecord).to.have.property('region');
                expect(pingRecord).to.have.property('city');
                expect(pingRecord).to.have.property('latitude');
                expect(pingRecord).to.have.property('longitude');

                expect(isExpectedDate(new Date(pingRecord.createdAt))).to.equal(true);
                expect(isExpectedDate(new Date(pingRecord.updatedAt))).to.equal(true);
                expect(pingRecord.country).to.equal('USA');
                expect(pingRecord.region).to.equal('CA');
                expect(pingRecord.city).to.equal('San Francisco');
                expect(pingRecord.latitude).to.eql(37.7758);
                expect(pingRecord.longitude).to.eql(-122.4128);

                done();
              });
           });
      });

      it('saves the 3-letter country code instead of the 2-letter one', (done) => {
        request(HOST)
          .put('/v1/ping')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              db.Ping.findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);
                expect(result.rows[0].country).to.eql('USA');

                done();
              });
           });
      });

      it('handles duplicates', (done) => {
        request(HOST)
          .put('/v1/ping')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
             expect(res.body.success).to.equal(true);

             return request(HOST)
               .put('/v1/ping')
               .set('X-Forwarded-For', '204.28.125.53')
               .send(goodParams)
               .expect('Content-Type', /json/)
               .expect(200);
          })
          .then((res) => {
             db.Ping.findAndCountAll()
               .then((result) => {
                 expect(result.count).to.equal(2);
                 expect(result.rows[0].serial).to.eql(serial);
                 expect(result.rows[1].serial).to.eql(serial);

                 done();
               })
               .catch((err) => {
                 errorHandler(err);

                 done(err);
               });
          })
          .catch((err, res) => {
             errorHandler(err, res);
             done(err);
          });
      });

      it('stores the record creation date', (done) => {
        request(HOST)
          .put('/v1/ping')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              db.Ping.findAndCountAll().then((result) => {
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
