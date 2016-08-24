// vim: ts=2 sw=2 expandtab
'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Configuration', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    image: DataTypes.STRING,
    vendor: DataTypes.STRING,
    product: DataTypes.STRING,
    release: DataTypes.STRING,
    country: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: false,
    freezeTableName: true,
    tableName: 'configuration',
    indexes: [
      { fields: ['image']   },
      { fields: ['vendor']  },
      { fields: ['product'] },
      { fields: ['release'] },
      { fields: ['country'] }
    ]
  });
};
