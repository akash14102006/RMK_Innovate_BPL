/**
 * Backend Authentication Middleware
 * 
 * This file demonstrates how to verify Firebase ID tokens in a Node.js/Express backend.
 * This is required if you are connecting your React frontend to a custom backend.
 * 
 * Dependencies:
 * npm install firebase-admin express
 */

const admin = require('firebase-admin');
const express = require('express');
const router = express.Router();

// Initialize Firebase Admin (Required for backend)
// You need to generate a private key file from Firebase Console -> Project Settings -> Service Accounts
// const serviceAccount = require('./path/to/serviceAccountKey.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Mock initialization for demonstration
if (!admin.apps.length) {
    // admin.initializeApp(); 
    console.log('⚠️ Firebase Admin not initialized. Uncomment initialization code with real service account.');
}

/**
 * Middleware to verify Firebase ID Token
 */
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        // Verify the token with Firebase Admin SDK
        // const decodedToken = await admin.auth().verifyIdToken(token);

        // Mock verification for demonstration
        const decodedToken = { uid: 'mock-uid', email: 'user@example.com' };

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * GET /auth/me
 * Get current user details from token
 */
router.get('/me', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

/**
 * POST /auth/login
 * Note: In Firebase, login happens on the Client (Frontend).
 * The client sends the ID token to the backend for verification/session creation.
 */
router.post('/login', verifyToken, (req, res) => {
    // Token is already verified by middleware
    // You can now create a session cookie or just return success
    res.json({
        success: true,
        message: 'User authenticated successfully',
        user: req.user
    });
});

/**
 * POST /auth/logout
 * Handled primarily on client, but can revoke refresh tokens here
 */
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // await admin.auth().revokeRefreshTokens(req.user.uid);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;

/* updated */
