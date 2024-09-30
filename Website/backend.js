const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors({
    origin: ['http://127.0.0.1:3001/','http://localhost:3000/login'], // Replace with your Vercel app URL 
    credentials: true // If you need to send cookies or authorization headers
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 86400000, // 24 hours
        secure: false // Set secure to true in production with HTTPS
    }
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'K@rtik2004', // Replace with your actual password
    database: 'arcredentials'
});

// Connect to the database
db.connect(err => {
    if (err) throw err;
    console.log('Connected to SQL database');
});

// Login Route
app.post('/login', (req, res) => {
    const { MoodleId, Password } = req.body;

    // Check if both MoodleId and Password are provided
    if (!MoodleId || !Password) {
        return res.json({ success: false, message: 'MoodleId and Password are required' });
    }

    // Query to find the user
    const query = 'SELECT * FROM users WHERE MoodleId = ? AND Password = SHA2(?, 256)';
    db.query(query, [MoodleId, Password], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.json({ success: false, message: 'Internal server error' });
        }

        // If user found, create a session
        if (result.length > 0) {
            req.session.authenticated = true;
            req.session.user = result[0];

            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.json({ success: false, message: 'Session save error' });
                }
                res.json({ success: true, message: 'Login successful' });
            });
        } else {
            res.json({ success: false, message: 'Invalid Moodle Id or Password' });
        }
    });
});

// Auth Check Route
app.get('/check-auth', (req, res) => {
    console.log('Session ID:', req.sessionID); // Log the session ID
    console.log('Session data:', req.session); // Log the session data

    // Check if the user is authenticated
    if (req.session.authenticated) {
        return res.json({ isAuthenticated: true, user: req.session.user });
    } else {
        return res.json({ isAuthenticated: false });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
