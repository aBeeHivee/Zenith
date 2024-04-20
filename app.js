const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session'); // Import express-session
const path = require('path');
const app = express();
const ejs = require("ejs");

app.set('view engine', 'ejs');
const port = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/pro')
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB: ", err);
  });

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String
});

const User = mongoose.model('User', userSchema);

const profileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    institute: String,
    about: String,
    dateOfBirth: Date,
    country: String,
    phone: String
});

const Profile = mongoose.model('Profile', profileSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Add express-session middleware
app.use(session({
  secret: "1234",
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

app.get('/', (req, res) => {
    res.render("welcome");
});
app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/signup", function (req, res) {
    res.render("signup");
});

app.get("/userprofile", function (req, res) {
    res.render("userprofile");
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!isValidUsername(username)) {
        return res.status(400).json({ error: 'Invalid username' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    try {
        const user = await User.create({ username, email, password });
        res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
        console.error('Error creating user: ', err);
        res.status(500).json({ error: 'Error creating user' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            req.session.user = user; // Store user information in session
            res.status(200).json({ message: 'Login successful', user });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Error logging in: ', err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

app.post('/userprofile', async (req, res) => {
    try {
        const { username, email, password, name, institute, about, dateOfBirth, country, phone } = req.body;
        const newUser = await User.create({ username, email, password });
        const profile = await Profile.create({ user: newUser._id, name, institute, about, dateOfBirth, country, phone });
        res.status(201).json({ message: 'User profile saved successfully', newUser, profile });
    } catch (err) {
        console.error('Error saving user profile: ', err);
        res.status(500).json({ error: 'Error saving user profile' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
