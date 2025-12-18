# FLUX - Video Conferencing Platform

A modern, real-time video conferencing platform featuring synchronized media playback, HD video calls, live chat, and screen sharing capabilities. Built with React, Node.js, Socket.io, and WebRTC.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Functionality
- Real-time HD video conferencing using WebRTC
- Synchronized media playback for watch parties
- Low-latency peer-to-peer connections
- Live text chat with emoji support
- Screen sharing capabilities
- Meeting history management
- Cross-platform compatibility (Web, iOS, Android)

### User Features
- User authentication with email/password
- Google OAuth integration
- Unique meeting code generation
- Meeting history tracking
- Participant management
- Responsive design for all devices

### Technical Features
- End-to-end encrypted video/audio streams
- Socket.io for real-time communication
- MongoDB for data persistence
- JWT-based authentication
- Rate limiting and security measures

## Technology Stack

### Frontend
- React 18.2.0
- Material-UI 5.15.4
- Socket.io Client 4.7.3
- Three.js 0.160.0 (for visual effects)
- React Router DOM 6.21.1
- Axios 1.6.5
- Framer Motion 12.23.26

### Backend
- Node.js with Express 4.18.2
- Socket.io 4.7.3
- MongoDB with Mongoose 8.0.3
- bcrypt 5.1.1 (for password hashing)
- WebRTC (via native browser APIs)

### DevOps
- Render (for deployment)
- GitHub Actions (for CI/CD)
- MongoDB Atlas (cloud database)

## System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ◄─────► │   Backend   │ ◄─────► │   MongoDB   │
│   (React)   │  HTTP   │  (Node.js)  │  CRUD   │   (Atlas)   │
└─────────────┘         └─────────────┘         └─────────────┘
       │                        │
       │   Socket.io            │
       ▼                        ▼
┌─────────────────────────────────────┐
│      Real-time Communication        │
│   (Video, Audio, Chat, Screen)      │
└─────────────────────────────────────┘
```

### Communication Flow
1. User authenticates via REST API
2. Socket.io establishes WebSocket connection
3. WebRTC creates peer-to-peer connections for media
4. Socket.io relays signaling data for WebRTC setup
5. MongoDB stores user data and meeting history

## Prerequisites

Before installation, ensure you have:

- Node.js (version 16.0.0 or higher)
- npm (version 7.0.0 or higher)
- MongoDB Atlas account (or local MongoDB installation)
- Git
- A code editor (VS Code recommended)

### Optional
- Google Cloud Console account (for OAuth)
- Python 3.x (for keep-alive script)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/flux-video-conferencing.git
cd flux-video-conferencing
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Environment Configuration

### Backend Configuration

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a `.env` file by copying the example:
```bash
cp .env.example .env
```

3. Configure the following environment variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# Google OAuth 2.0 (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Session Secret
SESSION_SECRET=your_session_secret_key

# Token Expiry (in seconds)
TOKEN_EXPIRY=604800
```

#### MongoDB Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Copy the connection string and replace in `MONGODB_URI`

#### JWT Secret Generation
Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Configuration

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Create a `.env` file:
```bash
touch .env
```

3. Add the backend URL:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
NODE_ENV=development
```

### Purpose of environment.js

The `frontend/src/environment.js` file serves as a centralized configuration manager for API endpoints:

- **Development Mode**: Points to local backend (`http://localhost:8000`)
- **Production Mode**: Points to deployed backend (Render URL)
- **Automatic Switching**: Uses `process.env.NODE_ENV` to determine environment
- **Single Source of Truth**: All API calls reference this file

```javascript
// Automatically switches based on build environment
const IS_PROD = process.env.NODE_ENV === 'production';
const server = IS_PROD ? PRODUCTION_SERVER : DEVELOPMENT_SERVER;
```

## Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```
Server will run on `http://localhost:8000`

#### Start Frontend Development Server
```bash
cd frontend
npm start
```
Application will open at `http://localhost:3000`

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Run Backend in Production Mode
```bash
cd backend
npm start
```

## Deployment

### Deploying to Render

Render free tier automatically sleeps after 15 minutes of inactivity. This guide includes solutions to keep your service alive.

#### Step 1: Prepare for Deployment

1. Ensure all environment variables are configured
2. Push your code to GitHub
3. Verify `render.yaml` configuration file exists

#### Step 2: Deploy Backend

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: flux-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Add all variables from `.env`

#### Step 3: Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: flux-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Environment Variables**: Add `REACT_APP_BACKEND_URL` with your backend URL

#### Step 4: Keeping Render Active

Render's free tier services sleep after 15 minutes of inactivity. Use one of these methods:

##### Method 1: GitHub Actions (Recommended)

1. Create `.github/workflows/keep-alive.yml` in your repository
2. Add the workflow file content (provided in artifacts)
3. In GitHub repository settings:
   - Go to Settings → Secrets and variables → Actions
   - Add secret: `BACKEND_URL` with value `https://your-backend-url.onrender.com`
4. The action will ping your server every 10 minutes

##### Method 2: Python Script

1. Install the `keep_alive.py` script on an always-on service (PythonAnywhere, Replit, local machine)
2. Update the `BACKEND_URL` in the script
3. Run continuously:
```bash
python keep_alive.py
```

##### Method 3: UptimeRobot (External Service)

