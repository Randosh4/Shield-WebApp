const {DataTypes} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Conclusion = sequelize.define("Conclusion", {
        caseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Cases',
                key: 'id',
            },
        },
        officerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Officers',
                key: 'id',
            },
        },
        content: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });

    Conclusion.associate = (models) => {
        Conclusion.belongsTo(models.Case, {foreignKey: 'caseId', onDelete: 'CASCADE'});
        Conclusion.belongsTo(models.Officer, {foreignKey: 'officerId', onDelete: 'CASCADE'});
    };


    return Conclusion;
};
