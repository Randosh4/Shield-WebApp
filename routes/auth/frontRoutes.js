// usersRoutes.js

const express = require('express');
const axios = require("axios");
const router = express.Router();

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Replace with your actual base URL
});
// Route to render the create user page
router.get('/login', (req, res) => {
    res.render('auth/login');
});
router.get('/verify', (req, res) => {
    res.render('auth/verify-otp');
});

router.get('/change-password', (req, res) => {
    res.render('auth/change-password');
});
module.exports = router;

