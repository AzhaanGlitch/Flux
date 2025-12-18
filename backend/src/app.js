import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// Port configuration
const PORT = process.env.PORT || 8000;

// CORS configuration - MUST BE BEFORE ROUTES
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS FIRST
app.use(cors(corsOptions));

// Then parse JSON bodies
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Health check endpoint for Render
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

// API routes - NOW AFTER CORS
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ 
        message: "Internal server error", 
        error: process.env.NODE_ENV === "development" ? err.message : undefined 
    });
});

const start = async () => {
    try {
        // Validate environment variables
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        // Connect to MongoDB
        const connectionDb = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${connectionDb.connection.host}`);
        
        // Start server
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
    server.close(() => process.exit(1));
});

start();