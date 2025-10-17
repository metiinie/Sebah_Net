import { useState, useCallback } from 'react';

export const useLoading = (initialState: boolean = false) => {
  const [loading, setLoading] = useState(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  const toggleLoading = useCallback(() => setLoading(prev => !prev), []);

  return {
    loading,
    setLoading,
    startLoading,
    stopLoading,
    toggleLoading
  };
};
