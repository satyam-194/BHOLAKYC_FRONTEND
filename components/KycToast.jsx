import React from 'react';

const TOAST_CSS = `
.kyc-app-toast-host {
  position: fixed;
  z-index: 100000;
  left: 50%;
  transform: translateX(-50%);
  bottom: max(20px, env(safe-area-inset-bottom, 20px));
  width: min(calc(100% - 32px), 420px);
  pointer-events: none;
}
.kyc-app-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.45;
  font-family: 'DM Sans', system-ui, sans-serif;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.15), 0 2px 8px rgba(15, 23, 42, 0.08);
  animation: kycToastIn 0.28s ease;
  border: 1px solid transparent;
}
@keyframes kycToastIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.kyc-app-toast.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #14532d;
}
.kyc-app-toast.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #7f1d1d;
}
.kyc-app-toast.info {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e3a8a;
}
.kyc-app-toast-icon { flex-shrink: 0; margin-top: 1px; }
.kyc-app-toast-msg { flex: 1; min-width: 0; }
.kyc-app-toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 0 0 0 8px;
  font-size: 18px;
  line-height: 1;
}
@media (min-width: 640px) {
  .kyc-app-toast-host {
    left: auto;
    right: 24px;
    transform: none;
    bottom: 24px;
    width: 380px;
  }
}
`;

export default function KycToast({ toast, onDismiss }) {
  if (!toast || !toast.message) return null;
  const type = toast.type || 'info';
  return (
    <>
      <style>{TOAST_CSS}</style>
      <div className="kyc-app-toast-host" role="status" aria-live="polite">
        <div className={`kyc-app-toast ${type}`}>
          <span className="kyc-app-toast-icon" aria-hidden>
            {type === 'success' && '✓'}
            {type === 'error' && '✕'}
            {type === 'info' && 'ⓘ'}
          </span>
          <span className="kyc-app-toast-msg">{toast.message}</span>
          {onDismiss ? (
            <button type="button" className="kyc-app-toast-close" onClick={onDismiss} aria-label="Dismiss">
              ×
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
