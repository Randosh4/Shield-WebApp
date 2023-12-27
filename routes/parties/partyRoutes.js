const express = require('express');
const {Party, PartyInvolvement, Case} = require('../../models');
const {validationResult} = require('express-validator');
const {sendResponse} = require('../../utils/responseHandler'); // Import the utility function
const router = express.Router();
const {body} = require('express-validator');
const multer = require('multer');
const upload = multer();
router.use(upload.array());

// Validation rules for party creation
const partyValidationRules = [
    body('firstName').notEmpty(),
    body('middleName').notEmpty(),
    body('lastName').notEmpty(),
    body('nationalId').notEmpty(),
    body('nationalIdType').notEmpty(),
// Add validation rules for other fields according to your model configuration
];

// Middleware to validate party creation
const validateParty = [
    ...partyValidationRules,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        next();
    }
];


router.get("/", async (req, res) => {
    try {
        const parties = await Party.findAll(
            {
                order: [['createdAt', 'DESC']],
            }
        );
        return sendResponse(res, 200, 'Success', parties);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Get a single party by ID
router.get("/:id", async (req, res) => {
    try {
        const partyId = req.params.id;
        const party = await Party.findByPk(partyId);
        if (!party) {
            return sendResponse(res, 404, 'Party not found', null);
        }
        return sendResponse(res, 200, 'Success', party);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Create a new party
router.post("/", validateParty, async (req, res) => {
    const {
        firstName,
        middleName,
        lastName,
        address,
        nationalId,
        nationalIdType,
    } = req.body;
    try {
        // Check if the email is already in use
        const existing = await Party.findOne({where: {nationalId}});

        if (existing) {
            return sendResponse(res, 400, 'ID Number Already In Use', null);
        }

        const newParty = await Party.create({
            firstName,
            middleName,
            lastName,
            address,
            nationalId,
            nationalIdType,
        });

        return sendResponse(res, 201, 'Created Successfully', newParty);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Update a party by ID
router.put("/:id", validateParty, async (req, res) => {
    const partyId = req.params.id;
    const {
        firstName,
        middleName,
        lastName,
        address,
        nationalId,
        nationalIdType,
    } = req.body;

    try {
        const party = await Party.findByPk(partyId);

        if (!party) {
            return sendResponse(res, 404, 'Party not found', null);
        }

        party.update({
            firstName,
            middleName,
            lastName,
            address,
            nationalId,
            nationalIdType,
        });
        return sendResponse(res, 200, 'Party updated successfully', null);

    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Delete a party by ID
router.delete("/:id", async (req, res) => {
    const partyId = req.params.id;

    try {
        const party = await Party.findByPk(partyId, {
            include: [
                {
                    model: PartyInvolvement,
                    include: [Case],
                },
            ],
        });

        // If party is not found, send a 404 response
        if (!party) {
            return sendResponse(res, 404, 'Party not found', null);
        }
        if (party.PartyInvolvements && party.PartyInvolvements.length > 0) {
            const partyInvolvement = party.PartyInvolvements[0];

            if (partyInvolvement.Case) {
                await partyInvolvement.Case.destroy();
            }

            await partyInvolvement.destroy();
        }

// Delete the Party
        await party.destroy();

        return sendResponse(res, 200, 'Deleted Successfully', null);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

module.exports = router;
