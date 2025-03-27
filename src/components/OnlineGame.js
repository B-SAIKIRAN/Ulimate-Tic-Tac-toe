import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Board from "./Board";
import "../style.css";

const SERVER_URL = "http://localhost:5000";
let socket = null;

// Function to check 3x3 winners
function check3x3Winner(cells) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];
  for (let [a, b, c] of lines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return null;
}

export default function OnlineGame() {
  const [bigBoard, setBigBoard] = useState(Array(81).fill(""));
  const [xIsNext, setXIsNext] = useState(true);
  const [forcedBoard, setForcedBoard] = useState(null);
  const [lastPlayedIndex, setLastPlayedIndex] = useState(null);
  const [room, setRoom] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [opponentFound, setOpponentFound] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [gameID, setGameID] = useState(null);
  const [glowIndex, setGlowIndex] = useState(null);

  useEffect(() => {
    if (!socket) {
      socket = io(SERVER_URL);
      setIsConnected(true);

      socket.on("match_found", ({ room, symbol, gameID }) => {
        setRoom(room);
        setPlayerSymbol(symbol);
        setOpponentFound(true);
        setXIsNext(symbol === "X");
        setGameID(gameID); // Store Game ID
        
      });
      

      socket.on("update_board", ({ board, nextPlayer, lastIndex, forcedBoard, playedIndex }) => {
        setBigBoard(board);
        setXIsNext(nextPlayer);
        setLastPlayedIndex(lastIndex);
        setForcedBoard(forcedBoard);
        
        // Use playedIndex directly to update glow
        setGlowIndex(playedIndex);
      });
      

      socket.on("opponent_left", () => {
        alert("Your opponent has left the game!");
        resetGame();
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from server");
        resetGame();
      });

      socket.emit("find_game");
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // Determine sub-board winners
  const subBoardWinners = Array(9)
    .fill(null)
    .map((_, i) => check3x3Winner(bigBoard.slice(i * 9, i * 9 + 9)));

  // Check for overall winner
  const overallWinner = check3x3Winner(subBoardWinners);

  function handleCellClick(bigIndex, smallIndex) {
    if (!opponentFound || (xIsNext && playerSymbol !== "X") || (!xIsNext && playerSymbol !== "O")) {
      return;
    }
  
    if (overallWinner || subBoardWinners[bigIndex]) return;
  
    if (forcedBoard !== null && forcedBoard !== bigIndex) return;
  
    const cellIndex = bigIndex * 9 + smallIndex;
    if (bigBoard[cellIndex]) return;
  
    const nextBoard = [...bigBoard];
    nextBoard[cellIndex] = playerSymbol;
  
    const newForcedBoard =
      subBoardWinners[smallIndex] ||
      bigBoard.slice(smallIndex * 9, smallIndex * 9 + 9).every((cell) => cell !== "")
        ? null
        : smallIndex;
  
    setBigBoard(nextBoard);
    setXIsNext(!xIsNext);
    setLastPlayedIndex(smallIndex);
    setForcedBoard(newForcedBoard);
    setGlowIndex(cellIndex); // Set glow correctly
  
    // Send exact cell clicked
    socket.emit("move", { 
      room, 
      board: nextBoard, 
      nextPlayer: !xIsNext, 
      lastIndex: smallIndex, 
      forcedBoard: newForcedBoard,
      playedIndex: cellIndex // Send exact index
    });
  }
  

  useEffect(() => {
    if (lastPlayedIndex === null) return;

    const nextSubWinner = subBoardWinners[lastPlayedIndex];
    const nextSubCells = bigBoard.slice(lastPlayedIndex * 9, lastPlayedIndex * 9 + 9);
    const isSubFull = nextSubCells.every((cell) => cell !== "");

    setForcedBoard(nextSubWinner || isSubFull ? null : lastPlayedIndex);
    // eslint-disable-next-line
  }, [xIsNext]);

  let status = overallWinner
    ? `Player ${overallWinner} wins!`
    : `Next player: ${xIsNext ? "X" : "O"} ${
        forcedBoard !== null ? `— Play in sub-board #${forcedBoard + 1}` : ""
      }`;

  function resetGame() {
    setBigBoard(Array(81).fill(""));
    setXIsNext(true);
    setForcedBoard(null);
    setLastPlayedIndex(null);
    setRoom(null);
    setPlayerSymbol(null);
    setOpponentFound(false);
    setIsConnected(false);

    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  return (
    <div className="game-container">
      <h2>Online Game</h2>
      {!opponentFound ? (
        <p>Waiting for an opponent...</p>
      ) : (
        <>
          {gameID && <p><strong>Game ID: {gameID}</strong></p>}
          <p>You are playing as {playerSymbol}</p>
          <div className="big-board">
            {Array(9)
              .fill(null)
              .map((_, i) => (
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
          <button onClick={resetGame}>Leave Game</button>
        </>
      )}
    </div>
  );
}
