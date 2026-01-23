import { useState, useEffect } from 'react';
import { checkWinner } from '../utils/gameLogic';
import { getBestMove } from '../utils/computerAI'; 
import './Board.css';

const Board = ({ size, gameMode, difficulty, starter, socket, room, isHost, myRole }) => { 
  
  const [board, setBoard] = useState(Array(size * size).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);

  // Initialize online role (synced with Lobby)
  const [myOnlineSymbol, setMyOnlineSymbol] = useState(myRole || null); 

  const computerSymbol = starter === 'computer' ? 'X' : 'O';

  // 1. Reset board on configuration change
  useEffect(() => {
    resetGameLocal();
    if (myRole) setMyOnlineSymbol(myRole);
  }, [size, gameMode, difficulty, starter, myRole]); 

  const resetGameLocal = () => {
    setBoard(Array(size * size).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  // 2. Socket Logic (Online Game)
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket) return;

    const handleReceiveMove = (data) => {
      const moveIndex = data.index !== undefined ? data.index : data;
      handleMove(moveIndex, false); 
    };

    const handleResetGame = () => {
      console.log("Reset command received from server");
      resetGameLocal();
    };

    socket.on('receive_move', handleReceiveMove);
    socket.on('reset_game', handleResetGame);

    return () => {
      socket.off('receive_move', handleReceiveMove);
      socket.off('reset_game', handleResetGame);
    };
  }, [socket, gameMode, board, isXNext, winner]); 

  // 3. AI Logic (Computer Mode)
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

  // 4. Handle Move Logic
  const handleMove = (index, emitEvent = true) => {
    const newBoard = [...board];
    if (newBoard[index] || winner) return;

    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    
    const result = checkWinner(newBoard, size);
    if (result) setWinner(result);
    else setIsXNext(!isXNext);

    if (gameMode === 'multiplayer' && emitEvent && socket) {
      socket.emit('send_move', { 
        index: index, 
        room: room, 
        player: isXNext ? 'X' : 'O'
      });
    }
  };

  // 5. Handle User Click
  const handleCellClick = (index) => {
    if (board[index] || winner) return;

    // Block interaction during Computer turn
    const isComputerTurn = (isXNext && computerSymbol === 'X') || (!isXNext && computerSymbol === 'O');
    if (gameMode === 'computer' && isComputerTurn) return;

    // Block interaction if not user's turn (Online)
    if (gameMode === 'multiplayer') {
      const isMyTurn = (isXNext && myOnlineSymbol === 'X') || (!isXNext && myOnlineSymbol === 'O');
      if (!isMyTurn) return; 
    }

    handleMove(index, true);
  };

  const handleResetClick = () => {
    if (gameMode === 'multiplayer') {
        if (socket && room) {
            socket.emit('reset_game', room);
        }
    } else {
        resetGameLocal();
    }
  };

  return (
    <div className="board-container">
      <div className="game-status">
        {winner ? (
            <span className="winner-msg">
              {winner === 'Draw' ? 'תיקו!' : `המנצח: ${winner} 🏆`}
            </span>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span>תור: <span className="turn-indicator">{isXNext ? 'X' : 'O'}</span></span>
              {gameMode === 'multiplayer' && myOnlineSymbol && (
                 <span style={{ fontSize: '0.9rem', color: '#4cc9f0', fontWeight: 'bold' }}>
                   (You are {myOnlineSymbol})
                 </span>
              )}
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
          <button 
            className="reset-btn"
            onClick={handleResetClick} 
          >
            משחק חדש 
          </button>
      )}
    </div>
  );
};

export default Board;