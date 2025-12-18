import mongoose, { Schema } from "mongoose";

const userScheme = new Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        token: { type: String },
        googleId: { type: String, unique: true, sparse: true }, // Added for Google OAuth
        profilePicture: { type: String } // Added for Google profile picture
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
)

const User = mongoose.model("User", userScheme);

export { User };