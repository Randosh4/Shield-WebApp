// app.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const { sequelize } = require('./models');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use(upload.array());
app.use(express.static('public'));

app.use('/api/users', userRoutes);

// Sync the Sequelize models with the database
sequelize.sync().then(() => {
    // Start the Express app after the database connection is established
    app.listen(port, () => {
        console.log('Running Listening to port: ' + port);
    });
}).catch(error => {
    console.error('Unable to connect to the database:', error);
});

app.get("/", (req, res) => {
    res.json("Welcome");
});
