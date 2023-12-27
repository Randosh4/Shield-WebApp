const {DataTypes} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const CaseOfficer = sequelize.define("CaseOfficer", {
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
        evidenceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Evidence',
                key: 'id',
            },
        },
    });

    CaseOfficer.associate = (models) => {
        CaseOfficer.belongsTo(models.Case, { foreignKey: 'caseId', onDelete: 'CASCADE' });
        CaseOfficer.belongsTo(models.Officer, { foreignKey: 'officerId', onDelete: 'CASCADE' });
        CaseOfficer.belongsTo(models.Evidence, { foreignKey: 'evidenceId', onDelete: 'CASCADE' });
    };


    return CaseOfficer;
};
