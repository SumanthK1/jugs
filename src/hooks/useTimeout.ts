import { useEffect, useRef } from 'react';

export const useTimeout = (callback: () => void, delayMs: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;

    const timer = setTimeout(() => {
      savedCallback.current();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);
};
