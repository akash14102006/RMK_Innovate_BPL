/**
 * Backend Google Token Verification
 * 
 * This file demonstrates how to verify the Google ID Token sent from the frontend.
 * 
 * Dependencies:
 * npm install google-auth-library express
 */

const { OAuth2Client } = require('google-auth-library');
const express = require('express');
const router = express.Router();

const CLIENT_ID = '16015111956-u63el706kb1h8fjlecf943vdrkdht4vf.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

/**
 * POST /auth/google
 * Verifies the Google ID Token and creates a session
 */
router.post('/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'No credential provided' });
    }

    try {
        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        });

        const payload = ticket.getPayload();
        const userid = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture'];

        // If request specified a G Suite domain:
        // const domain = payload['hd'];

        console.log('✅ User verified:', email);

        // TODO: Check if user exists in your DB
        // const user = await db.findUserByEmail(email);
        // if (!user) await db.createUser({ email, name, picture });

        // Create your own session/JWT here
        // const sessionToken = createSession(userid);

        res.json({
            success: true,
            user: {
                email,
                name,
                picture,
                id: userid
            },
            // token: sessionToken
        });

    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;

/* updated */
