const express = require('express');
const {Officer} = require('../../models');
const {User} = require('../../models');
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer();
const {validationResult} = require('express-validator');
const {sendResponse} = require('../../utils/responseHandler'); // Import the utility function
const router = express.Router();
const {body} = require('express-validator');
const {sendEmail} = require('../../services/emailService');


router.use(upload.array());
// Validation rules for officer creation
const officerValidationRules = [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('phone').notEmpty().isNumeric(),
    body('email').notEmpty().isEmail(),    // Add validation rules for other fields according to your model configuration
];

// Middleware to validate officer creation
const validateOfficer = [
    ...officerValidationRules,
    (req, res, next) => {
        console.log("Request Data",req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        next();
    }
];

const generateRandomUsername = async () => {
    let randomUsername;
    let isUnique = false;

    while (!isUnique) {

        randomUsername = Math.floor(100000 + Math.random() * 900000).toString();
        const existingUser = await User.findOne({
            where: {username: randomUsername},
        });
        isUnique = !existingUser;
    }

    return randomUsername;
};

function generateRandomPassword() {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_+=";

    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset.charAt(randomIndex);
    }
    return password;
}

// Get all officers
router.get("/", async (req, res) => {
    try {
        const officers = await Officer.findAll({
            include: {
                model: User, // Include the User model
                attributes: ['id', 'firstName', 'middleName', 'lastName', 'email', 'phone', 'username'], // Specify the attributes you want to retrieve from the User model
            },
            order: [['createdAt', 'DESC']],

        });
        return sendResponse(res, 200, 'Success', officers);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Get a single officer by ID
router.get("/:id", async (req, res) => {
    try {
        const officerId = req.params.id;
        const officer = await Officer.findByPk(officerId, {
            include: {
                model: User, // Include the User model
                attributes: ['id', 'firstName', 'middleName', 'lastName', 'email', 'phone', 'username'], // Specify the attributes you want to retrieve from the User model
            },
        });
        if (!officer) {
            return sendResponse(res, 404, 'Officer not found', null);

        }

        return sendResponse(res, 200, 'Success', officer);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});
router.get("/user/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const officer = await Officer.findOne({
            where: {userId: userId},
            include: [
                {model: User}
            ]
        });
        if (!officer) {
            return sendResponse(res, 404, 'Officer not found', null);
        }


        return sendResponse(res, 200, 'Success', officer);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Create a new officer
router.post("/", validateOfficer, async (req, res) => {
    const {
        firstName,
        middleName,
        lastName,
        phone,
        email,
        address,
        jobTitle,
        departmentName,
        militaryRank,
        type,
    } = req.body;
    try {
        // Check if the email is already in use
        const existing = await User.findOne({where: {email}});

        if (existing) {
            return sendResponse(res, 400, 'Email Already In Use', null);
        }
        const existingPhone = await User.findOne({where: {phone}});
        if (existingPhone) {
            return sendResponse(res, 400, 'Phone Already In Use', null);
        }
        // Hash the password before creating the officer
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        const username = await generateRandomUsername();

        const user = await User.create({
            phone,
            password: hashedPassword,
            firstName,
            middleName,
            lastName,
            username: username,
            email,
            type,
        });
        const newOfficer = await Officer.create({
            address,
            jobTitle,
            departmentName,
            militaryRank,
            type,
            userId: user.id,
        });

        const subject = 'Welcome to Shield - Your Account Details';
        await sendEmail(email, firstName + " " + lastName, subject, username, password);

        return sendResponse(res, 201, 'Created Successfully', newOfficer);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Update a officer by ID
router.put("/:id", validateOfficer, async (req, res) => {
    const officerId = req.params.id;
    const {
        firstName,
        middleName,
        lastName,
        phone,
        email,
        address,
        jobTitle,
        departmentName,
        militaryRank,
        type,
    } = req.body;

    try {
        const officer = await Officer.findByPk(officerId);

        if (!officer) {
            return sendResponse(res, 404, 'Officer not found', null);
        }
        const user = await User.findByPk(officer.userId);

        user.update({
            phone,
            firstName,
            middleName,
            lastName,
            email,
        });
        officer.update({
            address,
            jobTitle,
            departmentName,
            militaryRank,
            type,
        });
        return sendResponse(res, 200, 'Officer updated successfully', null);

    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

// Delete a officer by ID
router.delete("/:id", async (req, res) => {
    const officerId = req.params.id;

    try {
        const officer = await Officer.findByPk(officerId);
        if (!officer) {
            return sendResponse(res, 404, 'Officer not found', null);
        }

        await officer.destroy();

        return sendResponse(res, 200, 'Deleted Successfully', null);
    } catch (err) {
        console.error(err);
        return sendResponse(res, 500, 'Internal server error', null);
    }
});

router.post('/send-email', async (req, res) => {
    const {to, subject, text} = req.body;

    try {
        await sendEmail(to, subject, text, text);

        res.json({message: 'Email sent successfully'});
    } catch (error) {
        res.status(500).json({error: 'Failed to send email'});
    }
});

module.exports = router;
