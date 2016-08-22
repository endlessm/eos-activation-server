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
    date: DataTypes.DATEONLY,
    image: DataTypes.STRING,
    vendor: DataTypes.STRING,
    product: DataTypes.STRING,
    release: DataTypes.STRING,
    country: DataTypes.STRING,
    count: DataTypes.ARRAY(DataTypes.INTEGER), //psql-specific
  }, {
    timestamps: true,
    paranoid: false,
    freezeTableName: true,
    tableName: 'ping',
    indexes: [
      { fields: ['date']     },
      { fields: ['image']     },
      { fields: ['vendor']    },
      { fields: ['product']   },
      { fields: ['release']   },
      { fields: ['country']   },
      { fields: ['count']     }
    ]
  });
};
