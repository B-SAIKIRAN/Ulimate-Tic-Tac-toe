import React from 'react';

export default function Square({ value, onClick, isGlowing }) {
  return (
    <button className={`square ${isGlowing ? 'glow' : ''}`} onClick={onClick}>
      {value}
    </button>
  );
}
