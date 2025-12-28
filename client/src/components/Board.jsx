import { useState, useEffect } from 'react';
import { checkWinner } from '../utils/gameLogic';
import { getBestMove } from '../utils/computerAI'; 
import './Board.css';

// הוספנו את myRole לרשימת המשתנים שהפונקציה מקבלת
const Board = ({ size, gameMode, difficulty, starter, socket, room, isHost, myRole }) => { 
  
  const [board, setBoard] = useState(Array(size * size).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);

  // אתחול התפקיד: אם קיבלנו myRole (מהלובי), נשתמש בו. אחרת null.
  const [myOnlineSymbol, setMyOnlineSymbol] = useState(myRole || null); 

  const computerSymbol = starter === 'computer' ? 'X' : 'O';

  // 1. איפוס לוח בעת שינוי הגדרות
  useEffect(() => {
    resetGameLocal();
    // אם התחלנו משחק חדש לגמרי, נעדכן את התפקיד מחדש (חשוב למעברים)
    if (myRole) setMyOnlineSymbol(myRole);
  }, [size, gameMode, difficulty, starter, myRole]); 

  const resetGameLocal = () => {
    setBoard(Array(size * size).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  // 2. לוגיקת Socket למשחק אונליין
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket) return;

    // מחקנו את handlePlayerRole כי השרת כבר לא שולח אותו בנפרד!
    // אנחנו מקבלים את התפקיד ישר מה-props.

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

  // 3. לוגיקת מחשב (AI)
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

  // 4. ביצוע מהלך
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

  // 5. טיפול בלחיצה
  const handleCellClick = (index) => {
    if (board[index] || winner) return;

    const isComputerTurn = (isXNext && computerSymbol === 'X') || (!isXNext && computerSymbol === 'O');
    if (gameMode === 'computer' && isComputerTurn) return;

    if (gameMode === 'multiplayer') {
      const isMyTurn = (isXNext && myOnlineSymbol === 'X') || (!isXNext && myOnlineSymbol === 'O');
      
      // הוספתי לוגים כדי שנוכל לראות בדיוק למה זה נחסם (אם ייחסם)
      if (!isMyTurn) {
         console.log(`Blocked! My symbol: ${myOnlineSymbol}, Turn: ${isXNext ? 'X' : 'O'}`);
         return; 
      }
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
              {/* מציג למשתמש מי הוא - זה יעזור לנו לוודא שהתיקון עבד */}
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