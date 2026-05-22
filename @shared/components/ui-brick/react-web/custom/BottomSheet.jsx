import React, { useState } from 'react';
import { Div } from '../../../../bridges/UIBridge';

const BottomSheet = ({ isOpen, onClose, title, children, initialHeight = 500 }) => {
  const [sheetHeight, setSheetHeight] = useState(initialHeight);

  const handleResizeStart = (e) => {
    const startY = e.clientY || (e.touches && e.touches[0].clientY);
    const startHeight = sheetHeight;

    const onMove = (moveEvent) => {
      // 리사이즈 도중 배경이 스크롤되거나 움직이는 것을 방지
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);
      const delta = startY - currentY;
      const newHeight = Math.max(250, Math.min(window.innerHeight * 0.9, startHeight + delta));
      setSheetHeight(newHeight);
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };

  if (!isOpen) return null;

  return (
    <>
      <Div 
        style={{...styles.overlay, ...(isOpen ? styles.activeOverlay : {})}} 
        onClick={onClose} 
      />
      <Div 
        style={{ 
          ...styles.container, 
          ...(isOpen ? styles.activeContainer : {}),
          height: `${sheetHeight}px`, 
          transition: isOpen ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' 
        }}
      >
        <Div 
          onMouseDown={handleResizeStart} 
          onTouchStart={handleResizeStart} 
          style={styles.handle} 
        >
          <Div style={styles.handleDash} />
        </Div>
        <Div className="bottom-sheet-header" style={{ padding: '0 20px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
        </Div>
        <hr/>
        <Div 
          style={{ 
            padding: '0 20px 20px 20px', 
            height: `${sheetHeight - 80}px`, 
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </Div>
      </Div>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', zIndex: 1000,
    opacity: 0, pointerEvents: 'none', transition: 'opacity 0.3s ease',
  },
  activeOverlay: { opacity: 1, pointerEvents: 'auto' },
  container: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#f8f9fa', zIndex: 1001,
    padding: '20px', borderRadius: '20px 20px 0 0',
    boxShadow: '0 -5px 20px rgba(0,0,0,0.1)',
    transform: 'translateY(100%)',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  activeContainer: { transform: 'translateY(0)' },
  handle: {
    width: '100%', height: '32px',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    margin: '-10px 0 10px 0', cursor: 'ns-resize',
    touchAction: 'none',
  },
  handleDash: {
    width: '40px', height: '5px', background: '#ccc',
    borderRadius: '3px',
  }
};

export default BottomSheet;