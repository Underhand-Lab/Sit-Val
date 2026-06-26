import React, { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Box, Button, Div, H1 } from "@shared/bridges/UIBridge";
import vars from "@shared/components/ui-brick/variables";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  style?: any;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  style,
}) => {
  if (!isOpen) return null;
  const rootBody = document.body;
  if (!rootBody) return null;

  return createPortal(
    <Div
      className="panel frostedglassmorphism"
      style={{ ...overlayStyle, fontFamily: vars.font }}
      onClick={onClose}
    >
      <Box
        className="pop-up container"
        style={{ ...modalStyle, color: vars.text, ...style }}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <Div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <H1>{title}</H1>
        </Div>
        <Div style={{ paddingBottom: "15px" }}>{children}</Div>
        <Button onClick={onClose}>닫기</Button>
      </Box>
    </Div>,
    rootBody,
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
};

const modalStyle: React.CSSProperties = {
  maxWidth: "500px",
  padding: "10px 25px",
};

export default Modal;
