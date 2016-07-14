// vim: ts=2 sw=2 expandtab
'use strict';

let expect = require('chai').expect;
let request = require('supertest');
let winston = require('winston');
let db = require('../../db');

describe('Activation', () => {
  const HOST = 'localhost:3030';

  let goodParams;

  const errorHandler = (err, res) => {
    if (err) {
      winston.error("---------------");
      winston.error(res.status);
      winston.error(res.headers);
      winston.error(res.body);
      winston.error("---------------");

      throw err;
    }
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

    describe('data persistence', ()  => {
      beforeEach((done) => {
        db.Activation.sync({ force : true }).then(() => {
          done();
        });
      });

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
                expect(result.rows[0]).to.eql({
                  image: 'image',
                  vendor: 'vendor',
                  product: 'product',
                  serial: 'serial',
                  release: 'release',
                  live: 'true',
                  country: 'country',
                  region: 'region',
                  city: 'city',
                  coordinates: [12.345, 67.890],
                });

                done();
              });
           });
      });

      xit('saves the 3-letter country code instead of the 2-letter one', (done) => {});
      xit('does not create duplicates of same serial', (done) => {});
      xit('does not fail if there\'s no serial', (done) => {});
      xit('stores the record creation date', (done) => {});
    });
  });
});
