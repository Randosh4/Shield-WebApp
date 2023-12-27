const express = require('express')

const app = express()
const db = require('./models');
const {User} = require('./models');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cors = require('cors');

const port = 8000;
var upload = multer();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true})); // Add this middleware to handle form data


app.use(cors());
app.use(express.json());
app.use(upload.array());
app.use(express.static('public'));
db.sequelize.sync().then((req) => {
    app.listen(port, () => {
        console.log('Running Listening to port: ' + port)
    })
})

app.get("/", (req, res) => {
    res.json("Welcome")
})

app.get("/api/users", (req, res) => {

    User.findAll().then((users) => {
        res.json(users)
    }).catch(err => {
        if (err) {
            console.log(err);
        }
    })
})

app.post('/api/register', async (req, res) => {
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


app.post('/api/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await User.findOne({where: {email}});

        if (!user) {
            return res.status(403).json({error: 'Invalid credentials'});
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        res.json({
            message: 'Login successful',
            data: user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

