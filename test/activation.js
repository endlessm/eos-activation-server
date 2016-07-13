var expect = require('chai').expect;
var request = require('supertest');
var winston = require('winston');


describe('Activation', function () {
  var HOST = 'localhost:3030';

  var goodParams;

  var errorHandler = function(err, res) {
    if (err) {
      winston.error("---------------");
      winston.error(res.status);
      winston.error(res.headers);
      winston.error(res.body);
      winston.error("---------------");

      throw err;
    }
  };

  describe('(v1)', function() {
    beforeEach(function (done) {
      goodParams = { image: 'image',
                     vendor: 'vendor',
                     product: 'product',
                     release: 'release',
                     live: true };
      done();
    });

    describe('content type', function() {
      it('of json is accepted', function(done) {
        request(HOST)
          .put('/v1/activate')
          .send(goodParams)
          .set('Accept', 'application/json')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200, done);
      });

      it('of something else is rejected', function(done) {
        request(HOST)
          .put('/v1/activate')
          .set('Accept', 'application/xml')
          .send("foobar")
          .expect(406, done);
      });
    });

    describe('parameter test', function() {
      it('should not fail if params are good', function(done) {
        request(HOST)
          .put('/v1/activate')
          .send(goodParams)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
              errorHandler(err, res);

              expect(res.body).to.have.property('success');
              expect(res.body.success).to.equal(true);

              done();
           });
      });

      it('should fail if image name is not included', function(done) {
        var params = goodParams;
        delete params['image'];

        request(HOST)
          .put('/v1/activate')
          .send(params)
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
              errorHandler(err, res);

              expect(res.body).to.have.property('success');
              expect(res.body.success).to.equal(false);

              done();
           });
      });

      it('should fail if vendor name is not included', function(done) {
        var params = goodParams;
        delete params['vendor'];

        request(HOST)
          .put('/v1/activate')
          .send(params)
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
              errorHandler(err, res);

              expect(res.body).to.have.property('success');
              expect(res.body.success).to.equal(false);

              done();
           });
      });
    });
  });
});
