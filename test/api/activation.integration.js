// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-datetime'));

const expect = require('chai').expect;
const request = require('supertest');

const redisBackend = require('../../util/redis').getRedis;

const logger = require('../../util').logger;

let redis;

describe('Activation (integration)', () => {
  before((done) => {
    redisBackend((redisClient) => {
      redis = redisClient;
      done();
    });
  });

  const HOST = 'localhost:3000';

  let goodParams;

  const errorHandler = (err, res) => {
    if (err) {
      logger.error("---------------");
      logger.error(err);

      if (res) {
        logger.error(res.status);
        logger.error(JSON.stringify(res.headers));
        logger.error(JSON.stringify(res.body));
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
      // 1/3 chance each for live, dualboot, normal
      let nature = Math.random();
      let live = nature < 0.33;
      let dualboot = nature > 0.67;
      let mac_hash = Math.floor(Math.random() * Math.pow(2, 32));

      beforeEach((done) => {
        goodParams = { image: image,
                       vendor: vendor,
                       product: product,
                       release: release,
                       serial: serial,
                       live: live,
                       dualboot: dualboot,
                       mac_hash: mac_hash };

        redis.del('activation-1').then(() => {
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

              logger.error("Finding matching records...");
              redis.lrange('activation-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);

                const record = JSON.parse(result[0]);
                for (let prop in goodParams) {
                  expect(record[prop]).to.eql(goodParams[prop]);
                }

                expect(record).to.have.property('created_at');
                expect(record).to.have.property('country');
                expect(record).to.have.property('region');
                expect(record).to.have.property('city');
                expect(record).to.have.property('latitude');
                expect(record).to.have.property('longitude');

                expect(isExpectedDate(new Date(record.created_at))).to.equal(true);
                expect(record.country).to.equal('US');
                expect(record.region).to.equal('CA');
                expect(record.city).to.equal('San Francisco');
                expect(record.latitude).to.be.within(36, 38);
                expect(record.longitude).to.be.within(-123, -121);

                done();
              }).catch((err) => {
                done(err);
              });
           });
      });

      it('handles duplicate submissions', (done) => {
        request(HOST)
          .put('/v1/activate')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
             expect(res.body.success).to.equal(true);

             return request(HOST)
               .put('/v1/activate')
               .set('X-Forwarded-For', '204.28.125.53')
               .send(goodParams)
               .expect('Content-Type', /json/)
               .expect(200);
          })
          .then((res) => {
             redis.lrange('activation-1', 0, -1)
               .then((result) => {
                 expect(result.length).to.equal(2);

                 for (let i = 0; i < result.length; i++) {
                   const record = JSON.parse(result[i]);
                   expect(record.serial).to.eql(serial);
                   expect(record.mac_hash).to.eql(mac_hash);
                 }

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

      it("does not fail if there's no serial", (done) => {
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

              redis.lrange('activation-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);
                const record = JSON.parse(result[0]);

                for (let prop in goodParams) {
                  expect(record[prop]).to.eql(goodParams[prop]);
                }

                expect(res.body).to.not.have.property('serial');

                done();
              });
           });
      });

      it("does not fail if there's no mac_hash", (done) => {
        delete goodParams.mac_hash;
        expect(goodParams).to.not.have.property('mac_hash');

        request(HOST)
          .put('/v1/activate')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              redis.lrange('activation-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);
                const record = JSON.parse(result[0]);

                for (let prop in goodParams) {
                  expect(record[prop]).to.eql(goodParams[prop]);
                }

                expect(res.body).to.not.have.property('mac_hash');

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

              redis.lrange('activation-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);
                const record = JSON.parse(result[0]);

                for (let prop in goodParams) {
                  expect(record[prop]).to.eql(goodParams[prop]);
                }

                var timeAfterRequest = new Date();
                timeAfterRequest.setMinutes(timeAfterRequest.getMinutes() + 1);

                expect(record).to.have.property('created_at');

                expect(isExpectedDate(new Date(record.created_at))).to.equal(true);

                done();
              });
           });
      });
    });
  });
});
