// vim: ts=2 sw=2 expandtab
'use strict';

const _ = require('underscore');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const mongoClient = require('mongodb').MongoClient;

const logger = require('../util').logger;

const basename  = path.basename(module.filename);

var callbackFunction;
var db;

// If table name has vairables resolve them
// XXX: Currently we only use $DATE
const getTableName = (name) => {
  const padNumber = (number) => {
    return ('0' + number).slice(-2);
  };

  const ENV_VAR_REGEX=/\$([A-Za-z0-9_]+)/g;
  const VARIABLE_MAP = {
    DATE: () => {
      const date = new Date();
      return '' +
             date.getUTCFullYear() +
             padNumber(date.getUTCMonth()) +
             padNumber(date.getUTCDate());
    }
  };

  const replaceEnvVars = function(match, var_name) {
    if (VARIABLE_MAP[var_name] === undefined) {
      throw new Error("'" + var_name + "' is not in environment variables!");
    }

    return VARIABLE_MAP[var_name]();
  }

  return name.replace(ENV_VAR_REGEX, replaceEnvVars);
}

// Maps mongo API to sequelize API functions to retain SQL/NoSQL
// cross-compatibility
const mapCollectionMethods = (db, datasetName, rawTableName, indexes) => {
  const genericCollection = () => {
    // Intentionally here so that we keep evaluating it on func eval
    const tableName = getTableName(rawTableName);

    logger.debug("Generating API for DB:", tableName);
    const baseCollection = db.collection(tableName);
    var collection = {};

    collection.upsert = (data, options) => {
      return new Promise((fulfill, reject) => {
          delete(data.createdAt);
          delete(data.updatedAt);

          var searchQuery = _.clone(data);

          // XXX: CamelCase is SQL-specific but we'll reuse it to keep API same
          data.createdAt = new Date().toISOString();
          data.updatedAt = new Date().toISOString();


          // TODO: Use update instead of findAndModify for big records (i.e. Pings)
          //       since this will return the whole thing.
          baseCollection.findAndModify(searchQuery,
                                       undefined,
                                       data,
                                       { upsert: true,
                                         w: 'majority',
                                         'new': true },
                                       (err, result) => {
            logger.debug('Upserted into ' + datasetName + ':',
                         JSON.stringify(data));

            logger.silly('Upsert into ' + datasetName + ' with ObjectID:',
                         result.value._id.toString());

            if (err) {
              reject(err);
            } else {
              fulfill(result.value._id);
            }
          });
      });
    }

    collection.create = (data) => {
      return new Promise((fulfill, reject) => {
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();

        baseCollection.insert(data, { w: 'majority' }, (err, results) => {
          if (err) {
            reject(err);
          } else {
            fulfill();
          }
        });
      });
    }

    // NoSQL doesn't need to really create any tables beforehand
    collection.sync = (options) => {
      return new Promise((fulfill, reject) => {
        if (options.force && options.force != true) {
          fulfill();
        } else {
          logger.warn("Clear of DB requested:", datasetName);
          baseCollection.deleteMany({}, (err, result) => {
            if (err) {
              reject(err);
            } else {
              fulfill(result);
            }
          });
        }
      });
    }

    collection.findAndCountAll = (options) => {
      return new Promise((fulfill, reject) => {
        logger.debug("Finding all items in", datasetName);

        const cursor = baseCollection.find();

        cursor.toArray((err, docs) => {
          if (err) {
            reject(err);
          }

          logger.debug("Returning rows:", docs.length);
          fulfill({ rows: docs, count: docs.length });
        });
      });
    }

    // Setup any needed indexes
    for (var index of indexes) {
      db.ensureIndex(tableName, index,
                     { sparse: true,
                       background: true },
                     (err, name) => {
        logger.silly("Background create of " + datasetName + " index: " + name);
      })
    }

    return collection;
  }

  if (getTableName(rawTableName) == rawTableName) {
    // If no variables in name, make a static mapping
    logger.debug("Regular collection:", datasetName);
    db[datasetName] = genericCollection();
  } else {
    // otherwise make it a getter
    logger.debug("Dynamic collection:", datasetName);
    db[datasetName] = genericCollection;
  }
}

const associateModels = (db) => {
  // Find out which models we have and create DB associations
  fs.readdirSync(path.join(__dirname, '..' , 'models'))
    .filter(function(file) {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-9) === '.model.js');
    })
    .forEach(function(file) {
      // Handle indexes in sequelize format
      const schemaModule = require(path.join(__dirname, '..', 'models', file));
      const sequelizeMock = {
        define: (name, schema, options) => {
          return { name: name,
                   schema: schema,
                   options: options };
        },
        ID: 'id',
        STRING: 'string',
        INTEGER: 'integer',
        DATEONLY: 'dateonly',
        ARRAY: (type) => {}
      }
      const model = schemaModule(sequelizeMock, sequelizeMock);

      // Set names. We currently want to keep CamelCase for collections though
      const datasetName = model.name;
      const tableName = model.options.tableName || datasetName;

      var indexes = [];
      for (var index of model.options.indexes) {
        logger.silly(datasetName + " index found:", index);
        const mappedIndex = index.fields.map((field) => {
          var indexField = {};
          indexField[field] = 1;
          return indexField;
        });
        logger.silly(mappedIndex);
        indexes.push(mappedIndex);
      }


      // Transform the Mongo backend to sequelize-ish interface so that
      // we can swap out the backend as we want
      mapCollectionMethods(db, datasetName, tableName, indexes);


      logger.debug('Associated model: ' + datasetName);
    });
}

const connectToMongo = (callback) => {
  const connectionUrl = 'mongodb://localhost:27017/eos-activation-service';

  // If we're already connected, short-circuit
  if (db !== undefined) {
    callback(db);
    return;
  }

  logger.info("Trying to connect:", connectionUrl);
  mongoClient.connect(connectionUrl, function(err, mongoDatabase) {
    // Async could get us connected in the meantime so check again
    if (db == undefined) {
      assert.equal(null, err);
      logger.info("Connected to server:", connectionUrl);

      db = mongoDatabase;
      associateModels(db);
    } else {
      logger.silly("DB already opened, closing this request");
      mongoDatabase.close()
    }

    callback(db);
  });
}

exports = module.exports = (callback) => {
  connectToMongo(callback);
};
