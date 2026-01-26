import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './Lobby.css'; 

const Lobby = ({ socket }) => {
  const [roomName, setRoomName] = useState('');
  const [size, setSize] = useState(3);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // State for new features (Leaderboard & Friends)
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends, setFriends] = useState([]);

  // --- State למחיקת משתמש ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  
  const navigate = useNavigate();
  
  // Use environment variable for production, localhost for dev
  const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

  // --- Initial Data Fetching & Polling ---
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    // Initial fetch
    if (storedUser) {
        fetchFriends(storedUser._id);
    }
    fetchLeaderboard();

    // Polling: Refresh leaderboard and friends status every 10 seconds
    const interval = setInterval(() => {
        fetchLeaderboard();
        if (storedUser) fetchFriends(storedUser._id);
    }, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // --- API Helpers ---
  const fetchLeaderboard = async () => {
    try {
        const res = await fetch(`${API_URL}/api/users/leaderboard`);
        const data = await res.json();
        setLeaderboard(data);
    } catch (err) {
        console.error("Error fetching leaderboard", err);
    }
  };

  const fetchFriends = async (userId) => {
    try {
        const res = await fetch(`${API_URL}/api/users/friends/${userId}`);
        const data = await res.json();
        setFriends(data);
    } catch (err) {
        console.error("Error fetching friends", err);
    }
  };

  // --- Socket Event Listeners ---
  useEffect(() => {
    if (!socket) return;

    // Request latest rooms immediately
    socket.emit('get_rooms'); 

    const handleUpdateRooms = (rooms) => setAvailableRooms(rooms);
    
    const handleRoomJoined = (data) => {
      // Pass game configuration to the GamePage via Router state
      navigate('/game/multiplayer', { 
        state: { 
          room: roomName, 
          role: data.role, 
          size: data.size, 
          isHost: data.isHost 
        } 
      });
    };

    const handleError = (msg) => alert(msg);

    socket.on('update_rooms', handleUpdateRooms);
    socket.on('room_joined', handleRoomJoined);
    socket.on('error_message', handleError);

    // Cleanup listeners
    return () => {
      socket.off('update_rooms', handleUpdateRooms);
      socket.off('room_joined', handleRoomJoined);
      socket.off('error_message', handleError);
    };
  }, [socket, navigate, roomName]);

  // --- Handlers ---
  const handleCreate = () => {
    if (!roomName) return alert("Please enter a room name");
    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit("create_room", { roomId: roomName, size: size, user: user });
  };

  const handleJoin = (roomId) => {
    setRoomName(roomId);
    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit("join_room", { roomId, user });
  };

  // --- לוגיקה למחיקת חשבון ---
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/api/users/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id })
        });

        if (res.ok) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            if (socket) socket.disconnect();
            navigate('/');
        } else {
            alert("Failed to delete account");
        }
    } catch (error) {
        console.error("Error deleting account:", error);
        alert("Connection error");
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // אופציונלי: לנתק סוקט
      if(socket) socket.disconnect(); 
      navigate('/');
  };

  return (
    <div className="lobby-container">
      {/* Header עם כפתורים */}
      <div className="lobby-header">
         <div style={{display: 'flex', alignItems: 'center'}}>
             <button onClick={() => navigate('/')} className="back-btn">⬅ Menu</button>
         </div>
         
         <h1>Multiplayer Arena 🌍</h1>
         
         {/* כפתורי ניהול חשבון בצד ימין */}
         <div className="account-actions" style={{display: 'flex', gap: '10px'}}>
             <button onClick={handleLogout} className="logout-btn">
                 Logout 🚪
             </button>
             <button 
                onClick={() => setShowDeleteModal(true)} 
                className="delete-account-btn"
                style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
             >
                 Delete 🗑️
             </button>
         </div>
      </div>
      
      <div className="lobby-grid">
        
        {/* Column 1: Main Control Panel (Create & Join) */}
        <div className="lobby-column main-panel">
            <div className="lobby-card create-section">
                <h3>🎮 Create Room</h3>
                <div className="input-group">
                    <input 
                        type="text" 
                        placeholder="Room Name..." 
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                    />
                    <div className="size-options">
                        {[3, 5, 10].map((s) => (
                            <button key={s} onClick={() => setSize(s)} className={size === s ? 'active' : ''}>{s}x{s}</button>
                        ))}
                    </div>
                    <button onClick={handleCreate} className="action-btn">Create & Play</button>
                </div>
            </div>

            <div className="lobby-card rooms-section">
                <h3>🚀 Available Rooms</h3>
                {availableRooms.length === 0 ? (
                    <p className="empty-msg">No active rooms. Be the first!</p>
                ) : (
                    <div className="rooms-list">
                        {availableRooms.map((room) => (
                            <div key={room.id} className="room-item">
                                <div className="room-info">
                                    <span className="room-name">{room.id}</span>
                                    <span className="room-meta">{room.size}x{room.size} • {room.playersCount}/2</span>
                                </div>
                                <button 
                                    onClick={() => handleJoin(room.id)}
                                    disabled={room.playersCount >= 2}
                                    className="join-btn"
                                >
                                    {room.playersCount >= 2 ? 'FULL' : 'JOIN'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Column 2: Leaderboard */}
        <div className="lobby-column side-panel">
            <div className="lobby-card leaderboard-section">
                <h3>🏆 The Champion</h3>
                <div className="leaderboard-list">
                    {leaderboard.slice(0, 1).map((player, index) => (
                        <div key={index} className={`leaderboard-item rank-1`} style={{background: 'rgba(255, 215, 0, 0.2)', border: '2px solid gold', padding: '15px'}}>
                            <span className="rank" style={{fontSize: '1.5rem'}}>👑</span>
                            <div className="player-details">
                                <span className="player-name" style={{fontSize: '1.2rem'}}>{player.username}</span>
                                <span className="player-wins">{player.wins} Wins</span>
                            </div>
                            {player.isOnline && <span className="online-dot" title="Online">●</span>}
                        </div>
                    ))}
                    
                    {leaderboard.length === 0 && <p className="empty-msg">No champions yet...</p>}
                </div>
            </div>
        </div>

        {/* Column 3: Friends List */}
        <div className="lobby-column side-panel">
            <div className="lobby-card friends-section">
                <h3>👥 Friends</h3>
                {friends.length === 0 ? (
                    <p className="empty-msg">You have no friends yet. Play a game to add some!</p>
                ) : (
                    <div className="friends-list">
                        {friends.map((friend) => (
                            <div key={friend._id} className="friend-item">
                                <div className="friend-info">
                                    <span className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}>●</span>
                                    <span>{friend.username}</span>
                                </div>
                                <span className="friend-wins">🏆 {friend.wins}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* --- MODAL מחיקת משתמש --- */}
      {showDeleteModal && (
        <div className="modal-overlay">
            <div className="modal-content delete-modal">
                <h2 style={{color: '#ff4d4d', marginTop: 0}}>⚠️ Danger Zone</h2>
                <p>Are you sure you want to delete your account?</p>
                <p style={{fontSize: '0.9rem', opacity: 0.8}}>This action cannot be undone. All your stats and friends will be lost.</p>
                
                <p style={{marginTop: '15px'}}>Type <strong>DELETE</strong> below to confirm:</p>
                <input 
                    type="text" 
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE"
                    className="room-input"
                    style={{
                        borderColor: deleteConfirmation === 'DELETE' ? '#4cc9f0' : '#ccc',
                        textAlign: 'center',
                        fontSize: '1.1rem',
                        letterSpacing: '1px'
                    }}
                />

                <div className="modal-actions" style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center'}}>
                    <button 
                        onClick={() => {
                            setShowDeleteModal(false);
                            setDeleteConfirmation("");
                        }} 
                        className="secondary-btn"
                        style={{padding: '10px 20px', cursor: 'pointer'}}
                    >
                        Cancel
                    </button>
                    
                    <button 
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== "DELETE"} 
                        className="primary-btn"
                        style={{
                            backgroundColor: deleteConfirmation === "DELETE" ? '#ff4d4d' : '#555',
                            cursor: deleteConfirmation === "DELETE" ? 'pointer' : 'not-allowed',
                            padding: '10px 20px',
                            border: 'none',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Lobby;