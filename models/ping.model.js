// vim: ts=2 sw=2 expandtab
'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Ping', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    count: DataTypes.INTEGER,
    country: DataTypes.STRING,
    config_ids: DataTypes.ARRAY(DataTypes.ID) // No representation for SQL of this
  }, {
    timestamps: true,
    paranoid: false,
    freezeTableName: true,
    tableName: 'Ping_$DATE',
    indexes: [
      { fields: ['count']      },
      { fields: ['country']    },
      { fields: ['config_ids'] }
    ]
  });
};
