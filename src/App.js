import React, { useState } from "react";
import LocalGame from "./components/LocalGame";
import OnlineGame from "./components/OnlineGame";

export default function App() {
  const [gameMode, setGameMode] = useState(null);

  return (
    <div className="app-container">
      {gameMode === null && (
        <div className="game-selection">
          <h1>Ultimate Tic-Tac-Toe</h1>
          <button onClick={() => setGameMode("local")}>Play Locally</button>
          <button onClick={() => setGameMode("online")}>Play Online</button>
        </div>
      )}
      {gameMode === "local" && <LocalGame />}
      {gameMode === "online" && <OnlineGame />}
    </div>
  );
}
