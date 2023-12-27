const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    const Party = sequelize.define("Party", {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        middleName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        nationalId: {
            unique: true,
            type: DataTypes.STRING,
            allowNull: true,
        },
        nationalIdType: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {});

    Party.associate = (models) => {
        Party.hasMany(models.PartyInvolvement, {
            foreignKey: 'partyId',
            onDelete: 'CASCADE',
        });
    };

    return Party;
};
