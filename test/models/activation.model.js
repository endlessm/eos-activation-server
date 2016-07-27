// vim: ts=2 sw=2 expandtab
'use strict';

// XXX: Hack so that we don't require setting of env var on each run
//      Upstream: https://github.com/mochajs/mocha/issues/185
process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

const logger = require('../../util').logger;

describe('Activation model', () => {
  const activationModel = require('../../models/activation.model');
  const DataTypes = require('sequelize');

  let name;
  let schema;
  let options;

  let defineCallback = (databaseName, databaseSchema, databaseOptions) => {
    logger.error(options);
    name = databaseName;
    schema = databaseSchema;
    options = databaseOptions;
  }

  const mockSequelize = { define: defineCallback };

  activationModel(mockSequelize, DataTypes);

  const fields = [ 'image',
                   'vendor',
                   'product',
                   'release',
                   'serial',
                   'live',
                   'country',
                   'region',
                   'city',
                   'latitude',
                   'longitude' ];

  const indexedFields = fields;

  it('has expected name', () => {
    // Sanity check
    expect(name).to.be.equal('Activation');
  });

  it('has expected table name', () => {
    // Sanity check
    expect(options.tableName).to.be.equal('activation');
  });

  it('has timestamps', () => {
    // Sanity check
    expect(options.timestamps).to.be.true;
  });

  it('has expected fields', () => {
    for (let field of indexedFields) {
      expect(schema[field]).to.not.be.undefined;
    }
  });

  it('has id column', () => {
    expect(schema.id).to.not.be.undefined;
    expect(schema.id.allowNull).to.be.false;
    expect(schema.id.primaryKey).to.be.true;
    expect(schema.id.autoIncrement).to.be.true;
  });

  it('has expected indexes', () => {
    // Sanity check
    expect(options).to.not.be.undefined;

    logger.debug(options);

    for (let field of indexedFields) {
      logger.debug("Checking", field);
      let foundIndex;
      for (let indexItem of options.indexes) {
        logger.debug("Comparing", indexItem);
        if (indexItem.fields.length == 1 && indexItem.fields[0] == field) {
          logger.info('Found index:', field);
          foundIndex = indexItem;
          break;
        }
      }

      expect(foundIndex).to.not.be.undefined;
    }
  });
});
