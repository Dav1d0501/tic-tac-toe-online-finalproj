export const checkWinner = (board, size) => {
  
  // 1. Check Rows (בדיקת שורות)
  for (let i = 0; i < size; i++) {
    const rowStart = i * size;
    const first = board[rowStart];
    
    if (!first) continue;

    let isWin = true;
    for (let j = 1; j < size; j++) {
      if (board[rowStart + j] !== first) {
        isWin = false;
        break;
      }
    }
    if (isWin) return first; 
  }

  // 2. Check Columns (בדיקת עמודות)
  for (let i = 0; i < size; i++) {
    const first = board[i];
    if (!first) continue;

    let isWin = true;
    for (let j = 1; j < size; j++) {
      // הקפיצה בין תא לתא בעמודה היא בגודל ה-size
      if (board[i + (j * size)] !== first) {
        isWin = false;
        break;
      }
    }
    if (isWin) return first;
  }

  // 3. Check Main Diagonal (אלכסון ראשי: שמאל-למעלה לימין-למטה)
  let first = board[0];
  if (first) {
    let isWin = true;
    for (let i = 1; i < size; i++) {
      // האינדקס גדל ב-size + 1 בכל צעד
      if (board[i * (size + 1)] !== first) {
        isWin = false;
        break;
      }
    }
    if (isWin) return first;
  }

  // 4. Check Anti-Diagonal (אלכסון משני: ימין-למעלה לשמאל-למטה)
  first = board[size - 1];
  if (first) {
    let isWin = true;
    for (let i = 1; i < size; i++) {
      // האינדקס גדל ב-size - 1 בכל צעד
      if (board[(i + 1) * (size - 1)] !== first) {
        isWin = false;
        break;
      }
    }
    if (isWin) return first;
  }

  // 5. Check Draw (תיקו - אם הלוח מלא ואין מנצח)
  if (board.every(cell => cell !== null)) {
    return 'Draw';
  }

  return null; 
};