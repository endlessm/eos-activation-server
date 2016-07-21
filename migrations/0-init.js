'use strict';

const db = require('../db');

module.exports = {
  up: function (queryInterface, Sequelize, done()) {
    db.sync()
      .then({
        done();
      });
  },

  down: function (queryInterface, Sequelize) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  }
};
