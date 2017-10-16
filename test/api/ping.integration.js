// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-datetime'));

const dbDriver = require('../../db');

const expect = require('chai').expect;
const request = require('supertest');

let db;

const logger = require('../../util').logger;
const _ = require('underscore');

describe('Ping (integration)', () => {
  before((done) => {
    dbDriver((database) => {
      db = database;
      done();
    });
  });

  const HOST = 'localhost:3030';

  let goodParams;
  let configurationFields;
  let pingFields;

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

    describe('data persistence', ()  => {
      let image =   'image '   + Math.random();
      let vendor =  'vendor '  + Math.random();
      let product = 'product ' + Math.random();
      let release = 'release ' + Math.random();
      let count = Math.floor((Math.random() * 100000) + 1);
      let dualboot = _.sample([undefined, false, true]);

      beforeEach((done) => {
        configurationFields = ['image',
                               'vendor',
                               'product' ];

        pingFields = ['country',
                      'count' ];

        goodParams = { image: image,
                       vendor: vendor,
                       product: product,
                       release: release,
                       count: count,
                       dualboot: dualboot };

        db.Ping().sync({ force : true }).then(() => {
          db.Configuration.sync({ force : true }).then(() => {
            done();
          });
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

              db.Configuration.findAndCountAll().then((configurations) => {
                expect(configurations.count).to.equal(1);
                const configuration = configurations.rows[0];

                expect(configuration).to.have.property('createdAt');
                expect(configuration).to.have.property('updatedAt');
                expect(isExpectedDate(new Date(configuration.createdAt))).to.equal(true);
                expect(isExpectedDate(new Date(configuration.updatedAt))).to.equal(true);

                expect(configuration).to.have.property('image');
                expect(configuration).to.have.property('vendor');
                expect(configuration).to.have.property('product');
                for (let prop in configurationFields) {
                  expect(configuration[prop]).to.eql(goodParams[prop]);
                }
                if (dualboot) {
                  expect(configuration.dualboot).to.eql(dualboot);
                } else {
                  expect(configuration).not.to.have.property('dualboot')
                }

                db.Ping().findAndCountAll().then((result) => {
                  expect(result.count).to.equal(1);

                  const pingRecord = result.rows[0];

                  expect(pingRecord).to.have.property('createdAt');
                  expect(pingRecord).to.have.property('updatedAt');
                  expect(pingRecord).to.have.property('count');
                  expect(pingRecord).to.have.property('country');
                  expect(pingRecord).to.have.property('release');
                  expect(pingRecord).to.have.property('config_id');

                  expect(pingRecord.country).to.equal('USA');
                  expect(pingRecord.count).to.equal(count);
                  expect(pingRecord.config_id).to.eql(configuration._id);
                  expect(isExpectedDate(new Date(pingRecord.createdAt))).to.equal(true);
                  expect(isExpectedDate(new Date(pingRecord.updatedAt))).to.equal(true);

                  expect(pingRecord).not.to.have.property('metrics_enabled');
                  expect(pingRecord).not.to.have.property('metrics_environment');

                  done();
                })
                .catch((err) => {
                  done(err);
                });
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

              db.Ping().findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);
                expect(result.rows[0].country).to.eql('USA');

                done();
              })
              .catch((err) => {
                done(err);
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
             db.Ping().findAndCountAll()
               .then((result) => {
                 expect(result.count).to.equal(2);
                 expect(result.rows[0].count).to.eql(count);
                 expect(result.rows[1].count).to.eql(count);

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

              db.Configuration.findAndCountAll().then((configurations) => {
                expect(configurations.count).to.equal(1);
                const configuration = configurations.rows[0];

                expect(configuration).to.have.property('createdAt');
                expect(configuration).to.have.property('updatedAt');
                expect(isExpectedDate(new Date(configuration.createdAt))).to.equal(true);
                expect(isExpectedDate(new Date(configuration.updatedAt))).to.equal(true);

                db.Ping().findAndCountAll().then((result) => {
                  expect(result.count).to.equal(1);

                  const pingRecord = result.rows[0];

                  expect(pingRecord).to.have.property('createdAt');
                  expect(pingRecord).to.have.property('updatedAt');

                  expect(isExpectedDate(new Date(pingRecord.createdAt))).to.equal(true);
                  expect(isExpectedDate(new Date(pingRecord.updatedAt))).to.equal(true);

                  done();
                })
                .catch((err) => {
                  done(err);
                });
              }).catch((err) => {
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

              db.Ping().findAndCountAll().then((result) => {
                expect(result.count).to.equal(1);
                expect(result.rows[0].metrics_enabled).to.eql(true);
                expect(result.rows[0].metrics_environment).to.eql("production");

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
