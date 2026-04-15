import React, { useState } from 'react';

const BottomSheet = ({ isOpen, onClose, title, children, initialHeight = 500 }) => {
  const [sheetHeight, setSheetHeight] = useState(initialHeight);

  const handleResizeStart = (e) => {
    const startY = e.clientY || (e.touches && e.touches[0].clientY);
    const startHeight = sheetHeight;

    const onMove = (moveEvent) => {
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
      <div className="bottom-sheet-overlay active" onClick={onClose} />
      <div 
        className="bottom-sheet-container active" 
        style={{ height: `${sheetHeight}px`, transition: 'none' }}
      >
        <div 
          className="bottom-sheet-handle" 
          onMouseDown={handleResizeStart} 
          onTouchStart={handleResizeStart} 
          style={{ cursor: 'ns-resize' }} 
        />
        <div className="bottom-sheet-header" style={{ padding: '0 20px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
        </div>
        <hr/>
        <div 
          className="bottom-sheet-content" 
          style={{ 
            padding: '0 20px 20px 20px', 
            height: `${sheetHeight - 80}px`, 
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </div>
      </div>
    <style dangerouslySetInnerHTML={{ __html: `
      .bottom-sheet-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4); z-index: 1000;
        opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
      }
      .bottom-sheet-overlay.active { opacity: 1; pointer-events: auto; }
      .bottom-sheet-container {
        position: fixed; bottom: 0; left: 0; right: 0;
        background: #f8f9fa; z-index: 1001;
        padding: 20px; border-radius: 20px 20px 0 0;
        box-shadow: 0 -5px 20px rgba(0,0,0,0.1);
        transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-height: 90vh; /* Adjusted for better mobile experience */
        overflow: hidden; /* Content div handles scroll */
      }
      .bottom-sheet-container.active { transform: translateY(0); }
      .bottom-sheet-handle {
        width: 40px; height: 5px; background: #ccc;
        border-radius: 3px; margin: -10px auto 15px; cursor: ns-resize;
      }
    `}} />

    </>
  );
};

export default BottomSheet;