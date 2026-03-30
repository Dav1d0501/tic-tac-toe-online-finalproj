import { useState, useEffect, useRef } from 'react';
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
  
  // UI Messages & Friendship
  const [friendMessage, setFriendMessage] = useState(''); 
  const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);

  // --- Chat State ---
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const chatEndRef = useRef(null); // בשביל גלילה אוטומטית למטה

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
    // לא מאפסים פה את הצ'אט כדי שהיסטוריית השיחה תישאר גם אחרי שלוחצים New Game
  };

  // --- בדיקת חברות אוטומטית ---
  useEffect(() => {
      if (opponent && opponent._id) {
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user._id) {
              fetch(`${API_URL}/api/users/friends/${user._id}`)
                  .then(res => res.json())
                  .then(friends => {
                      const isFriend = friends.some(f => f._id === opponent._id);
                      setIsAlreadyFriend(isFriend);
                      user.friends = friends.map(f => f._id);
                      localStorage.setItem('user', JSON.stringify(user));
                  })
                  .catch(err => console.error("Error fetching friends:", err));
          }
      }
  }, [opponent, API_URL]);

  // 2. Socket Listeners 

  // 2.A. Stable Events (Opponent Data, Reset, & Chat)
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket) return;

    const handleOpponentData = (data) => {
        setOpponent(data);
    };

    const handleResetGame = () => {
      resetGameLocal();
    };

    const handleReceiveMessage = (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
    };
    const handleOpponentLeft = () => {
        console.log("Opponent left the room");
        setWinner("Opponent Fled 🏃‍♂️💨"); // עוצר את המשחק ומודיע שהיריב ברח
    };

    socket.on('opponent_data', handleOpponentData);
    socket.on('reset_game', handleResetGame);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('opponent_left', handleOpponentLeft);

    if (room) {
        socket.emit("req_opponent_data", room);
    }

    return () => {
      socket.off('opponent_data', handleOpponentData);
      socket.off('reset_game', handleResetGame);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('opponent_left', handleOpponentLeft);
    };
  }, [socket, gameMode, room]); 

  // גלילה אוטומטית למטה כשמקבלים הודעה חדשה
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2.B. Dynamic Events (Game Moves)
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
  }, [socket, gameMode, board, isXNext, winner]); 


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

  // 4. Game Over Reporting
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
            setIsAlreadyFriend(true); 
            
            if (!user.friends) user.friends = [];
            user.friends.push(opponent._id);
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            setFriendMessage(data.message || "Error");
        }
    } catch (err) {
        setFriendMessage("Connection Error");
    }
  };

  // --- Send Chat Message ---
  const handleSendMessage = (e) => {
      e.preventDefault();
      if (currentMessage.trim() !== "" && socket && room) {
          const user = JSON.parse(localStorage.getItem('user'));
          const senderName = user ? user.username : 'Guest';
          
          socket.emit("send_message", {
              room: room,
              message: currentMessage,
              sender: senderName
          });
          setCurrentMessage(""); // מנקה את התיבה אחרי השליחה
      }
  };

  const getEndGameMessage = () => {
      if (winner === 'Draw') return "It's a Draw! 🤝";
      if (winner === "Opponent Fled 🏃‍♂️💨") return winner;
      if (gameMode === 'multiplayer' && myOnlineSymbol) {
          return winner === myOnlineSymbol ? "You Won! 🎉" : "You Lost 💀";
      }
      return `Winner: ${winner} 🏆`;
  };

  // נוציא את המשתמש הנוכחי כדי לדעת איזה צד של הצ'אט לצבוע
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const myUsername = currentUser ? currentUser.username : 'Guest';

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
                
                {/* Friend Request Button / Status */}
                {gameMode === 'multiplayer' && opponent && opponent._id && (
                    <div className="friend-action" style={{ marginTop: '10px' }}>
                        {isAlreadyFriend ? (
                            <span style={{ color: '#20c997', fontWeight: 'bold', fontSize: '1.1rem' }}>🤝 You are friends</span>
                        ) : !friendMessage ? (
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

      {/* --- Chat Component (Only in Multiplayer) --- */}
      {gameMode === 'multiplayer' && (
          <div className="chat-container">
              <div className="chat-messages">
                  {messages.length === 0 ? (
                      <p className="chat-empty">Start the conversation!</p>
                  ) : (
                      messages.map((msg, idx) => {
                          const isMe = msg.sender === myUsername;
                          return (
                              <div key={idx} className={`chat-message ${isMe ? 'message-mine' : 'message-opponent'}`}>
                                  <span className="msg-sender">{isMe ? 'You' : msg.sender}</span>
                                  <div className="msg-bubble">{msg.message}</div>
                              </div>
                          )
                      })
                  )}
                  <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={handleSendMessage} className="chat-input-area">
                  <input 
                      type="text" 
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="chat-input"
                  />
                  <button type="submit" className="chat-send-btn">Send</button>
              </form>
          </div>
      )}

    </div>
  );
};

export default Board;