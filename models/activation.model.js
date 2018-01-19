// vim: ts=2 sw=2 expandtab
'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Activation', {
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
    serial: DataTypes.STRING,
    live: DataTypes.BOOLEAN,
    dualboot: DataTypes.BOOLEAN,
    mac_hash: DataTypes.INTEGER,
    country: DataTypes.STRING,
    region: DataTypes.STRING,
    city: DataTypes.STRING,
    latitude: DataTypes.FLOAT,
    longitude: DataTypes.FLOAT
  }, {
    timestamps: true,
    paranoid: false,
    freezeTableName: true,
    tableName: 'Activation',
    indexes: [
      { fields: ['image']     },
      { fields: ['vendor']    },
      { fields: ['product']   },
      { fields: ['release']   },
      { fields: ['serial']    },
      { fields: ['live']      },
      { fields: ['dualboot']  },
      { fields: ['country']   },
      { fields: ['region']    },
      { fields: ['city']      },
      { fields: ['latitude']  },
      { fields: ['longitude'] }
    ]
  });
};
