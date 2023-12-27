const {DataTypes} = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    const Evidence = sequelize.define("Evidence", {
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fileSize: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        seizureDate: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        seizureAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        dimensions: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        notes: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        externalId: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: true,
        },
        officerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Officers',
                key: 'id',
            },
        },
        caseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Cases',
                key: 'id',
            },
        },

    }, {});


    Evidence.associate = (models) => {
        Evidence.belongsTo(models.Officer, {foreignKey: 'officerId'});
        Evidence.belongsTo(models.Case, {foreignKey: 'caseId', onDelete: 'CASCADE'});
        Evidence.hasMany(models.CaseOfficer, {
            foreignKey: 'evidenceId',
            onDelete: 'CASCADE',
        });
    };

    return Evidence;
};
