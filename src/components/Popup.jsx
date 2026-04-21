import React from 'react';

const Popup = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-overlay active" onClick={onClose} />
      <div className={`pop-up neumorphism`} style={{ display: 'block' }}>
        <h3>{title}</h3>
        <div className="content">
          {children}
        </div>
        <button onClick={onClose}>닫기</button>
      </div>
      {/* Styles for the popup and overlay. These could be moved to a global CSS file if preferred. */}
      <style>{`
      .pop-up {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: #f8f9fa; z-index: 1100; border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 90%; max-width: 400px;
          text-align: center;
          display: block; /* Always block when isOpen is true, controlled by parent */
        }
        .pop-up .content {
            margin-bottom: 20px;
            /* Add any specific styling for the content area if needed */
        }
        `}</style>
    </>
  );
};

export default Popup;