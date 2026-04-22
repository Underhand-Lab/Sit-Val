import React from 'react';
import { Box, Div, Button } from './ui/UI';

function VisualizerBox({ children, onRemove }) {
  return (
    <Box className="container">
      <Div style={{ position: 'relative' }}>
        <Button style={{
          position: 'absolute',
          fontFamily: 'sans-serif',
          fontWeight: 1000,
          top: '5px',
          right: '10px',
          width: '25px',
          height: '25px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'gray',
          fontSize: '20px',
          padding: 0,
          lineHeight: '20px',
        }} onClick={onRemove}>✕</Button>
        {children}
      </Div>

    </Box >
  );
}

export default VisualizerBox;