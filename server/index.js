const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config(); 
const connectDB = require('./config/db'); 
const userRoutes = require('./routes/userRoutes');

connectDB();
const app = express();
app.use(cors());
app.use(express.json()); 
app.use('/api/users', userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let rooms = {}; 

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
  
  // ברגע שמתחברים שולחים את הרשימה (טוב לריענון עמוד)
  broadcastRoomList();

  // --- תיקון לבעיית הלובי: בקשה יזומה לרשימת חדרים ---
  socket.on('get_rooms', () => {
      broadcastRoomList();
  });

  // --- פונקציית עזר לעזיבה ---
  const handlePlayerLeave = (roomId) => {
      const room = rooms[roomId];
      if (!room) return;

      // מחיקת השחקן מהרשימה ומהתפקידים
      room.players = room.players.filter(id => id !== socket.id);
      delete room.playersRoles[socket.id]; // <--- מחיקת התפקיד שלו (X או O)

      socket.leave(roomId);

      if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted (empty).`);
      } else {
          socket.to(roomId).emit("opponent_left");
          
          if (room.hostId === socket.id) {
              room.hostId = room.players[0]; 
              io.to(room.hostId).emit("you_are_host"); 
          }
      }
      broadcastRoomList();
  };

  // 1. יצירת חדר
  socket.on("create_room", ({ roomId, size }) => {
    if (rooms[roomId]) {
        socket.emit("error_message", "Room already exists!");
        return;
    }
    rooms[roomId] = {
        players: [socket.id],
        playersRoles: { [socket.id]: "X" }, // <--- ניהול תפקידים חכם
        size: parseInt(size),
        hostId: socket.id, 
    };
    socket.join(roomId);
    socket.emit("room_joined", { role: "X", size: parseInt(size), isHost: true });
    broadcastRoomList();
  });

  // 2. הצטרפות לחדר (התיקון הגדול כאן)
  socket.on("join_room", (roomId) => {
    const room = rooms[roomId];
    if (!room) {
        socket.emit("error_message", "Room does not exist!");
        broadcastRoomList();
        return;
    }
    if (room.players.length >= 2) {
        socket.emit("error_message", "Room is full!");
        return;
    }

    // --- לוגיקה חכמה לבחירת תפקיד ---
    // בודקים אילו תפקידים כבר תפוסים בחדר
    const takenRoles = Object.values(room.playersRoles);
    const newRole = takenRoles.includes("X") ? "O" : "X"; // אם יש X תביא O, אחרת תביא X

    room.players.push(socket.id);
    room.playersRoles[socket.id] = newRole; // שמירת התפקיד
    
    socket.join(roomId);
    
    // שליחת התפקיד שחישבנו (במקום סתם לשלוח O)
    socket.emit("room_joined", { role: newRole, size: room.size, isHost: false });
    
    socket.to(roomId).emit("player_joined_room");
    broadcastRoomList();
  });

  socket.on("send_move", (data) => {
    if (data.room) socket.to(data.room).emit("receive_move", data);
  });

  socket.on("reset_game", (roomId) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
       io.to(roomId).emit("reset_game");
    }
  });

  socket.on("leave_room", (roomId) => {
      handlePlayerLeave(roomId);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
        if (rooms[roomId].players.includes(socket.id)) {
            handlePlayerLeave(roomId);
            break; 
        }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});