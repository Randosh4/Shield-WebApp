const {DataTypes} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const PartyInvolvement = sequelize.define("PartyInvolvement", {
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        caseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Cases',
                key: 'id',
            },
        },
        partyId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Parties',
                key: 'id',
            },
        },
    });

    PartyInvolvement.associate = (models) => {
        PartyInvolvement.belongsTo(models.Case, { foreignKey: 'caseId', onDelete: 'CASCADE' });
        PartyInvolvement.belongsTo(models.Party, { foreignKey: 'partyId', onDelete: 'CASCADE' });
    };


    return PartyInvolvement;
};
