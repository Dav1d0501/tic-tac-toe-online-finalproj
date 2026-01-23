import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Retrieve user data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    // Refresh to clear state and trigger the ProtectedRoute redirect
    window.location.reload(); 
  };

  return (
    <div className="app-container">
      
      {/* Top User Bar */}
      <div className="user-bar">
        <div className="user-info">
          Welcome, <span className="highlight">{user ? user.username : 'Guest'}</span>! 👋
        </div>
        
        <button onClick={handleLogout} className="logout-btn">
          Logout 🚪
        </button>
      </div>

      <h1 className="title">Tic Tac Toe Online</h1>
      
      <div className="menu">
        <button onClick={() => navigate('/game/local')} className="menu-btn">
          👥 Play Local (1 PC)
        </button>
        
        <button onClick={() => navigate('/game/computer')} className="menu-btn">
          🤖 Play vs Computer
        </button>
        
        {/* Navigate to Lobby for Online play */}
        <button onClick={() => navigate('/lobby')} className="menu-btn">
          🌍 Play Online
        </button>
      </div>
    </div>
  );
};

export default HomePage;