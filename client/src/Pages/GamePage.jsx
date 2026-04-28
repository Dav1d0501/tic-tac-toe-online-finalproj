import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Board from '../components/Board';
import './GamePage.css'; 

const GamePage = ({ socket }) => {
  const { mode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { room, size: onlineSize, isHost: initialIsHost, role } = location.state || {};

  const [isHost, setIsHost] = useState(initialIsHost || false);
  const [localSize, setLocalSize] = useState(3);
  const [difficulty, setDifficulty] = useState('hard');
  const [starter, setStarter] = useState('user');

  const currentSize = mode === 'multiplayer' ? onlineSize : localSize;

  useEffect(() => {
    if (mode === 'multiplayer' && !room) {
      alert("Lost connection. Please join via Lobby.");
      navigate('/lobby');
    }
  }, [mode, room, navigate]);

  useEffect(() => {
    if (mode === 'multiplayer' && socket) {
        socket.on('you_are_host', () => {
            console.log("You are now the host!");
            setIsHost(true); 
            alert("The host left. You are now the host!");
        });

        return () => socket.off('you_are_host');
    }
  }, [socket, mode]);

  const handleBack = () => {
      if (mode === 'multiplayer' && socket) {
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
    if (mode === 'computer') return 'Man vs Machine';
    if (mode === 'multiplayer') return `Room: ${room}`;
    return 'Local Game (1 PC)';
  };

  return (
    <div className="game-page-wrapper">
      <div className="game-header-top">
        <button onClick={handleBack} className="back-action-btn">
          Back to {mode === 'multiplayer' ? 'Lobby' : 'Menu'}
        </button>
      </div>

      <h1 className="game-title">{getTitle()}</h1>
      
      <div className="game-controls-wrapper">
        {/* Local Game Settings (Size) */}
        {mode !== 'multiplayer' && (
          <div className="game-controls-group">
            <span className="game-control-label">Board Size:</span>
            <button onClick={() => setLocalSize(3)} className={localSize === 3 ? 'active' : ''}>3x3</button>
            <button onClick={() => setLocalSize(5)} className={localSize === 5 ? 'active' : ''}>5x5</button>
            <button onClick={() => setLocalSize(10)} className={localSize === 10 ? 'active' : ''}>10x10</button>
          </div>
        )}

        {/* Computer Game Settings (Difficulty & Starter) */}
        {mode === 'computer' && (
          <>
            {currentSize === 3 && (
              <div className="game-controls-group">
                <span className="game-control-label">Difficulty:</span>
                <button onClick={() => setDifficulty('easy')} className={difficulty === 'easy' ? 'active' : ''}>Easy</button>
                <button onClick={() => setDifficulty('hard')} className={difficulty === 'hard' ? 'active' : ''}>Hard</button>
              </div>
            )}
            <div className="game-controls-group">
              <span className="game-control-label">First Turn:</span>
              <button onClick={() => setStarter('user')} className={starter === 'user' ? 'active' : ''}>Me (X)</button>
              <button onClick={() => setStarter('computer')} className={starter === 'computer' ? 'active' : ''}>PC (X)</button>
            </div>
          </>
        )}
      </div>
      
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