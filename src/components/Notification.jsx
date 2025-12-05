import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Notification Component
 * Reusable notification/toast component for success, error, warning, and info messages
 * 
 * @param {boolean} open - Whether the notification is visible
 * @param {Function} onClose - Callback when notification is closed
 * @param {string} message - Message to display
 * @param {string} severity - Severity level: 'success', 'error', 'warning', 'info'
 * @param {number} autoHideDuration - Duration in ms before auto-hiding (default: 6000)
 */
export default function Notification({ 
  open, 
  onClose, 
  message, 
  severity = 'info',
  autoHideDuration = 6000 
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
