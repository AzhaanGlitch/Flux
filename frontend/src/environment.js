// Environment configuration for frontend
// This file determines which backend URL to use based on the environment

// Set to true for production, false for local development
const IS_PROD = process.env.NODE_ENV === 'production';

// Production backend URL (deployed on Render)
const PRODUCTION_SERVER = process.env.REACT_APP_BACKEND_URL || "https://your-app-name.onrender.com";

// Local development backend URL
const DEVELOPMENT_SERVER = "http://localhost:8000";

// Export the appropriate server URL
const server = IS_PROD ? PRODUCTION_SERVER : DEVELOPMENT_SERVER;

export default server;