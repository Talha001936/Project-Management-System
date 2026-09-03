// Note: This file is a custom React hook that provides a convenient interface for displaying 
// toast notifications in the application. It wraps the toast utility functions and exposes 
// them for use in components, allowing developers to easily show success, error, warning, 
// info, and loading messages, as well as dismissing them when needed.
import { toast } from 'react-hot-toast';

export const useToast = () => {
  return {
    showSuccess: (message, title = 'Success') => {
      return toast.success(title ? `${title}: ${message}` : message, {
        duration: 4000,
        position: 'bottom-right',
        style: {
          background: '#1a1a1a',
          color: '#e8e8e8',
          border: '1px solid rgba(74,158,74,0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
        },
        iconTheme: {
          primary: '#4a9e4a',
          secondary: '#1a1a1a',
        },
      });
    },

    showError: (message, title = 'Error') => {
      return toast.error(title ? `${title}: ${message}` : message, {
        duration: 5000,
        position: 'bottom-right',
        style: {
          background: '#1a1a1a',
          color: '#e8e8e8',
          border: '1px solid rgba(212,84,84,0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
        },
        iconTheme: {
          primary: '#d45454',
          secondary: '#1a1a1a',
        },
      });
    },

    showWarning: (message, title = 'Warning') => {
      return toast.custom((t) => (
        <div
          style={{
            background: '#1a1a1a',
            color: '#f0a030',
            border: '1px solid rgba(240,160,48,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: '320px',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: '#e8e8e8' }}>{title}</div>
            <div style={{ color: '#b0b0b0' }}>{message}</div>
          </div>
        </div>
      ), {
        duration: 4000,
        position: 'bottom-right',
      });
    },

    showInfo: (message, title = 'Info') => {
      return toast.custom((t) => (
        <div
          style={{
            background: '#1a1a1a',
            color: '#6c63ff',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: '320px',
          }}
        >
          <span style={{ fontSize: '24px' }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 600, color: '#e8e8e8' }}>{title}</div>
            <div style={{ color: '#b0b0b0' }}>{message}</div>
          </div>
        </div>
      ), {
        duration: 3000,
        position: 'bottom-right',
      });
    },

    showLoading: (message) => {
      return toast.loading(message, {
        duration: 30000,
        position: 'bottom-right',
        style: {
          background: '#1a1a1a',
          color: '#e8e8e8',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    },

    dismiss: (toastId) => {
      toast.dismiss(toastId);
    },
  };
};