# Real-Time Multiplayer Tic Tac Toe
### submitted by:
***דויד פרדקין, קיריל קולוטוב***

A full-stack Node.js and React application for real-time competitive gaming. This project features a robust multiplayer system using Socket.io, secure user authentication with Google OAuth, a live leaderboard, and a reciprocal friends system.

## Features

- **Real-Time Multiplayer**: Instant bidirectional communication using Socket.io
- **Smart Synchronization**: Custom handshake protocol to ensure data sync during race conditions
- **User Authentication**: Secure signup/login with JWT and Google OAuth
- **User Management**: Profile tracking with Wins, Losses, and Online status
- **Social System**: Reciprocal friend adding with duplicate prevention (MongoDB atomic operators)
- **Leaderboard**: Live tracking of top players ("The Champion")
- **Game Modes**: Online Multiplayer, Vs Computer (AI), and Local PvP
- **Responsive UI**: Modern Glassmorphism design built with React and Vite

## API Endpoints

### Authentication
- `POST /api/users/register` - Create new user account
- `POST /api/users/login` - User login with password
- `POST /api/users/google-login` - Authentication via Google OAuth

### Users & Social
- `GET /api/users/leaderboard` - Get top 10 players sorted by wins
- `POST /api/users/add-friend` - Add a user to friends list (Mutual update)
- `GET /api/users/friends/:userId` - Get specific user's friend list with online status

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm
- MongoDB (Local or Atlas)
- Google Cloud Credentials (Optional for Google Login)

### Step 1: Clone the repository
```bash
git clone https://github.com/Dav1d0501/tic-tac-toe-online-finalproj.git
cd tic-tac-toe-multiplayer
```

### Step 2: Backend Setup
Navigate to the server folder and install dependencies:
```bash
cd server
npm install
```

### Step 3: Frontend Setup
Navigate to the client folder and install dependencies:
```bash
cd ../client
npm install
```

### Step 4: Environment Setup

**Server Configuration**
Create a `.env` file in the `server` directory:
```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
# Optional
GOOGLE_CLIENT_ID=your_google_client_id
```

**Client Configuration**
Create a `.env` file in the `client` directory:
```env
VITE_SERVER_URL=http://localhost:3001
# Optional
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 5: Run the application

**Start the Server:**
```bash
cd server
npm run dev
```

**Start the Client:**
```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173` and the server on `http://localhost:3001`

## Usage Examples

### 1. Register a new user
```bash
POST http://localhost:3001/api/users/register
Content-Type: application/json

{
  "username": "Player",
  "email": "קexample@example.com",
  "password": "password123"
}
```

### 2. Login
```bash
POST http://localhost:3001/api/users/login
Content-Type: application/json

{
  "username": "Player",
  "password": "password123"
}
```

### 3. Add a Friend
```bash
POST http://localhost:3001/api/users/add-friend
Content-Type: application/json

{
  "userId": "64b1f7e8a97b...",
  "friendId": "64b2a98c123d..."
}
```
*Note: This endpoint updates both users' friend lists automatically.*

### 4. Get Leaderboard
```bash
GET http://localhost:3001/api/users/leaderboard
```

## Project Structure

```
tic-tac-toe-multiplayer/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI (Board, Cell, Loader)
│   │   ├── pages/              # Game Pages (Login, Lobby, GamePage)
│   │   ├── context/            # Global State (AuthContext)
│   │   ├── utils/              # Game Logic & AI Algorithms
│   │   ├── App.jsx             # Main Router
│   │   └── main.jsx            # Entry Point
│   ├── .env                    # Client Environment Variables
│   └── package.json
│
├── server/                     # Backend Application
│   ├── config/
│   │   └── db.js               # MongoDB Connection
│   ├── controllers/
│   │   └── userController.js   # Auth & Logic Handlers
│   ├── models/
│   │   └── User.js             # Mongoose Schema
│   ├── routes/
│   │   └── userRoutes.js       # API Routes
│   ├── index.js                # Server Entry & Socket.io Logic
│   ├── .env                    # Server Environment Variables
│   └── package.json
│
└── README.md
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - NoSQL Database
- **Mongoose** - ODM for MongoDB
- **React.js** - Frontend library (Vite)
- **Passport.js** - Authentication middleware
- **Bcrypt** - Password hashing

## User Flow

1. **Sign Up/Login** → Authenticate via Email or Google.
2. **Lobby** → View Leaderboard, Online Status, and Friends.
3. **Room Creation** → Host creates a unique room ID.
4. **Handshake** → Opponent joins; Client requests data sync (`req_opponent_data`).
5. **Gameplay** → Real-time moves broadcasted via Socket.io.
6. **Game Over** → Winner declared, stats updated in DB.
7. **Social** → Option to add opponent as a friend appears.

## 📊 Sample Data

### User Object
```json
{
  "_id": "64b1f7e8a9...",
  "username": "example",
  "email": "example@example.com",
  "password": "$2b$10$hashed_password...",
  "wins": 15,
  "losses": 3,
  "isOnline": true,
  "friends": [
    { "_id": "64b2a...", "username": "PlayerTwo", "wins": 10 }
  ],
  "createdAt": "2026-01-20T10:30:00Z"
}
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**David** - [GitHub Profile](https://github.com/Dav1d0501)

## 🙏 Acknowledgments

- [Socket.io Documentation](https://socket.io/docs/v4/)
