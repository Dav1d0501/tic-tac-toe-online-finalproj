import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Lobby = ({ socket }) => {
  const [roomName, setRoomName] = useState('');
  const [size, setSize] = useState(3);
  const [availableRooms, setAvailableRooms] = useState([]); // רשימת החדרים
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // --- התיקון החשוב: בקשת רשימת חדרים מיד בכניסה ---
    socket.emit('get_rooms'); 
    // -----------------------------------------------

    // האזנה לעדכון ברשימת החדרים
    socket.on('update_rooms', (rooms) => {
        setAvailableRooms(rooms);
    });

    // האזנה לאישור כניסה לחדר
    const handleRoomJoined = (data) => {
      // מנווטים למשחק ושולחים את הפרטים
      navigate('/game/multiplayer', { 
        state: { 
          room: roomName, // משתמשים בשם שנשמר ב-State
          role: data.role, 
          size: data.size, 
          isHost: data.isHost 
        } 
      });
    };

    const handleError = (msg) => alert(msg);

    // רישום האירועים
    socket.on('room_joined', handleRoomJoined);
    socket.on('error_message', handleError);

    return () => {
      socket.off('update_rooms');
      socket.off('room_joined', handleRoomJoined);
      socket.off('error_message', handleError);
    };
  }, [socket, navigate, roomName]);

  // פונקציה ליצירת חדר
  const handleCreate = () => {
    if (!roomName) return alert("Please enter a room name");
    socket.emit("create_room", { roomId: roomName, size: size });
  };

  // פונקציה להצטרפות לחדר קיים מהרשימה
  const handleJoin = (roomId) => {
    setRoomName(roomId); // מעדכן את ה-State כדי שיועבר לדף הבא
    socket.emit("join_room", roomId);
  };

  return (
    <div className="app-container">
      <button onClick={() => navigate('/')} className="back-btn">⬅ Menu</button>
      <h1>Game Lobby 🌍</h1>
      
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* צד שמאל: יצירת חדר */}
        <div className="lobby-card">
          <h3>Create New Room ✨</h3>
          <input 
            type="text" 
            placeholder="Room Name..." 
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="input-field"
          />
          
          <div className="size-selector">
             {[3, 5, 10].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setSize(s)}
                  className={size === s ? 'active-size' : 'size-btn'}
                >
                  {s}x{s}
                </button>
             ))}
          </div>

          <button onClick={handleCreate} className="menu-btn create-btn">Create</button>
        </div>

        {/* צד ימין: רשימת חדרים */}
        <div className="lobby-card" style={{ minWidth: '300px' }}>
          <h3>Available Rooms 🚀</h3>
          
          {availableRooms.length === 0 ? (
              <p style={{ color: '#888' }}>No rooms available. Create one!</p>
          ) : (
              <div className="rooms-list">
                  {availableRooms.map((room) => (
                      <div key={room.id} className="room-item">
                          <div>
                              <strong>{room.id}</strong> 
                              <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '10px' }}>
                                  ({room.size}x{room.size})
                              </span>
                          </div>
                          <button 
                              onClick={() => handleJoin(room.id)}
                              disabled={room.playersCount >= 2}
                              className={`join-btn ${room.playersCount >= 2 ? 'full' : ''}`}
                          >
                              {room.playersCount}/2 {room.playersCount >= 2 ? 'FULL' : 'JOIN'}
                          </button>
                      </div>
                  ))}
              </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Lobby;