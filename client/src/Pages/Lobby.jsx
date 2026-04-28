import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './Lobby.css'; 

const Lobby = ({ socket }) => {
  const [roomName, setRoomName] = useState('');
  const [size, setSize] = useState(3);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // State for features (Leaderboard & Friends)
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends, setFriends] = useState([]);

  // --- State למחיקת משתמש ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // --- State לעדכון אימייל בלבד ---
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  
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

    const interval = setInterval(() => {
        fetchLeaderboard();
        if (storedUser) fetchFriends(storedUser._id);
    }, 10000);

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
    socket.emit('get_rooms'); 

    const handleUpdateRooms = (rooms) => setAvailableRooms(rooms);
    const handleRoomJoined = (data) => {
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

    return () => {
      socket.off('update_rooms', handleUpdateRooms);
      socket.off('room_joined', handleRoomJoined);
      socket.off('error_message', handleError);
    };
  }, [socket, navigate, roomName]);

  // --- Handlers ---
  const handleCreate = () => {
    if (!roomName || roomName.trim() === "") {
        return alert("Please enter a room name! 📝");
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        return alert("Please log in to create a room!");
    }

    console.log("Emitting create_room:", roomName, size);
    socket.emit("create_room", { roomId: roomName.trim(), size: size, user: user });
  };

  const handleJoin = (roomId) => {
    setRoomName(roomId);
    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit("join_room", { roomId, user });
  };

  // --- לוגיקה לעדכון אימייל בלבד ---
  const openEmailModal = () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
          setNewEmail(user.email || ""); 
          setShowEmailModal(true);
      }
  };

  const handleUpdateEmail = async () => {
      // 1. בדיקת תקינות אימייל (Validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
          return alert("Please enter a valid email address! (e.g., user@example.com) ❌");
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      if (newEmail === user.email) {
          setShowEmailModal(false);
          return;
      }

      try {
          const res = await fetch(`${API_URL}/api/users/update-email`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user._id, newEmail: newEmail })
          });
          
          const data = await res.json();
          
          if (!res.ok) {
              return alert(data.message || "Failed to update email");
          }

          user.email = newEmail;
          localStorage.setItem('user', JSON.stringify(user));
          
          alert("Email updated successfully! 📧");
          setShowEmailModal(false);
          
      } catch (err) {
          console.error(err);
          alert("Connection error while updating email");
      }
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
      if(socket) socket.disconnect(); 
      navigate('/');
  };

  return (
    <div className="lobby-container">
      {/* Header */}
      <div className="lobby-header">
         <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
             <button onClick={() => navigate('/')} className="back-btn">⬅ Menu</button>
             <h1>Arena 🌍</h1>
         </div>
         
         <div className="account-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
             <button 
                onClick={openEmailModal} 
                className="settings-btn"
                style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', marginRight: '5px' }}
                title="Update Email"
             >
                ✉️
             </button>

             <button onClick={handleLogout} className="logout-btn">
                 Logout 🚪
             </button>
             <button 
                onClick={() => setShowDeleteModal(true)} 
                className="delete-account-btn"
             >
                 Delete 🗑️
             </button>
         </div>
      </div>

      {/* Champion Banner (Compact) */}
      {leaderboard.length > 0 && (
          <div className="champion-banner">
              <span className="champion-icon">👑</span>
              <span className="champion-title">Current Champion:</span>
              <span className="champion-name">{leaderboard[0].username}</span>
              <span className="champion-wins">({leaderboard[0].wins} Wins)</span>
          </div>
      )}
      
      <div className="lobby-grid">
        {/* Left Column: Create & Rooms */}
        <div className="lobby-column">
            {/* Create Room */}
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

            {/* Available Rooms (Scrollable) */}
            <div className="lobby-card scrollable-card">
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

        {/* Right Column: Friends (Scrollable) */}
        <div className="lobby-column">
            <div className="lobby-card scrollable-card">
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

      {/* --- Modals --- */}
      {showEmailModal && (
        <div className="modal-overlay">
            <div className="modal-content settings-modal">
                <h2>Update Email ✉️</h2>
                <div className="input-group">
                    <input 
                        type="email" 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email..."
                        style={{width: '90%', padding: '10px', margin: '0 auto'}}
                    />
                </div>
                <div className="modal-actions" style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px'}}>
                    <button onClick={() => setShowEmailModal(false)} className="secondary-btn">Cancel</button>
                    <button onClick={handleUpdateEmail} className="primary-btn">Save</button>
                </div>
            </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
            <div className="modal-content delete-modal">
                <h2 style={{color: '#ff4d4d', marginTop: 0}}>⚠️ Danger Zone</h2>
                <p>Are you sure you want to delete your account?</p>
                <input 
                    type="text" 
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE"
                    style={{
                        borderColor: deleteConfirmation === 'DELETE' ? '#4cc9f0' : '#ccc',
                        textAlign: 'center',
                        fontSize: '1.1rem'
                    }}
                />
                <div className="modal-actions" style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center'}}>
                    <button onClick={() => {setShowDeleteModal(false); setDeleteConfirmation("");}} className="secondary-btn">Cancel</button>
                    <button 
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== "DELETE"} 
                        className="primary-btn"
                        style={{
                            backgroundColor: deleteConfirmation === "DELETE" ? '#ff4d4d' : '#555',
                            cursor: deleteConfirmation === "DELETE" ? 'pointer' : 'not-allowed',
                        }}
                    >Confirm</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Lobby;