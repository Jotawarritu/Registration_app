const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patiladityab1008_db_user:A01052005a@cluster0.bxi6lwg.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema with Courses
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    courses: [{ type: String }] // Array of course names
});

const User = mongoose.model('User', userSchema);

// API Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = new User({ username, password, courses: [] });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.status(200).json({ message: 'Login successful', username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Data (Profile & Enrolled Courses)
app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ username: user.username, courses: user.courses || [] });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

// Enrollment: Add Course
app.post('/api/courses/add', async (req, res) => {
    try {
        const { username, courseName } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.courses.includes(courseName)) {
            return res.status(400).json({ error: 'Course already added' });
        }

        user.courses.push(courseName);
        await user.save();
        res.json({ message: 'Course added', courses: user.courses });
    } catch (err) {
        res.status(500).json({ error: 'Error adding course' });
    }
});

// Unenroll: Delete Course
app.delete('/api/courses/delete', async (req, res) => {
    try {
        const { username, courseName } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.courses = user.courses.filter(c => c !== courseName);
        await user.save();
        res.json({ message: 'Course deleted', courses: user.courses });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting course' });
    }
});

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
