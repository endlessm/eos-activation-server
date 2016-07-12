var expect = require('chai').expect;
var request = require('supertest');
var winston = require('winston');

var HOST = 'localhost:3030';

describe('Activation', function () {
  before(function (done) {
    done();
  });

  describe('basic test', function() {
    it('should return ok', function(done) {
      request(HOST)
        .get('/activate')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
            if (err) {
              winston.error("---------------");
              winston.error(res.status);
              winston.error(res.headers);
              winston.error(res.body);
              winston.error("---------------");
              throw err;
            }

            expect(res.body).to.have.property('success');
            expect(res.body.success).to.equal(true);

            done();
         });
    });
  });
});
