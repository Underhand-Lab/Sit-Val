import React from 'react';
import {Div, H3, Button} from './ui/UI.jsx';


const Popup = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <Div style={styles.overlay} onClick={onClose} />
      <Div style={styles.popup}>
        <H3 style={{marginTop: 0}}>{title}</H3>
        <Div style={styles.content}>
          {children}
        </Div>
        <Button onClick={onClose}>닫기</Button>
      </Div>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1100,
  },
  popup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#f8f9fa',
    zIndex: 1101,
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    padding: '20px',
  },
  content: {
    margin: '20px 0',
  },
};

export default Popup;