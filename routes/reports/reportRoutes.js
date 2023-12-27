const express = require('express');
const {Officer, Conclusion, CaseOfficer, Evidence, Case, PartyInvolvement, Party} = require('../../models');
const {User} = require('../../models');
const bcrypt = require('bcrypt');
const {validationResult} = require('express-validator');
const {sendResponse} = require('../../utils/responseHandler'); // Import the utility function
const router = express.Router();
const {body} = require('express-validator');

const {sendEmail} = require('../../services/emailService');

// Validation rules for officer creation
const validationRules = [
    body('content').notEmpty(),
    body('officerId').notEmpty(),
    // Add validation rules for other fields according to your model configuration
];

// Middleware to validate officer creation
const validate = [
    ...validationRules,
    (req, res, next) => {
        const errors = validationResult(req);
        console.log('Conc Data', req.params);

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        next();
    }
];


router.get("/:id", async (req, res) => {
    try {
        const caseId = req.params.id;
        const caseItem = await Case.findByPk(caseId, {
            include: [
                {
                    model: PartyInvolvement,
                    attributes: ['id', 'type', 'partyId'],
                    include: [
                        {
                            model: Party,
                        },
                    ],
                },
                {model: Officer,},
                {
                    model: CaseOfficer,
                    include: [
                        {
                            model: Officer,
                            include: [
                                {
                                    model: User,
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Evidence,
                    include: [
                        {
                            model: Officer,
                            include: [
                                {
                                    model: User,
                                }
                            ]
                        },
                    ],
                }
            ],
        });

        if (!caseItem) {
            return sendResponse(res, 404, 'Case not found', null);
        }
        const officer = await Officer.findByPk(caseItem.officerId, {
            include: {
                model: User, // Include the User model
                attributes: ['id', 'firstName', 'middleName', 'lastName', 'email', 'phone', 'username'], // Specify the attributes you want to retrieve from the User model
            },
        });

        if (!officer) {
            return sendResponse(res, 404, 'Officer not found', null);

        }

        return sendResponse(res, 200, 'Success', caseItem);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});
router.post("/:id/:officerId/:content", async (req, res) => {
    const caseId = req.params.id;
    const officerId = req.params.officerId;
    const content = req.params.content;

    try {
        // Check if the email is already in use
        const caseItem = await Case.findByPk(caseId);
        let conclusion = await Conclusion.findOne({
            where: {
                caseId: caseId,
                officerId: officerId,
            }
        });

        if (!caseItem) {
            return sendResponse(res, 400, 'Case Not Found', null);
        }


        if (!conclusion) {
            conclusion = await Conclusion.create({
                caseId,
                content,
                officerId,
            });
            return sendResponse(res, 201, 'Created Successfully', conclusion);
        } else {
            conclusion.update({
                content,
            });
            return sendResponse(res, 200, 'Updated Successfully', conclusion);

        }


    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});
router.get("/conclusions/:id", async (req, res) => {
    const caseId = req.params.id;
    console.log(req.params);
    try {
        // Check if the email is already in use
        const caseItem = await Case.findByPk(caseId);
        const conclusion = await Conclusion.findOne({
            where: {caseId: caseId},
            include: [
                {
                    model: Officer,
                    include: [
                        {
                            model: User,

                        }
                        ]
                }
            ]
        });


        if (!caseItem) {
            return sendResponse(res, 400, 'Case Not Found', null);
        }
        if (!conclusion) {
            return sendResponse(res, 200, 'Got Successfully', null);

        }
        return sendResponse(res, 200, 'Got Successfully', conclusion);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

module.exports = router;
