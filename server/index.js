const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config(); 
const connectDB = require('./config/db'); 
const userRoutes = require('./routes/userRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json()); 
app.use('/api/users', userRoutes);

const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connection from Vercel client
    methods: ["GET", "POST"],
  },
});

// In-memory room storage
let rooms = {}; 

// Helper: Send room list to all clients
const broadcastRoomList = () => {
    const roomList = Object.keys(rooms).map((key) => ({
        id: key,
        playersCount: rooms[key].players.length,
        size: rooms[key].size
    }));
    io.emit('update_rooms', roomList);
};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);
  
  // Send initial room list
  broadcastRoomList();

  // --- Room Management ---

  socket.on('get_rooms', () => {
      broadcastRoomList();
  });

  socket.on("create_room", ({ roomId, size }) => {
    if (rooms[roomId]) {
        socket.emit("error_message", "Room already exists!");
        return;
    }
    // Initialize new room
    rooms[roomId] = {
        players: [socket.id],
        playersRoles: { [socket.id]: "X" }, // Creator gets X
        size: parseInt(size),
        hostId: socket.id, 
    };
    socket.join(roomId);
    
    // Notify creator
    socket.emit("room_joined", { role: "X", size: parseInt(size), isHost: true });
    broadcastRoomList();
  });

  socket.on("join_room", (roomId) => {
    const room = rooms[roomId];
    
    // Validation
    if (!room) {
        socket.emit("error_message", "Room does not exist!");
        broadcastRoomList(); 
        return;
    }
    if (room.players.length >= 2) {
        socket.emit("error_message", "Room is full!");
        return;
    }

    // Smart role assignment
    const takenRoles = Object.values(room.playersRoles);
    const newRole = takenRoles.includes("X") ? "O" : "X"; 

    // Update room data
    room.players.push(socket.id);
    room.playersRoles[socket.id] = newRole; 
    
    socket.join(roomId);
    
    // Notify joiner
    socket.emit("room_joined", { role: newRole, size: room.size, isHost: false });
    
    // Notify opponent
    socket.to(roomId).emit("player_joined_room");
    broadcastRoomList();
  });

  // --- Game Logic ---

  socket.on("send_move", (data) => {
    if (data.room) socket.to(data.room).emit("receive_move", data);
  });

  socket.on("reset_game", (roomId) => {
    const room = rooms[roomId];
    // Only host can reset
    if (room && room.hostId === socket.id) {
       io.to(roomId).emit("reset_game");
    }
  });

  // --- Disconnect Handling ---

  const handlePlayerLeave = (roomId) => {
      const room = rooms[roomId];
      if (!room) return;

      // Remove player and role
      room.players = room.players.filter(id => id !== socket.id);
      delete room.playersRoles[socket.id]; 

      socket.leave(roomId);

      if (room.players.length === 0) {
          // Delete empty room
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted.`);
      } else {
          // Notify remaining player
          socket.to(roomId).emit("opponent_left");
          
          // Migrate host if needed
          if (room.hostId === socket.id) {
              room.hostId = room.players[0]; 
              io.to(room.hostId).emit("you_are_host"); 
          }
      }
      broadcastRoomList();
  };

  socket.on("leave_room", (roomId) => {
      handlePlayerLeave(roomId);
  });

  socket.on('disconnect', () => {
    // Find room the user was in
    for (const roomId in rooms) {
        if (rooms[roomId].players.includes(socket.id)) {
            handlePlayerLeave(roomId);
            break; 
        }
    }
    console.log(`User Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});