// usersRoutes.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const ejs = require('ejs');
const fs = require('fs');
const caseService = require('../../blockchain_services/caseServices.js');
const evidenceService = require('../../blockchain_services/evidenceServices.js');


const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Replace with your actual base URL
});

router.get('/', async (req, res) => {
    res.render('reports/example');

});

router.get('/print', async (req, res) => {
    const templateContent = fs.readFileSync('views/reports/example.ejs', 'utf-8');

    // Compile the EJS template
    const compiledTemplate = ejs.compile(templateContent);

    // Generate HTML from the compiled template
    const htmlContent = compiledTemplate({ /* any data you want to pass to the template */});

    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(htmlContent);

    // Generate PDF
    const pdfBuffer = await page.pdf({format: 'A4'});

    // Save the PDF to a file
    fs.writeFileSync('output2.pdf', pdfBuffer);

    // Close the browser
    await browser.close();

    console.log('PDF generated successfully!');


});
router.get('/:id', async (req, res) => {
    const caseId = req.params.id;
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get(`/reports/${caseId}`);
        const caseItem = response.data.data;
        caseItem.CaseOfficers.forEach(caseOfficer => {
            console.log("caseItem", caseOfficer);
        });


        res.render('reports/report', {caseItem: caseItem});

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }
});
router.get('/:id/transactions', async (req, res) => {
    const caseId = req.params.id;

    try {
        // Fetch case data using the internal API endpoint
        const response = await apiClient.get(`/reports/${caseId}`);
        const caseItem = response.data.data;

        // Use Promise.all to wait for both promises to resolve
        const [caseTransactions, evidenceHashes] = await Promise.all([
            caseService.getCaseById(caseId),
            evidenceService.getAllEvidence(caseId)
        ]);

    
        // Render the page after both promises have resolved
        res.render('reports/case-transactions', {
            caseItem: caseItem,
            evidenceHashes: evidenceHashes,
            caseTransactions: caseTransactions,
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send(error);
    }
});

router.get('/:id/print', async (req, res) => {
    const caseId = req.params.id;
    try {
        // Make a request to the internal API endpoint to fetch user data
        const response = await apiClient.get(`/reports/${caseId}`);
        const caseItem = response.data.data;
        caseItem.CaseOfficers.forEach(caseOfficer => {
            console.log("caseItem", caseOfficer);
        });


        res.render('reports/report-2', {caseItem: caseItem});

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send(error);
    }
});
router.get('/generate-pdf', async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content, for example, your HTML template
    const content = '<h1>Hello, this is your PDF content!</h1>';
    await page.setContent(content);

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });

    // Send the PDF as a response
    res.type('application/pdf').send(pdfBuffer);

    // Close the browser
    await browser.close();
});

module.exports = router;

