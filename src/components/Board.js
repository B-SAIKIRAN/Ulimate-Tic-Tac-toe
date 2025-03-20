import Square from "./Sqaure";
import "../style.css";

export default function Board({ bigIndex, cells, winner, handleCellClick, forced, glowIndex }) {
  return (
    <div className={`sub-board ${!forced ? "disabled" : ""} ${winner ? "won" : ""}`}>
      {winner && <div className="sub-board-overlay">{winner}</div>}
      {cells.map((value, idx) => (
        <Square 
          key={idx} 
          value={value} 
          onClick={() => handleCellClick(bigIndex, idx)} 
          isGlowing={glowIndex === bigIndex * 9 + idx} 
        />
      ))}
    </div>
  );
}
