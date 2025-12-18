import { Router } from "express";
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth callback endpoint
router.post("/google", async (req, res) => {
    try {
        const { token } = req.body;
        
        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        
        // Extract user information
        const {
            email,
            name,
            picture,
            sub: googleId
        } = payload;
        
        // Check if user exists or create new user
        let user = await User.findOne({ email });
        
        if (!user) {
            user = new User({
                name,
                username: email.split('@')[0],
                email,
                googleId,
                profilePicture: picture,
                password: await bcrypt.hash(Math.random().toString(36), 10) // Random password
            });
            await user.save();
        }
        
        // Generate JWT token
        const authToken = crypto.randomBytes(20).toString("hex");
        user.token = authToken;
        await user.save();
        
        res.status(200).json({
            token: authToken,
            user: {
                name: user.name,
                email: user.email,
                username: user.username
            }
        });
        
    } catch (error) {
        console.error("Google OAuth error:", error);
        res.status(401).json({ message: "Invalid token" });
    }
});

export default router;