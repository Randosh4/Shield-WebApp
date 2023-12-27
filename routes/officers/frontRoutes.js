// usersRoutes.js

const express = require('express');
const router = express.Router();
const axios = require('axios');

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Replace with your actual base URL
});
// Route to render the create user page
router.get('/create', (req, res) => {
    res.render('officers/create');
});

// Route to render the edit user page
router.get('/edit/:id', async (req, res) => {
    const officerId = req.params.id;
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get(`/officers/${officerId}`);
        const officer = response.data.data;
        res.render('officers/edit', {officer: officer});

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }
});

// Route to render the all users page
router.get('/all', async (req, res) => {
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get('/officers'); // Replace with your actual internal API endpoint

        const data = response.data;
        res.render('officers/all', {response: data});
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }

});
module.exports = router;

