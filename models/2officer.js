const {DataTypes} = require('sequelize');
const bcrypt = require('bcrypt');
const {INTEGER} = require("sequelize/lib/data-types");

module.exports = (sequelize, DataTypes) => {
    const Officer = sequelize.define("Officer", {

        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        jobTitle: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        departmentName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        militaryRank: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
    },);

    Officer.associate = (models) => {
        Officer.belongsTo(models.User, {foreignKey: 'userId'});
        Officer.hasMany(models.Case, {foreignKey: 'officerId'});
        Officer.hasMany(models.CaseOfficer, {foreignKey: 'officerId'});
        Officer.hasMany(models.Conclusion, {foreignKey: 'officerId'});
    };


    return Officer;
};

