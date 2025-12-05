import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Refresh as RefreshIcon, Error as ErrorIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * ErrorDisplay Component
 * Reusable error display with retry option
 * 
 * @param {string} message - Error message to display
 * @param {Function} onRetry - Optional callback for retry action
 * @param {string} title - Optional error title
 * @param {boolean} fullHeight - Whether to take full height (default: true)
 */
export default function ErrorDisplay({ 
  message = 'An error occurred. Please try again.',
  onRetry,
  title = 'Error',
  fullHeight = true
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullHeight ? 400 : 'auto',
        py: fullHeight ? 8 : 4,
        px: 2
      }}
      role="alert"
      aria-live="assertive"
    >
      <ErrorIcon 
        sx={{ 
          fontSize: 64, 
          color: 'error.main', 
          mb: 2,
          opacity: 0.7
        }}
        aria-hidden="true"
      />
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 1, 
          fontWeight: 600,
          color: 'text.primary'
        }}
        id="error-title"
      >
        {title}
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}
        id="error-message"
      >
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 1 }}
          aria-label="Retry loading"
        >
          Try Again
        </Button>
      )}
    </Box>
  );
}


ErrorDisplay.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  title: PropTypes.string,
  fullHeight: PropTypes.bool,
};
