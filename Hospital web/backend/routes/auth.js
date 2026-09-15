const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Mock user database (replace with PostgreSQL/MongoDB in production)
const users = [];

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields (email, password, name) are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString()
    };

    users.push(user);

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Return success response
    res.status(201).json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        }
    });
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Return success response
    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        }
    });
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return user info
 */
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user (in production, query database)
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;

/* updated */
