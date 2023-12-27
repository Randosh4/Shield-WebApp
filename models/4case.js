const {DataTypes} = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    const Case = sequelize.define("Case", {
        offense: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        offenseType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        officerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Officers',
                key: 'id',
            },
        },
    }, {});

    Case.associate = (models) => {
        Case.belongsTo(models.Officer, {foreignKey: 'officerId'});
        Case.hasMany(models.PartyInvolvement, {foreignKey: 'caseId', onDelete: 'CASCADE',});
        Case.hasMany(models.CaseOfficer, {foreignKey: 'caseId', onDelete: 'CASCADE',});
        Case.hasMany(models.Evidence, {foreignKey: 'caseId', onDelete: 'CASCADE',});
        Case.hasOne(models.Conclusion, {foreignKey: 'caseId', onDelete: 'CASCADE',});
    };


    return Case;
};