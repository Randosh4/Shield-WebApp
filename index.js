// app.js
const express = require('express');
const cors = require('cors');

const {sequelize} = require('./models');
const userRoutes = require('./routes/userRoutes');
const partyRoutes = require('./routes/parties/partyRoutes');
const partyFrontRoutes = require('./routes/parties/frontRoutes');
const caseRoutes = require('./routes/cases/caseRoutes');
const caseFrontRoutes = require('./routes/cases/frontRoutes');
const authRoutes = require('./routes/auth/authRoutes');
const evidenceRoutes = require('./routes/evidences/evidenceRoutes');
const evidencesFrontRoutes = require('./routes/evidences/frontRoutes');
const officerRoutes = require('./routes/officers/officerRoutes');
const officerFrontRoutes = require('./routes/officers/frontRoutes');
const authFrontRoutes = require('./routes/auth/frontRoutes');
const reportFrontRoutes = require('./routes/reports/frontRoutes');
const reportRoutes = require('./routes/reports/reportRoutes');
const verifyToken = require('./middlewares/verifyToken');
const path = require('path');
const ejs = require('ejs');

const http = require('http');

const caseService = require('./blockchain_services/caseServices');

const app = express();
const port = 8000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const multer = require('multer');
const axios = require("axios");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


const upload = multer({storage: storage});

app.use('/api/users', userRoutes);
//app.use('/api/officers', verifyToken, officerRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidences', evidenceRoutes);
app.use('/api/reports', reportRoutes);


app.use('/officers', officerFrontRoutes);
app.use('/parties', partyFrontRoutes);
app.use('/evidences', evidencesFrontRoutes);
app.use('/cases', caseFrontRoutes);
app.use('/auth', authFrontRoutes);
app.use('/reports', reportFrontRoutes);


const maxRetries = 3;
let retryCount = 0;

function startServer() {

    sequelize.sync()
        .then(() => {
            // Start the Express app after the database connection is established
            app.listen(port, () => {
                console.log('Running Listening to port: ' + port);
            });
        })
        .catch(error => {
            console.error('Unable to connect to the database:', error);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying in 3 seconds (attempt ${retryCount} of ${maxRetries})...`);
                setTimeout(startServer, 3000); // Retry after 3 seconds
            } else {
                console.error('Max retries reached. Exiting...');
                process.exit(1); // Exit the process after max retries
            }
        });

}

startServer();
app.get('/', (req, res) => {
    res.render('home');
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    res.send("Done");
});

app.get('/api/test', async (req, res) => {
    axios.get("http://localhost:3000/api/cases").then((response) => {
        console.log(response.data);
        res.send(response.data);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    })

});
