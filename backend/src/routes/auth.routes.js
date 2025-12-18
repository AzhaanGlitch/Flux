import { Router } from "express";
import { OAuth2Client } from 'google-auth-library';
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const router = Router();

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth callback endpoint
router.post("/google", async (req, res) => {
    try {
        const { token } = req.body;
        
        console.log("Received Google token request");
        
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        console.log("Google payload verified:", payload.email);
        
        // Extract user information
        const {
            email,
            name,
            picture,
            sub: googleId
        } = payload;
        
        // Check if user exists
        let user = await User.findOne({ username: email });
        
        if (!user) {
            // Create new user with Google info
            const randomPassword = crypto.randomBytes(16).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            user = new User({
                name: name,
                username: email, // Using email as username for Google users
                password: hashedPassword,
                googleId: googleId,
                profilePicture: picture
            });
            
            await user.save();
            console.log("New user created:", user.username);
        } else {
            // Update existing user with Google ID if not present
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
            console.log("Existing user found:", user.username);
        }
        
        // Generate auth token
        const authToken = crypto.randomBytes(20).toString("hex");
        user.token = authToken;
        await user.save();
        
        res.status(200).json({
            token: authToken,
            user: {
                name: user.name,
                username: user.username
            }
        });
        
    } catch (error) {
        console.error("Google OAuth error:", error);
        
        if (error.message && error.message.includes('Token used too late')) {
            return res.status(401).json({ message: "Token expired. Please try again." });
        }
        
        res.status(401).json({ 
            message: "Invalid token or authentication failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;