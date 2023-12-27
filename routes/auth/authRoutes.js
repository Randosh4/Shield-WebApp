const express = require('express');
const {User} = require('../../models');
const bcrypt = require('bcrypt');
const {validationResult} = require('express-validator');
const {sendResponse} = require('../../utils/responseHandler'); // Import the utility function
const router = express.Router();
const {body} = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const credentials = require('../../config/serviceAccountKey.json');
const admin = require('firebase-admin');
const multer = require('multer');
const upload = multer();
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
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        next();
    }
];

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});
router.post('/login', async (req, res) => {
    const {username, password} = req.body;

    try {
        const user = await User.findOne({where: {username}});

        if (!user) {
            return sendResponse(res, 403, 'Invalid credentials', null);

        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return sendResponse(res, 403, 'Invalid credentials 2', null);
        }

        const payload = {
            id: user.id,
            email: user.email,
            type: user.type,
        };


        const token = jwt.sign(payload, config.secretKey, {expiresIn: '1h'});

        const data = {
            token: token,
            user: user,
        };

        return sendResponse(res, 200, 'Login successful', data);

    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});
router.post('/change', async (req, res) => {
    const {userId, password} = req.body;

    console.log(req.body);
    try {
        console.log(userId);
        console.log(password);
        const user = await User.findByPk(userId);

        if (!user) {
            return sendResponse(res, 403, 'User not Found', null);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user.update({
            password: hashedPassword,
            status: 1,
        });

        return sendResponse(res, 200, 'Password changed successful', null);

    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/test', async (req, res) => {
    const {email, password} = req.body;
    const userResponse = await admin.auth().createUser({
        email: email,
        password: password,
        emailVerified: false,
        disabled: false
    });

    res.json(userResponse);
});


module.exports = router;
