const express = require('express');
const {Case, User} = require('../../models');
const {PartyInvolvement} = require('../../models');
const {Officer} = require('../../models');
const {Party} = require('../../models');
const {validationResult} = require('express-validator');
const {sendResponse} = require('../../utils/responseHandler'); // Import the utility function
const {hasDuplicates} = require('../../utils/helperFunctions'); // Import the utility function
const router = express.Router();
const {body} = require('express-validator');
const multer = require('multer');
const upload = multer();
const caseService = require('../../blockchain_services/caseServices.js');


router.use(upload.array());

// Validation rules for cases creation
const caseValidationRules = [
    body('offense').notEmpty(),
    body('offenseType').notEmpty(),
    body('officerId').notEmpty(),
    body('partyIds').notEmpty(),
    body('involvementTypes').notEmpty(),

];

// Middleware to validate cases creation
const validateCase = [
    ...caseValidationRules,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        next();
    }
];

const makeObject = async (caseItem) => {
    return caseData = {
        id: caseItem.id,
        offense:caseItem.offense,
        offenseType:caseItem.offenseType,
        description:caseItem.description,
        officerId:caseItem.officerId,
          };
}

router.get("/", async (req, res) => {
    try {
        const cases = await Case.findAll({
            include: [
                {
                    model: PartyInvolvement,
                    attributes: ['id', 'type', 'partyId'],
                    include: [
                        {
                            model: Party,
                            attributes: ['firstName', 'middleName', 'lastName'], // Include the 'name' attribute from the Party model
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],

        });
        return sendResponse(res, 200, 'Success', cases);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

router.get("/:id", async (req, res) => {
    try {
        const caseId = req.params.id;
        const cases = await Case.findByPk(caseId, {
            include: [
                {
                    model: PartyInvolvement,
                    attributes: ['id', 'type', 'partyId'],
                    include: [
                        {
                            model: Party,
                            attributes: ['id', 'firstName', 'middleName', 'lastName'], // Include the 'name' attribute from the Party model
                        },
                    ],
                },
                {model: Officer}
            ],
        });
        if (!cases) {
            return sendResponse(res, 404, 'Case not found', null);
        }
        return sendResponse(res, 200, 'Success', cases);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Create a new case
router.post("/", validateCase, async (req, res) => {
    const {
        offense,
        offenseType,
        description,
        officerId,
        partyIds,
        involvementTypes,
    } = req.body;
    try {
        console.log(req.body);
        // Check if the email is already in use
        const officer = await Officer.findByPk(officerId);

        if (!officer) {
            return sendResponse(res, 404, 'Officer Not Found', null);
        }


        const newCase = await Case.create({
            offense,
            offenseType,
            description,
            officerId,
        });

      const data = makeObject(newCase);
      caseService.createCase(caseData)
      .then(createdCase => {
        console.log('Case created:', createdCase);

      })
      .catch(error => {
        console.error('Error creating case:', error);
      });
        if (partyIds.length > 0 && involvementTypes.length > 0) {
            if (hasDuplicates(partyIds)) {
                return sendResponse(res, 400, "A party can only be add once in a case.", null);
            }
            if (partyIds.length === involvementTypes.length) {
                for (let i = 0; i < partyIds.length; i++) {
                    const partyId = partyIds[i];
                    const party = await Party.findByPk(partyId);

                    if (!party) {
                        return sendResponse(res, 404, 'a Party Not Found', null);
                    }
                    const involvementType = involvementTypes[i];

                    const partyInvolvement = await PartyInvolvement.create({
                        caseId: newCase.id,
                        partyId: partyId,
                        type: involvementType,
                    });
                }
            }
        }
        return sendResponse(res, 201, 'Created Successfully', newCase);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Update a casesby ID
router.put("/:id", async (req, res) => {
    const caseId = req.params.id;
    const {
        offense,
        offenseType,
        description,
        officerId,
    } = req.body;
    console.log(req.body);

    try {
        const cases = await Case.findByPk(caseId);
        if (!cases) {
            return sendResponse(res, 404, 'Case not found', null);
        }
        if (cases.officerId != officerId) {
            return sendResponse(res, 403, 'Modifying must be from the same officer', null);
        }
        const officer = await Officer.findByPk(officerId);
        if (!officer) {
            return sendResponse(res, 404, 'Officer not found', null);
        }
        cases.update({
            offense,
            offenseType,
            description,
        });


        const data = makeObject(cases);
        caseService.updateCase(caseData)
        .then(createdCase => {
          console.log('Case updated:', createdCase);
  
        })
        .catch(error => {
          console.error('Error creating case:', error);
        });
        return sendResponse(res, 200, 'Case updated successfully', null);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Delete a case by ID
router.delete("/:id", async (req, res) => {
    const caseId = req.params.id;

    try {
        const cases = await Case.findByPk(caseId);

        if (!cases) {
            return sendResponse(res, 404, 'Case not found', null);
        }
        await cases.destroy();

        caseService.deleteCase(caseId)
        .then(createdCase => {
          console.log('Case updated:', createdCase);
  
        })
        .catch(error => {
          console.error('Error creating case:', error);
        });

        return sendResponse(res, 200, 'Deleted Successfully', null);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

module.exports = router;
