import React from 'react';

function VisualizerBox({ children, onRemove }) {
  return (
    <div className="container neumorphism" style={{ position: 'relative' }}>
      <button className="remove-box-button" onClick={onRemove}>✕</button>
      {children}
    </div>
  );
}

export default VisualizerBox;