import React, { useEffect, useState } from 'react';
import { Div } from '@shared/bridges/UIBridge';
import Modal from '@shared/components/Modal';
import LoginForm from './LoginForm';
import { closeLoginModal, onCloseLoginModal, onOpenLoginModal } from '@apps/services/authModal';

const LoginModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribeOpen = onOpenLoginModal(() => setIsOpen(true));
    const unsubscribeClose = onCloseLoginModal(() => setIsOpen(false));

    return () => {
      unsubscribeOpen();
      unsubscribeClose();
    };
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="로그인">
      <Div style={{ minWidth: '320px' }}>
        <LoginForm
          onSuccess={() => {
            setIsOpen(false);
            closeLoginModal();
          }}
          containerStyle={{ minWidth: '320px', paddingTop: '10px' }}
          showFrame={false}
          showTitle={false}
        />
      </Div>
    </Modal>
  );
};

export default LoginModal;
