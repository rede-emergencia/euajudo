import { useState } from 'react';

export function useAlert() {
  const [alert, setAlert] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'error') => {
    setAlert({
      show: true,
      title,
      message,
      type
    });
  };

  const closeAlert = () => {
    setAlert({
      show: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  const showSuccess = (title, message) => {
    showAlert(title, message, 'success');
  };

  const showError = (title, message) => {
    showAlert(title, message, 'error');
  };

  const showWarning = (title, message) => {
    showAlert(title, message, 'warning');
  };

  const showInfo = (title, message) => {
    showAlert(title, message, 'info');
  };

  return {
    alert,
    showAlert,
    closeAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
