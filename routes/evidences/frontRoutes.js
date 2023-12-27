// usersRoutes.js

const express = require('express');
const router = express.Router();
const axios = require('axios');

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Replace with your actual base URL
});
// Route to render the create user page
router.get('/test', async (req, res) => {

    res.render('test', {});
});

// Route to render the create user page
router.post('/save', async (req, res) => {
    res.send(req.body);
});
router.get('/create', async (req, res) => {
    let response = await apiClient.get("/cases");
    const cases = response.data.data;
    response = await apiClient.get("/officers");
    const officers = response.data.data;
    res.render('evidences/create', {
        cases: cases,
        officers: officers,
    });
});

// Route to render the edit user page
router.get('/edit/:id', async (req, res) => {
    const evidenceId = req.params.id;
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get(`/evidences/${evidenceId}`);

        const evidence = response.data.data;
        res.render('evidences/edit', {evidence: evidence});


    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }
});


// Route to render the all users page
router.get('/all', async (req, res) => {
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get('/evidences'); // Replace with your actual internal API endpoint

        const data = response.data;
        res.render('evidences/all', {response: data});
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }

});
module.exports = router;

