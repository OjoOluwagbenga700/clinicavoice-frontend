import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingSpinner Component
 * Reusable loading indicator with optional message
 * 
 * @param {string} message - Optional loading message to display
 * @param {number} size - Size of the spinner (default: 40)
 * @param {boolean} fullHeight - Whether to take full height (default: true)
 */
export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 40,
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
        gap: 2
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <CircularProgress size={size} aria-label="Loading" />
      {message && (
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {message}
        </Typography>
      )}
    </Box>
  );
}
