# Real-Time Multiplayer Tic Tac Toe (ArenaX)

Submitted by: **דויד פרדקין, קיריל קולוטוב**

A full-stack React and Node.js game. Real-time multiplayer over Socket.io, user accounts with
password or Google sign-in, a live leaderboard, and a mutual friends system. Board sizes 3x3,
5x5 and 10x10 are supported by the same generic win-detection logic.

**Live:**
Client (Vercel): https://tic-tac-toe-online-finalproj.vercel.app
Server (Render): https://tic-tac-toe-online-finalproj.onrender.com

## Features

- **Three game modes**: online multiplayer, vs computer (AI), and local two-player on one screen
- **Real-time play**: bidirectional communication over Socket.io rooms, plus in-game text chat
- **Handshake protocol**: the client re-requests opponent data on mount (`req_opponent_data`), so
  player details are never lost to event timing
- **Server-side authority**: X/O roles, host privileges, and game-over reporting are decided by the server
- **AI opponent**: Minimax with depth-weighted scoring on 3x3 hard, heuristic search on larger boards
- **Accounts**: bcrypt-hashed passwords or Google OAuth sign-in
- **Social**: mutual friend adding, online status, and a top-10 leaderboard
- **Account management**: email update and permanent account deletion

## Tech Stack

**Client**: React 19, Vite, React Router 7, socket.io-client, @react-oauth/google, jwt-decode
**Server**: Node.js, Express 5, Socket.io 4, Mongoose, bcryptjs, cors, dotenv
**Database**: MongoDB

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/users/register` | Create a new account |
| POST | `/api/users/login` | Login with username and password |
| POST | `/api/users/google-login` | Login or auto-register via Google |
| GET | `/api/users/leaderboard` | Top 10 players by wins |
| POST | `/api/users/add-friend` | Add a friend (updates both users) |
| GET | `/api/users/friends/:userId` | Friend list with online status |
| PATCH | `/api/users/update-email` | Update email address |
| DELETE | `/api/users/delete` | Delete account and clean up references |

## Socket Events

| Event | Direction | Purpose |
|---|---|---|
| `user_connected` | client to server | Mark user online in the database |
| `create_room` / `join_room` | client to server | Room lifecycle |
| `room_joined` / `game_start` | server to client | Assigned role, board size, host flag |
| `req_opponent_data` / `opponent_data` | both | Opponent sync handshake |
| `send_move` / `receive_move` | both | Move relay (excludes the sender) |
| `send_message` / `receive_message` | both | Chat relay (includes the sender) |
| `game_over` | client to server | Host-only stats reporting |
| `reset_game` | both | New game, host only |
| `leave_room` / `opponent_left` / `you_are_host` | both | Disconnect handling and host migration |

## Setup

### Prerequisites

Node.js v14 or higher, npm, and a MongoDB instance (local or Atlas).
A Google Cloud OAuth client ID is optional and only needed for Google sign-in.

### Install

```bash
git clone https://github.com/Dav1d0501/tic-tac-toe-online-finalproj.git
cd tic-tac-toe-online-finalproj

cd server && npm install
cd ../client && npm install
```

### Environment

`server/.env`:

```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
```

`client/.env`:

```env
VITE_SERVER_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Note: `VITE_` variables are inlined at build time, so changing them requires a rebuild.

### Run

```bash
cd server && npm run dev    # http://localhost:3001
cd client && npm run dev    # http://localhost:5173
```

To test online play locally, open a second browser window in private mode, since the session is
stored in `localStorage`.

## Project Structure

```
tic-tac-toe-online-finalproj/
├── client/
│   ├── src/
│   │   ├── components/Board.jsx     # Game board, moves, chat, add friend
│   │   ├── Pages/                   # AuthPage, HomePage, Lobby, GamePage
│   │   ├── utils/gameLogic.js       # Generic NxN win detection
│   │   ├── utils/computerAI.js      # Minimax and heuristic AI
│   │   ├── App.jsx                  # Router, socket instance, route guard
│   │   └── main.jsx                 # Entry point, Google OAuth provider
│   └── package.json
│
├── server/
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/userController.js
│   ├── models/User.js               # Mongoose schema
│   ├── routes/userRoutes.js
│   ├── index.js                     # Express app and all Socket.io logic
│   └── package.json
│
└── README.md
```

## User Data Model

```json
{
  "_id": "64b1f7e8a9...",
  "username": "example",
  "email": "example@example.com",
  "password": "$2b$10$hashed_password...",
  "googleId": "1078...",
  "wins": 15,
  "losses": 3,
  "isOnline": true,
  "friends": ["64b2a98c123d..."],
  "createdAt": "2026-01-20T10:30:00Z"
}
```

Passwords are stored as bcrypt hashes with 10 salt rounds and are never returned to the client.
The `password` field is optional so that Google users can be created without one.

## Deployment

The client is built with `vite build` and served as static files from Vercel. The server runs as a
persistent Node process on Render and listens on `process.env.PORT`, which Socket.io requires in
order to hold open connections.

## License

MIT
