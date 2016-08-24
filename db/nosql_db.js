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

const associateModels = (db) => {
  // Find out which models we have and create DB associations
  fs.readdirSync(path.join(__dirname, '..' , 'models'))
    .filter(function(file) {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-9) === '.model.js');
    })
    .forEach(function(file) {
      // Strip '.model.js'
      const name = file.slice(0, -9);
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

      // Handle indexes in sequelize format
      const schemaModule = require(path.join(__dirname, '..', 'models', file));
      const sequelizeMock = {
        define: (name, schema, options) => {
          return { name: name,
                   schema: schema,
                   options: options };
        },
        STRING: "string",
        INTEGER: "integer",
        DATEONLY: "dateonly",
        ARRAY: (type) => {}
      }
      const model = schemaModule(sequelizeMock, sequelizeMock);
      const indexes = model.options.indexes;
      for (var index of indexes) {
        logger.silly(capitalizedName + " index found:", index);
        const mappedIndex = index.fields.map((field) => {
          var indexField = {};
          indexField[field] = 1;
          return indexField;
        });
        logger.silly(mappedIndex);

        db.ensureIndex(capitalizedName,
                       mappedIndex,
                       { sparse: true,
                         background: true },
                       (err, name) => {
          logger.silly("Bacground create of " + capitalizedName + " index: " + name);
        })
      }

      // Transform the Mongo backend to sequelize-ish interface so that
      // we can swap out the backend as we want
      db[capitalizedName] = db.collection(name);
      db[capitalizedName].upsert = (data, options) => {
        return new Promise((fulfill, reject) => {
            delete(data.createdAt);
            delete(data.updatedAt);

            var searchQuery = _.clone(data);

            // XXX: CamelCase is SQL-specific but we'll reuse it to keep API same
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();


            // TODO: Use update instead of findAndModify for big records (i.e. Pings)
            //       since this will return the whole thing.
            db[capitalizedName].findAndModify(searchQuery,
                                              undefined,
                                              data,
                                              { upsert: true,
                                                w: 'majority',
                                                'new': true },
                                              (err, result) => {
              logger.debug('Upserted into ' + capitalizedName + ':',
                           JSON.stringify(data));

              logger.silly('Upsert into ' + capitalizedName + ' with ObjectID:',
                           result.value._id.toString());

              if (err) {
                reject(err);
              } else {
                fulfill(result.value._id);
              }
            });
        });
      }

      // NoSQL doesn't need to really create any tables beforehand
      db[capitalizedName].sync = (options) => {
        return new Promise((fulfill, reject) => {
          if (options.force && options.force != true) {
            fulfill();
          } else {
            logger.warn("Clear of DB requested:", capitalizedName);
            db[capitalizedName].deleteMany({}, (err, results) => {
              if (err) {
                reject(err);
              } else {
                fulfill();
              }
            });
          }
        });
      }

      db[capitalizedName].findAndCountAll = (options) => {
        return new Promise((fulfill, reject) => {
          logger.debug("Finding all items in", capitalizedName);

          const cursor = db[capitalizedName].find();

          cursor.toArray((err, docs) => {
            if (err) {
              reject(err);
            }

            logger.debug("Returning rows:", docs.length);
            fulfill({ rows: docs, count: docs.length });
          });
        });
      }

      logger.debug('Associated model: ' + capitalizedName);
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
