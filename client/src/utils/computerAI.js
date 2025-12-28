// src/utils/computerAI.js
import { checkWinner } from './gameLogic';

// --- הפונקציה הראשית שהלוח קורא לה ---
export const getBestMove = (board, size,difficulty) => {
  // אם הלוח הוא 3x3 - מפעילים את התותחים הכבדים (Minimax)
  if (size === 3 && difficulty === 'hard') {
    return getMinimaxMove(board, size);
  } 
  
  // אם הלוח גדול יותר - מפעילים את האלגוריתם המהיר (היוריסטי)
  return getHeuristicMove(board, size);
};

//  אלגוריתם 1: Minimax (ללוחות קטנים - בלתי מנוצח)
const getMinimaxMove = (board, size) => {
  let bestScore = -Infinity;
  let move = null;
  const availableMoves = getAvailableMoves(board);

  // המחשב עובר על כל מהלך אפשרי ובודק מה הניקוד שלו
  for (let i of availableMoves) {
    const boardCopy = [...board];
    boardCopy[i] = 'O'; // המחשב עושה ניסוי
    
    // קריאה רקורסיבית לפונקציית המינימקס
    let score = minimax(boardCopy, 0, false, size);
    
    // אנחנו רוצים את הניקוד הכי גבוה (10)
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }
  return move;
};

// פונקציית העזר של המינימקס (המוח הרקורסיבי)
const minimax = (board, depth, isMaximizing, size) => {
  const result = checkWinner(board, size);
  if (result === 'O') return 10 - depth; // ניצחון למחשב (מעדיף לנצח מהר)
  if (result === 'X') return depth - 10; // ניצחון לשחקן (רע למחשב)
  if (result === 'Draw') return 0;       // תיקו

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) { // תור המחשב (מנסה להשיג מקסימום נקודות)
    let bestScore = -Infinity;
    for (let i of availableMoves) {
      board[i] = 'O';
      let score = minimax(board, depth + 1, false, size);
      board[i] = null; // ביטול המהלך (Backtracking)
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else { // תור השחקן (אנחנו מניחים שהשחקן ישחק מושלם וינסה לתת לנו מינימום נקודות)
    let bestScore = Infinity;
    for (let i of availableMoves) {
      board[i] = 'X';
      let score = minimax(board, depth + 1, true, size);
      board[i] = null;
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
};

// Heuristic (ללוחות גדולים - חכם ומהיר)
const getHeuristicMove = (board, size) => {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  // 1. נסה לנצח
  for (let move of availableMoves) {
    const boardCopy = [...board];
    boardCopy[move] = 'O';
    if (checkWinner(boardCopy, size) === 'O') return move;
  }

  // 2. נסה לחסום
  for (let move of availableMoves) {
    const boardCopy = [...board];
    boardCopy[move] = 'X';
    if (checkWinner(boardCopy, size) === 'X') return move;
  }

  // 3. קח את האמצע אם פנוי
  const center = Math.floor((size * size) / 2);
  if (board[center] === null) return center;

  // 4. סתם מהלך רנדומלי
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
};

const getAvailableMoves = (board) => {
  return board
    .map((val, idx) => (val === null ? idx : null))
    .filter((val) => val !== null);
};