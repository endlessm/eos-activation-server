// vim: ts=2 sw=2 expandtab
'use strict';

const expect = require('chai').expect;

const logger = require('../../util').logger;

var helpers = {};

helpers.getHandler = (testClass, db, options) => {
  let handler;

  let mockRouter = {
    routes: {},
    put: (endpoint, func) => {
      handler = func;
    }
  }

  const testInstance = testClass(mockRouter, db, logger);

  // Sanity check
  expect(handler).to.be.not.equal(undefined);

  logger.debug("Handler instantiated");

  return handler;
}

helpers.invokeHandler = (testClass, db, value, options) => {
  const context = this;
  const promise = new Promise((resolve, reject) => {
    logger.debug('Handler options: ' + JSON.stringify(options));
    const handler = helpers.getHandler(testClass, db, options);

    expect(handler).to.be.not.equal(undefined);

    let req = {};
    let res = {};

    let formats;

    res.format = (formatSpec) => {
      logger.debug('Format spec set');
      formats = formatSpec;
    }

    res.status = (statusCode) => {
      logger.debug('API set status code to ' + statusCode);
      return { json: (json) => {
                 logger.debug('API returning ' + JSON.stringify(json));
                 resolve({ status: statusCode,
                           body: json });
               },
               send: (data) => {
                 logger.debug('API returning ' + data);
                 resolve({ status: statusCode,
                           body: data });
               }
      }
    }

    req.body = value;
    req.headers = {};

    if (options && options.ip) {
      req.ip = options.ip;
    }

    handler(req, res);

    expect(formats).to.be.not.equal(undefined);

    logger.debug('Invoking type handler');

    var type = 'application/json';
    if (options && 'type' in options) {
      type = options.type;
      logger.debug('Type handler override: ' + type);
    }

    const typeHandler = formats[type];
    // XXX: Apparently Winston logger invokes the typeHandler here
    //      so we can't print it out without errors.
    // logger.debug('Type handler ' + typeHandler);
    typeHandler();

    logger.debug('Waiting for async resolution');
  });

  return promise;
}

exports = module.exports = helpers;
