import React from 'react';
import { Box, Div, Button } from './ui/UI';

function VisualizerBox({ children, onRemove }) {
  return (
    <Box style={styles.container}>
      <Button noHover style={styles.closeButton} onClick={onRemove}>✕</Button>
      {children}
    </Box >
  );
}

const styles = {
  container: {
    padding: '20px',
    margin: 0,
    position: 'relative'
  },
  closeButton: {
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
    zIndex: 10,
    boxShadow: 'none', // 버튼 기본 그림자 제거
    transition: 'none', // 애니메이션 효과 제거
    transform: 'none', // 위치 이동 방지
  }
};

export default VisualizerBox;