const express = require('express');
const crypto = require('crypto');
const {CaseOfficer, Case, Officer, Evidence,User, PartyInvolvement, Party} = require('../../models');
const {validationResult} = require('express-validator');
const {sendResponse} = require('../../utils/responseHandler'); // Import the utility function
const {hashFileContent, hashObject} = require('../../utils/hasher'); // Adjust the path accordingly
const fs = require('fs');

const router = express.Router();
const {body} = require('express-validator');
const mimeTypes = require('mime-types');
const evidenceService = require('../../blockchain_services/evidenceServices.js');

const multer = require('multer');
const path = require("path");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);
        req.newFileName = newFileName;
    }
});
const upload = multer({storage: storage});

const mapToCategory = (mimeType) => {
    if (mimeType.startsWith('audio/')) {
        return 'audio';
    } else if (mimeType.startsWith('image/')) {
        return 'image';
    } else if (mimeType.startsWith('video/')) {
        return 'video';
    } else {
        return 'unknown';
    }
};

// Validation rules for evidences creation
const evidenceValidationRules = [
    body('seizureDate').notEmpty(),
    body('officerId').notEmpty(),
    body('caseId').notEmpty(),

];

// Middleware to validate evidences creation
const validateEvidence = [
    ...evidenceValidationRules,
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        next();
    }
];

function formatDateString(inputDateString) {
    // Check if the input date string matches the expected format
    const match = inputDateString.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/);

    if (match) {
        // Extract parts from the matched groups
        const [, date, time] = match;

        // Create a new date string in the desired format
        return `${date} ${time}`;
    }

    // If the input does not match the expected format, return it as is
    return inputDateString;
}

// Example usage
const makeEvidenceObject = async (evidenceItem) => {
    return evidenceData = {
        id: evidenceItem.id,
      fileName: evidenceItem.fileName,
      fileType: evidenceItem.fileType,
      fileSize: evidenceItem.fileSize,
      seizureDate: evidenceItem.seizureDate,
      seizureAddress: evidenceItem.seizureAddress,
      description: evidenceItem.description,
      notes: evidenceItem.notes,
      dimensions: evidenceItem.dimensions,
      fileUrl: evidenceItem.fileUrl,
      officerId: evidenceItem.officerId,
      caseId: evidenceItem.caseId,
      hash: evidenceItem.hash,
      externalId: evidenceItem.externalId,
    };
  };

router.get("/", async (req, res) => {
    try {
        const parties = await Evidence.findAll({
            include: [{ model: Case },
                {
                    model: Officer,
                    attributes: ['id'],
                    include: [
                        {
                            model: User,
                            attributes: ['firstName', 'middleName', 'lastName'], // Include the 'name' attribute from the Party model
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        return sendResponse(res, 200, 'Success', parties);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});


// Create a new party
router.post("/upload-file", upload.single("file"), async (req, res) => {
    try {
        const newFileName = req.newFileName;
        const mimeType = mimeTypes.lookup(newFileName) || 'unknown';
        const fileCategory = mapToCategory(mimeType);
        const fileSizeKB = (req.file.size / 1024).toFixed(2);
        const filePath = path.join('uploads', newFileName);

        // Read the file content
        const fileContent = fs.readFileSync(filePath);
        const fileHash = hashFileContent(fileContent);
        console.log('File size:', fileSizeKB, 'KB');
        console.log('New File name:', newFileName);
        console.log('File type:', fileCategory);
        console.log('hash:', fileHash);

        return sendResponse(res, 201, 'Created Successfully', {
            newFileName: newFileName,
            hash: fileHash,
            size: fileSizeKB,
        });
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

router.post("/", upload.single("file"), async (req, res) => {
    const {
        seizureDate,
        seizureTime,
        seizureAddress,
        dimensions,
        notes,
        description,
        officerId,
        caseId,
        officerIds,
        evidenceId,
    } = req.body;
    try {
        console.log(req.body);
        // Check if the email is already in use
        const officer = await Officer.findByPk(officerId);
        if (!officer) {
            return sendResponse(res, 404, 'Officer Not Found', null);
        }
        const caseItem = await Case.findByPk(caseId);
        if (!caseItem) {
            return sendResponse(res, 404, 'Case Not Found', null);
        }

        if (evidenceId) {
            const evidence = await Evidence.findOne({where: {externalId: evidenceId}});
            if (evidence) {
                return sendResponse(res, 400, 'this ID number already exists', null);
            }
        }

        const newFileName = req.newFileName;
        const mimeType = mimeTypes.lookup(newFileName) || 'unknown';
        const fileCategory = mapToCategory(mimeType);
        const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
        const filePath = path.join('uploads', newFileName);
        // Read the file content
        const fileContent = fs.readFileSync(filePath);
        const fileHash = hashFileContent(fileContent);

        const newEvidence = await Evidence.create({
            fileName: newFileName,
            fileType: fileCategory,
            fileSize: fileSizeMB,
            seizureDate: formatDateString(seizureDate + " " + seizureTime),
            seizureAddress,
            description,
            notes,
            dimensions,
            fileUrl: "uploads/" + newFileName,
            officerId,
            caseId,
            hash: fileHash,
            externalId: evidenceId,
        });

        if (officerIds && officerIds.length > 0) {
            for (const id of officerIds) {
                const inOfficer = await Officer.findByPk(officerId);

                if (!inOfficer) {
                    return sendResponse(res, 404, `Officer ${id} Not Found`, null);
                }

                await CaseOfficer.create({
                    caseId,
                    officerId: id,
                    evidenceId: newEvidence.id,
                });
            }
        }

        const evidenceData = await makeEvidenceObject(newEvidence);

        evidenceService.createEvidence(caseId,evidenceData)
        .then(response => {
          console.log('Ev created:', response);
  
        })
        .catch(error => {
          console.error('Error creating case:', error);
        });
  
        return sendResponse(res, 201, 'Created Successfully', newEvidence);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});
router.put("/:id", async (req, res) => {
    console.log("Ev Data",req.body);

    const evidenceId = req.params.id;
    const {
        notes,
        description,
        officerId,
    } = req.body;
    try {
        console.log("Ev Data",req.body);
        const evidence = await Evidence.findByPk(evidenceId);
        if (!evidence) {
            return sendResponse(res, 404, 'Evidence Not Found', null);
        }

        if (officerId != evidence.officerId) {
            return sendResponse(res, 403, 'Officer Not allowed', null);
        }

        const officer = await Officer.findByPk(officerId);
        if (!officer) {
            return sendResponse(res, 404, 'Officer Not Found', null);
        }
        const caseItem = await Case.findByPk(caseId);
        if (!caseItem) {
            return sendResponse(res, 404, 'Case Not Found', null);
        }
        evidence.update({
            seizureDate: formatDateString(seizureDate),
            seizureAddress,
            description,
            notes,
            dimensions,
        });

        const evidenceData = await makeEvidenceObject(evidence);

        evidenceService.updateEvidence(caseId,evidenceData.id,evidenceData)
        .then(response => {
          console.log('Ev created:', response);
  
        })
        .catch(error => {
          console.error('Error creating case:', error);
        });
  

        return sendResponse(res, 200, 'Created Successfully', null);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

router.get("/:id", async (req, res) => {
    try {
        const evidenceId = req.params.id;
        const evidence = await Evidence.findByPk(evidenceId);
        if (!evidence) {
            return sendResponse(res, 404, 'Case not found', null);
        }
        return sendResponse(res, 200, 'Success', evidence);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

module.exports = router;
