import { useRef, useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'info', ms = 4800) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    if (ms > 0) {
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, ms);
    }
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
