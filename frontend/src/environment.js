const IS_PROD = process.env.NODE_ENV === 'production';

const PRODUCTION_SERVER = process.env.REACT_APP_BACKEND_URL || "https://flux-backend-nfw3.onrender.com";

const DEVELOPMENT_SERVER = "http://localhost:8000";

const server = IS_PROD ? PRODUCTION_SERVER : DEVELOPMENT_SERVER;

export default server;