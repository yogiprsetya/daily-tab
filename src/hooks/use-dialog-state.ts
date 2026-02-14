/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';

export function useDialogState<T extends Record<string, any>>(
  editing: T | null
) {
  const [state, setState] = useState<Partial<T>>({});

  const resetState = useCallback(() => {
    setState({});
  }, []);

  const updateState = useCallback((key: keyof T, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getDisplayValue = useCallback(
    (key: keyof T, defaultValue: any = '') => {
      // Prioritize state changes over editing data
      // eslint-disable-next-line no-prototype-builtins
      if (state.hasOwnProperty(key)) {
        return state[key] ?? defaultValue;
      }
      return editing ? editing[key] : defaultValue;
    },
    [editing, state]
  );

  return {
    state,
    setState,
    resetState,
    updateState,
    getDisplayValue,
  };
}
