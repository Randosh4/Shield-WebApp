const express = require('express');
const {User} = require('../models');
const bcrypt = require('bcrypt');
const {validationResult} = require('express-validator');
const {sendResponse} = require('../utils/responseHandler'); // Import the utility function
const router = express.Router();

const jwt = require('jsonwebtoken');
const config = require('../config'); // Adjust the path based on your actual file structure


// Validation middleware for creating and updating users
const validateUser = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    next();
};

// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.findAll();
        return sendResponse(res, 200, 'Success', users);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Get a single user by ID
router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Create a new user
router.post("/", validateUser, async (req, res) => {
    const {name, phone, email, password} = req.body;

    try {
        // Check if the email is already in use
        const existingUser = await User.findOne({where: {email}});

        if (existingUser) {
            return res.status(400).json({error: 'Email already in use'});
        }

        // Hash the password before creating the user
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            phone,
            email,
            password: hashedPassword,
        });

        res.json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Update a user by ID
router.put("/:id", validateUser, async (req, res) => {
    const userId = req.params.id;
    const {name, phone, email, password} = req.body;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        // Hash the password before updating the user
        const hashedPassword = await bcrypt.hash(password, 10);

        await user.update({
            name,
            phone,
            email,
            password: hashedPassword,
        });

        res.json({message: 'User updated successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Delete a user by ID
router.delete("/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        await user.destroy();

        res.json({message: 'User deleted successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await User.findOne({where: {email}});

        if (!user) {
            return sendResponse(res, 403, 'Invalid credentials', null);

        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return sendResponse(res, 403, 'Invalid credentials', null);
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

router.post('/register', async (req, res) => {
    const {name, phone, email, password} = req.body;

    try {
        const existingUser = await User.findOne({where: {email}});
        if (existingUser) {
            return res.status(400).json({error: 'Email already in use'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            phone,
            email,
            password: hashedPassword,
        });

        res.json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

module.exports = router;
