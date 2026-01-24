import { useState, useEffect } from 'react';
import { checkWinner } from '../utils/gameLogic';
import { getBestMove } from '../utils/computerAI';
import './Board.css';

const Board = ({ size, gameMode, difficulty, starter, socket, room, isHost, myRole }) => { 
  
  // --- State Management ---
  const [board, setBoard] = useState(Array(size * size).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  
  // Multiplayer Identifiers
  const [myOnlineSymbol, setMyOnlineSymbol] = useState(myRole || null);
  const [opponent, setOpponent] = useState(null); 
  
  // UI Messages
  const [friendMessage, setFriendMessage] = useState(''); 

  const computerSymbol = starter === 'computer' ? 'X' : 'O';
  const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

  // 1. Initialization & Local Reset
  useEffect(() => {
    resetGameLocal();
    if (myRole) setMyOnlineSymbol(myRole);
  }, [size, gameMode, difficulty, starter, myRole]); 

  const resetGameLocal = () => {
    setBoard(Array(size * size).fill(null));
    setIsXNext(true);
    setWinner(null);
    setFriendMessage('');
  };

  // 2. Socket Listeners (Split into two effects for stability)

// 2.A. Stable Events (Opponent Data & Reset)
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket) return;

    const handleOpponentData = (data) => {
        console.log("Opponent Data Received:", data);
        setOpponent(data);
    };

    const handleResetGame = () => {
      console.log("Reset command received");
      resetGameLocal();
    };

    socket.on('opponent_data', handleOpponentData);
    socket.on('reset_game', handleResetGame);

    // --- בקשה יזומה של הנתונים ברגע שהלוח עולה ---
    if (room) {
        console.log("Requesting opponent data for room:", room);
        socket.emit("req_opponent_data", room);
    }
    // ---------------------------------------------------

    return () => {
      socket.off('opponent_data', handleOpponentData);
      socket.off('reset_game', handleResetGame);
    };
  }, [socket, gameMode, room]); 


  // 2.B. Dynamic Events (Game Moves)
  // This effect depends on the board state to correctly update moves
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket) return;

    const handleReceiveMove = (data) => {
      const moveIndex = data.index !== undefined ? data.index : data;
      handleMove(moveIndex, false); 
    };

    socket.on('receive_move', handleReceiveMove);

    return () => {
      socket.off('receive_move', handleReceiveMove);
    };
  }, [socket, gameMode, board, isXNext, winner]); // State dependencies required here


  // 3. AI Turn Logic
  useEffect(() => {
    const isComputerTurn = (isXNext && computerSymbol === 'X') || (!isXNext && computerSymbol === 'O');

    if (!winner && gameMode === 'computer' && isComputerTurn) {
      const timeoutId = setTimeout(() => {
        const bestMove = getBestMove(board, size, difficulty);
        if (bestMove !== null) handleMove(bestMove); 
      }, 600);
      return () => clearTimeout(timeoutId);
    }
  }, [isXNext, winner, gameMode, board, size, difficulty, computerSymbol]); 

  // 4. Game Over Reporting (Host Only)
  useEffect(() => {
      if (winner && gameMode === 'multiplayer' && socket) {
          if (isHost) {
              socket.emit("game_over", { room, winnerSymbol: winner });
          }
      }
  }, [winner, gameMode, socket, room, isHost]);

  // 5. Move Logic
  const handleMove = (index, emitEvent = true) => {
    const newBoard = [...board];
    if (newBoard[index] || winner) return;

    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    
    const result = checkWinner(newBoard, size);
    if (result) setWinner(result);
    else setIsXNext(!isXNext);

    if (gameMode === 'multiplayer' && emitEvent && socket) {
      socket.emit('send_move', { index: index, room: room, player: isXNext ? 'X' : 'O' });
    }
  };

  const handleCellClick = (index) => {
    if (board[index] || winner) return;
    const isComputerTurn = (isXNext && computerSymbol === 'X') || (!isXNext && computerSymbol === 'O');
    if (gameMode === 'computer' && isComputerTurn) return;

    if (gameMode === 'multiplayer') {
      const isMyTurn = (isXNext && myOnlineSymbol === 'X') || (!isXNext && myOnlineSymbol === 'O');
      if (!isMyTurn) return; 
    }
    handleMove(index, true);
  };

  const handleResetClick = () => {
    if (gameMode === 'multiplayer') {
        if (socket && room) socket.emit('reset_game', room);
    } else {
        resetGameLocal();
    }
  };

  // 6. Add Friend Handler
  const handleAddFriend = async () => {
    if (!opponent || !opponent._id) return setFriendMessage("Cannot add Guest");
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user._id) return setFriendMessage("Please Login first");

    setFriendMessage("Adding...");

    try {
        const res = await fetch(`${API_URL}/api/users/add-friend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, friendId: opponent._id })
        });

        const data = await res.json();
        if (res.ok) {
            setFriendMessage("Friend Added! 🎉");
        } else {
            setFriendMessage(data.message || "Error");
        }
    } catch (err) {
        setFriendMessage("Connection Error");
    }
  };

  // Helper for status message
  const getEndGameMessage = () => {
      if (winner === 'Draw') return "It's a Draw! 🤝";
      if (gameMode === 'multiplayer' && myOnlineSymbol) {
          return winner === myOnlineSymbol ? "You Won! 🎉" : "You Lost 💀";
      }
      return `Winner: ${winner} 🏆`;
  };

  return (
    <div className="board-container">
      
      {/* Header: Match Info */}
      <div className="match-info" style={{marginBottom: '15px', textAlign: 'center'}}>
          {gameMode === 'multiplayer' && opponent ? (
              <h3 style={{margin: 0, color: '#e0e0e0'}}>
                  <span style={{color: '#4cc9f0'}}>You ({myOnlineSymbol})</span> 
                  <span style={{margin: '0 10px'}}>VS</span> 
                  <span style={{color: '#ff4d4d'}}>{opponent.username} ({myOnlineSymbol === 'X' ? 'O' : 'X'})</span>
              </h3>
          ) : (
              <h3 style={{margin: 0}}>Classic Tic Tac Toe</h3>
          )}
      </div>

      <div className="game-status">
        {winner ? (
            <div className="winner-section">
                <h2 className="winner-msg" style={{ fontSize: '1.5rem', margin: '10px 0' }}>
                  {getEndGameMessage()}
                </h2>
                
                {/* Friend Request Button */}
                {gameMode === 'multiplayer' && opponent && opponent._id && (
                    <div className="friend-action" style={{ marginTop: '10px' }}>
                        {!friendMessage ? (
                            <button onClick={handleAddFriend} className="add-friend-btn">
                                ➕ Add {opponent.username} to Friends
                            </button>
                        ) : (
                            <span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>{friendMessage}</span>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{fontSize: '1.2rem'}}>Turn: <span className="turn-indicator">{isXNext ? 'X' : 'O'}</span></span>
            </div>
        )}
      </div>

      <div 
        className={`board size-${size}`} 
        style={{ 
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)` 
        }}
      >
        {board.map((cell, index) => (
          <button 
            key={index} 
            className={`cell ${cell ? 'taken' : ''} ${winner && cell === winner ? 'win-cell' : ''}`}
            onClick={() => handleCellClick(index)}
            disabled={!!winner} 
          >
            {cell}
          </button>
        ))}
      </div>

      {(gameMode !== 'multiplayer' || isHost) && (
          <button className="reset-btn" onClick={handleResetClick}>
            New Game
          </button>
      )}
    </div>
  );
};

export default Board;