// usersRoutes.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const {Officer} = require('../../models');


const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Replace with your actual base URL
});
// Route to render the create user page
router.get('/create', async (req, res) => {
    const response = await apiClient.get("/parties");

    const parties = response.data.data;

    res.render('cases/create', {
        parties: parties,
    });
});


// Route to render the edit user page
router.get('/edit/:id', async (req, res) => {
    const caseId = req.params.id;
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get(`/cases/${caseId}`);
        const partiesResponse = await apiClient.get("/parties");

        const parties = partiesResponse.data.data;

        const caseItem = response.data.data;
        res.render('cases/edit', {
            caseItem: caseItem,
            parties: parties,
        });


    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }
});



// Route to render the all users page
router.get('/all', async (req, res) => {
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get('/cases'); // Replace with your actual internal API endpoint

        const data = response.data;
        res.render('cases/all', {response: data});
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }

});
module.exports = router;

