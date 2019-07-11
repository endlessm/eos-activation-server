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

describe('Ping (integration)', () => {
  before((done) => {
    redisBackend((redisClient) => {
      redis = redisClient;
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

    describe('data persistence', ()  => {
      const image =   'image '   + Math.random();
      const vendor =  'vendor '  + Math.random();
      const product = 'product ' + Math.random();
      const release = 'release ' + Math.random();
      const count = Math.floor((Math.random() * 100000) + 1);
      const dualboot = [undefined, false, true][Math.floor(Math.random() * Math.floor(3))];

      beforeEach((done) => {
        goodParams = { image: image,
                       vendor: vendor,
                       product: product,
                       release: release,
                       dualboot: dualboot };

        redis.del('ping-1').then(() => {
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

              logger.error("Finding matching records...");
              redis.lrange('ping-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);

                const record = JSON.parse(result[0]);
                for (let prop in goodParams) {
                  expect(record[prop]).to.eql(goodParams[prop]);
                }

                expect(record).to.have.property('createdAt');
                expect(record).to.have.property('country');
                expect(record).not.to.have.property('metrics_enabled');
                expect(record).not.to.have.property('metrics_environment');

                expect(isExpectedDate(new Date(record.createdAt))).to.equal(true);
                expect(record.country).to.equal('USA');

                done();
              }).catch((err) => {
                done(err);
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

              redis.lrange('ping-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);

                const record = JSON.parse(result[0]);
                expect(record.country).to.eql('USA');

                done();
              })
              .catch((err) => {
                done(err);
              });
           });
      });

      it('handles duplicate submissions', (done) => {
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
             redis.lrange('ping-1', 0, -1)
               .then((result) => {
                 expect(result.length).to.equal(2);

                 for (let i = 0; i < result.length; i++) {
                   const record = JSON.parse(result[i]);
                   expect(record.release).to.eql(release);
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

              redis.lrange('ping-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);
                const record = JSON.parse(result[0]);

                expect(record).to.have.property('createdAt');
                expect(isExpectedDate(new Date(record.createdAt))).to.equal(true);

                done();
              }).catch((err) => {
                done(err);
              });
           });
      });

      it('stores the count data', (done) => {
        goodParams['count'] = 123;

        request(HOST)
          .put('/v1/ping')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              redis.lrange('ping-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);
                const record = JSON.parse(result[0]);
                expect(record.count).to.eql(123);

                done();
              })
              .catch((err) => {
                done(err);
              });
           });
      });

      it('stores the metrics status', (done) => {
        goodParams['metrics_enabled'] = true;
        goodParams['metrics_environment'] = 'production';

        request(HOST)
          .put('/v1/ping')
          .set('X-Forwarded-For', '204.28.125.53')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
              errorHandler(err, res);

              expect(res.body.success).to.equal(true);

              redis.lrange('ping-1', 0, -1).then((result) => {
                expect(result.length).to.equal(1);
                const record = JSON.parse(result[0]);

                expect(record.metrics_enabled).to.eql(true);
                expect(record.metrics_environment).to.eql("production");

                done();
              })
              .catch((err) => {
                done(err);
              });
           });
      });
    });
  });
});