1. Sign up at [UptimeRobot](https://uptimerobot.com/)
2. Create a new monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://your-backend-url.onrender.com/health`
   - Monitoring Interval: 5 minutes
3. UptimeRobot will ping your service automatically

##### Method 4: Cron-Job.org

1. Sign up at [Cron-Job.org](https://cron-job.org/)
2. Create a new cron job:
   - URL: `https://your-backend-url.onrender.com/health`
   - Execution Schedule: Every 10 minutes
3. Enable email notifications on failure

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "password": "securepassword123"
}

Response: 201 Created
{
  "message": "User Registered"
}
```

#### Login User
```http
POST /api/v1/users/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Meeting Endpoints

#### Get User History
```http
GET /api/v1/users/get_all_activity?token=YOUR_TOKEN

Response: 200 OK
[
  {
    "_id": "...",
    "user_id": "johndoe",
    "meetingCode": "ABC123XY",
    "date": "2024-01-15T10:30:00.000Z"
  }
]
```

#### Add to History
```http
POST /api/v1/users/add_to_activity
Content-Type: application/json

{
  "token": "YOUR_TOKEN",
  "meeting_code": "ABC123XY"
}

Response: 201 Created
{
  "message": "Added code to history"
}
```

#### Delete Meeting
```http
DELETE /api/v1/users/delete_meeting/ABC123XY?token=YOUR_TOKEN

Response: 200 OK
{
  "message": "Meeting deleted successfully"
}
```

#### Delete All Meetings
```http
DELETE /api/v1/users/delete_all_meetings?token=YOUR_TOKEN

Response: 200 OK
{
  "message": "All meetings deleted successfully"
}
```

### Health Check
```http
GET /health

Response: 200 OK
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Socket.io Events

#### Client → Server

- `join-call`: Join a meeting room
- `signal`: WebRTC signaling data exchange
- `chat-message`: Send chat message
- `disconnect`: Leave meeting

#### Server → Client

- `user-joined`: New participant joined
- `user-left`: Participant left
- `signal`: WebRTC signaling data
- `chat-message`: Receive chat message

## Project Structure

```
flux-video-conferencing/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── socketManager.js       # Socket.io connection handling
│   │   │   └── user.controller.js     # User authentication logic
│   │   ├── models/
│   │   │   ├── user.model.js          # User schema
│   │   │   └── meeting.model.js       # Meeting schema
│   │   ├── routes/
│   │   │   └── users.routes.js        # API route definitions
│   │   └── app.js                     # Express server setup
│   ├── .env                           # Environment variables
│   ├── .env.example                   # Environment template
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── puma.jpeg                  # Landing page image
│   │   ├── thor.png                   # Home page image
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── FloatingLines.jsx      # Animated background
│   │   │   ├── Navbar.jsx             # Navigation component
│   │   │   ├── Footer.jsx             # Footer component
│   │   │   └── ScrollToTop.jsx        # Scroll utility
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # Authentication state
│   │   ├── pages/
│   │   │   ├── landing.jsx            # Landing page
│   │   │   ├── login.jsx              # Authentication page
│   │   │   ├── home.jsx               # Home dashboard
│   │   │   ├── history.jsx            # Meeting history
│   │   │   ├── VideoMeet.jsx          # Video conference room
│   │   │   ├── Features.jsx           # Features page
│   │   │   ├── About.jsx              # About page
│   │   │   └── legal/                 # Legal documents
│   │   ├── styles/                    # CSS stylesheets
│   │   ├── utils/                     # Utility functions
│   │   ├── environment.js             # API endpoint config
│   │   ├── App.js                     # Main app component
│   │   └── index.js                   # React entry point
│   ├── .env                           # Frontend environment
│   ├── .env.production                # Production config
│   └── package.json
├── .github/
│   └── workflows/
│       └── keep-alive.yml             # GitHub Actions workflow
├── keep_alive.py                      # Python keep-alive script
├── render.yaml                        # Render deployment config
└── README.md
```

## Security Considerations

### Implemented Security Measures

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: Token-based session management
3. **CORS Protection**: Configured allowed origins
4. **Rate Limiting**: Prevents API abuse
5. **Input Validation**: Sanitizes user inputs
6. **Environment Variables**: Sensitive data not in source code

### Best Practices

- Never commit `.env` files to version control
- Rotate JWT secrets regularly in production
- Use HTTPS in production (Render provides this)
- Implement request rate limiting
- Regularly update dependencies
- Monitor application logs for suspicious activity

## Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Kill the process if needed
kill -9 <PID>

# Verify MongoDB connection string
# Ensure IP whitelist includes your address
```

#### Frontend can't connect to backend
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS configuration in backend
# Verify FRONTEND_URL in backend .env matches frontend URL
```

#### WebRTC connection fails
- Ensure HTTPS is used in production (required by browsers)
- Check firewall settings
- Verify ICE server configuration
- Test with different browsers

#### Render deployment fails
- Check build logs for errors
- Verify all environment variables are set
- Ensure Node.js version compatibility
- Check MongoDB Atlas IP whitelist

## Performance Optimization

### Backend
- Implement caching for frequently accessed data
- Use connection pooling for MongoDB
- Compress responses with gzip
- Implement CDN for static assets

### Frontend
- Code splitting with React.lazy
- Image optimization
- Minimize bundle size
- Use production build for deployment

### WebRTC
- Implement adaptive bitrate
- Use TURN servers for NAT traversal
- Optimize video resolution based on bandwidth

## Contributing

We welcome contributions to FLUX! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Write unit tests for new features

## Testing

### Running Tests

#### Backend Tests
```bash
cd backend
npm test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## License

This project is licensed under the ISC License. See LICENSE file for details.

## Acknowledgments

- WebRTC for real-time communication
- Socket.io for bidirectional event-based communication
- MongoDB for flexible data storage
- React team for the frontend framework
- Material-UI for component library

## Support

For issues, questions, or contributions:

- Email: azhaanalisiddiqui15@gmail.com
- GitHub Issues: [Project Issues](https://github.com/AzhaanGlitch/Flux/issues)

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Core video conferencing features
- User authentication
- Meeting history
- Synchronized media playback
- Chat and screen sharing

---

Built with dedication by Azhaan Ali Siddiqui