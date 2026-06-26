const OPEN_LOGIN_MODAL_EVENT = 'sit-val:open-login-modal';
const CLOSE_LOGIN_MODAL_EVENT = 'sit-val:close-login-modal';

export function openLoginModal() {
  window.dispatchEvent(new CustomEvent(OPEN_LOGIN_MODAL_EVENT));
}

export function closeLoginModal() {
  window.dispatchEvent(new CustomEvent(CLOSE_LOGIN_MODAL_EVENT));
}

export function onOpenLoginModal(listener: () => void) {
  window.addEventListener(OPEN_LOGIN_MODAL_EVENT, listener);
  return () => window.removeEventListener(OPEN_LOGIN_MODAL_EVENT, listener);
}

export function onCloseLoginModal(listener: () => void) {
  window.addEventListener(CLOSE_LOGIN_MODAL_EVENT, listener);
  return () => window.removeEventListener(CLOSE_LOGIN_MODAL_EVENT, listener);
}
