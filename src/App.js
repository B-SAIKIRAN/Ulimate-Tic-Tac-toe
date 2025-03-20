import React, { useEffect, useState } from 'react';
import Board from './components/Board';
import './style.css';

// Utility to check if any 3-in-a-row inside a 3x3 block is a winner
function check3x3Winner(cells) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];
  for (let [a, b, c] of lines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a]; // 'X' or 'O'
    }
  }
  return null; // No winner
}

export default function App() {
  const [bigBoard, setBigBoard] = useState(Array(81).fill(''));
  const [xIsNext, setXIsNext] = useState(true);
  const [forcedBoard, setForcedBoard] = useState(null);
  const [lastPlayedIndex, setLastPlayedIndex] = useState(null);
  const [glowIndex, setGlowIndex] = useState(null);

  // Determine winners for each sub-board
  const subBoardWinners = Array(9).fill(null).map((_, i) => 
    check3x3Winner(bigBoard.slice(i * 9, i * 9 + 9))
  );

  // Check for overall winner
  const overallWinner = check3x3Winner(subBoardWinners);

  function handleCellClick(bigIndex, smallIndex) {
    if (overallWinner || subBoardWinners[bigIndex] || (forcedBoard !== null && forcedBoard !== bigIndex)) return;

    const cellIndex = bigIndex * 9 + smallIndex;
    if (bigBoard[cellIndex]) return;

    const nextBoard = [...bigBoard];
    nextBoard[cellIndex] = xIsNext ? 'X' : 'O';
    setBigBoard(nextBoard);
    setLastPlayedIndex(smallIndex);
    setXIsNext(!xIsNext);
    setGlowIndex(cellIndex);
  }

  useEffect(() => {
    if (lastPlayedIndex === null) return;

    const nextSubWinner = subBoardWinners[lastPlayedIndex];
    const nextSubCells = bigBoard.slice(lastPlayedIndex * 9, lastPlayedIndex * 9 + 9);
    const isSubFull = nextSubCells.every(cell => cell !== '');

    setForcedBoard(nextSubWinner || isSubFull ? null : lastPlayedIndex);
    // eslint-disable-next-line
  }, [xIsNext]);

  let status = overallWinner 
    ? `Player ${overallWinner} wins the big board!`
    : `Next player: ${xIsNext ? 'X' : 'O'}${forcedBoard !== null ? ` — Must play in sub-board #${forcedBoard + 1}` : ''}`;

  return (
    <div className="app-container">
      <h1>Ultimate Tic Tac Toe</h1>
      <div className="big-board">
        {Array(9).fill(null).map((_, i) => (
          <Board
            key={i}
            bigIndex={i}
            cells={bigBoard.slice(i * 9, i * 9 + 9)}
            winner={subBoardWinners[i]}
            handleCellClick={handleCellClick}
            forced={forcedBoard === null || forcedBoard === i}
            glowIndex={glowIndex}
          />
        ))}
      </div>
      <div className="status">{status}</div>
    </div>
  );
}
