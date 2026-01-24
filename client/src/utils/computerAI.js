import { checkWinner } from './gameLogic';

export const getBestMove = (board, size, difficulty) => {
  // Use Minimax only for 3x3 Hard mode
  if (size === 3 && difficulty === 'hard') {
    return getMinimaxMove(board, size);
  } 
  
  // Use Heuristic for larger boards or Easy mode
  return getHeuristicMove(board, size);
};

// --- Algorithm 1: Minimax ---

const getMinimaxMove = (board, size) => {
  let bestScore = -Infinity;
  let move = null;
  const availableMoves = getAvailableMoves(board);

  for (let i of availableMoves) {
    const boardCopy = [...board];
    boardCopy[i] = 'O'; 
    
    let score = minimax(boardCopy, 0, false, size);
    
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }
  return move;
};

const minimax = (board, depth, isMaximizing, size) => {
  const result = checkWinner(board, size);
  if (result === 'O') return 10 - depth; // Computer wins
  if (result === 'X') return depth - 10; // Player wins
  if (result === 'Draw') return 0;       

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i of availableMoves) {
      board[i] = 'O';
      let score = minimax(board, depth + 1, false, size);
      board[i] = null; // Backtrack
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i of availableMoves) {
      board[i] = 'X';
      let score = minimax(board, depth + 1, true, size);
      board[i] = null; // Backtrack
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
};

// --- Algorithm 2: Heuristic ---

const getHeuristicMove = (board, size) => {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  // 1. Try to Win
  for (let move of availableMoves) {
    const boardCopy = [...board];
    boardCopy[move] = 'O';
    if (checkWinner(boardCopy, size) === 'O') return move;
  }

  // 2. Block Opponent
  for (let move of availableMoves) {
    const boardCopy = [...board];
    boardCopy[move] = 'X';
    if (checkWinner(boardCopy, size) === 'X') return move;
  }

  // 3. Take Center
  const center = Math.floor((size * size) / 2);
  if (board[center] === null) return center;

  // 4. Random Move
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
};

const getAvailableMoves = (board) => {
  return board
    .map((val, idx) => (val === null ? idx : null))
    .filter((val) => val !== null);
};