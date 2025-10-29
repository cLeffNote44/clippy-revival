import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { create } from 'zustand';

// Toast store for managing toast notifications
export const useToastStore = create((set) => ({
  toasts: [],

  showToast: (message, severity = 'info', title = null, duration = 6000) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, severity, title, duration }]
    }));
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  },

  // Convenience methods
  success: (message, title = 'Success') => {
    useToastStore.getState().showToast(message, 'success', title);
  },

  error: (message, title = 'Error') => {
    useToastStore.getState().showToast(message, 'error', title, 8000);
  },

  warning: (message, title = 'Warning') => {
    useToastStore.getState().showToast(message, 'warning', title);
  },

  info: (message, title = null) => {
    useToastStore.getState().showToast(message, 'info', title);
  }
}));

const Toast = () => {
  const { toasts, hideToast } = useToastStore();

  return (
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration}
          onClose={() => hideToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            bottom: { xs: 16 + (index * 70), sm: 24 + (index * 70) }
          }}
        >
          <Alert
            onClose={() => hideToast(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: 300 }}
          >
            {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default Toast;
