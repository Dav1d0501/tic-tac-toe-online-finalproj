import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Board from '../components/Board';
import '../App.css'; 

const GamePage = ({ socket }) => {
  const { mode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve initial game state passed from Lobby
  const { room, size: onlineSize, isHost: initialIsHost, role } = location.state || {};

  // Local state for host status (can update if original host leaves)
  const [isHost, setIsHost] = useState(initialIsHost || false);
  
  const [localSize, setLocalSize] = useState(3);
  const [difficulty, setDifficulty] = useState('hard');
  const [starter, setStarter] = useState('user');

  // Determine board size based on game mode
  const currentSize = mode === 'multiplayer' ? onlineSize : localSize;

  // 1. Protect against page refresh in multiplayer (redirect to lobby if no room data)
  useEffect(() => {
    if (mode === 'multiplayer' && !room) {
      alert("Lost connection. Please join via Lobby.");
      navigate('/lobby');
    }
  }, [mode, room, navigate]);

  // 2. Handle Host Migration (If host leaves, server assigns new host)
  useEffect(() => {
    if (mode === 'multiplayer' && socket) {
        socket.on('you_are_host', () => {
            console.log("You are now the host!");
            setIsHost(true); // Enable reset button
            alert("The host left. You are now the host!");
        });

        return () => socket.off('you_are_host');
    }
  }, [socket, mode]);

  // 3. Handle Safe Exit / Back Button
  const handleBack = () => {
      if (mode === 'multiplayer' && socket) {
          // Notify server that user is leaving
          if (room) {
              console.log("Leaving room:", room);
              socket.emit("leave_room", room);
          }
          navigate('/lobby');
      } else {
          navigate('/');
      }
  };

  const getTitle = () => {
    if (mode === 'computer') return 'Man vs Machine 🤖';
    if (mode === 'multiplayer') return `Room: ${room} 🌍`;
    return 'Local Game (1 PC) 🎮';
  };

  return (
    <div className="app-container">
      <button 
        onClick={handleBack}
        className="back-btn"
        style={{ alignSelf: 'flex-start', marginBottom: '10px' }}
      >
        ⬅ {mode === 'multiplayer' ? 'Back to Lobby' : 'Back to Menu'}
      </button>

      <h1>{getTitle()}</h1>
      
      {/* Local Game Settings (Size) */}
      {mode !== 'multiplayer' && (
        <div className="controls">
          <span className="control-label">Board Size:</span>
          <button onClick={() => setLocalSize(3)} className={localSize === 3 ? 'active' : ''}>3x3</button>
          <button onClick={() => setLocalSize(5)} className={localSize === 5 ? 'active' : ''}>5x5</button>
          <button onClick={() => setLocalSize(10)} className={localSize === 10 ? 'active' : ''}>10x10</button>
        </div>
      )}

      {/* Computer Game Settings (Difficulty & Starter) */}
      {mode === 'computer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {currentSize === 3 && (
            <div className="controls">
              <button onClick={() => setDifficulty('easy')} className={difficulty === 'easy' ? 'active' : ''}>Easy</button>
              <button onClick={() => setDifficulty('hard')} className={difficulty === 'hard' ? 'active' : ''}>Hard</button>
            </div>
          )}
          <div className="controls">
            <button onClick={() => setStarter('user')} className={starter === 'user' ? 'active' : ''}>Me (X)</button>
            <button onClick={() => setStarter('computer')} className={starter === 'computer' ? 'active' : ''}>PC (X)</button>
          </div>
        </div>
      )}
      
      <Board 
        key={`${mode}-${currentSize}-${difficulty}-${starter}`}
        size={currentSize}
        gameMode={mode} 
        difficulty={difficulty} 
        starter={starter}
        socket={socket}      
        room={room}
        isHost={isHost} 
        myRole={role}
      />
    </div>
  );
};

export default GamePage;