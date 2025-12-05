import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { 
  Inbox as InboxIcon,
  PersonAdd as PersonAddIcon,
  EventAvailable as EventIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

/**
 * EmptyState Component
 * Reusable empty state display with optional action button
 * 
 * @param {string} title - Title for the empty state
 * @param {string} message - Description message
 * @param {Function} onAction - Optional callback for action button
 * @param {string} actionLabel - Label for action button
 * @param {string} icon - Icon type: 'inbox', 'person', 'event', 'document'
 * @param {boolean} fullHeight - Whether to take full height (default: true)
 */
export default function EmptyState({ 
  title = 'No items found',
  message = 'There are no items to display.',
  onAction,
  actionLabel = 'Add New',
  icon = 'inbox',
  fullHeight = true
}) {
  const getIcon = () => {
    const iconProps = { 
      sx: { 
        fontSize: 80, 
        color: 'text.disabled', 
        mb: 2,
        opacity: 0.5
      } 
    };
    
    switch (icon) {
      case 'person':
        return <PersonAddIcon {...iconProps} />;
      case 'event':
        return <EventIcon {...iconProps} />;
      case 'document':
        return <DescriptionIcon {...iconProps} />;
      default:
        return <InboxIcon {...iconProps} />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullHeight ? 400 : 'auto',
        py: fullHeight ? 8 : 4,
        px: 2,
        textAlign: 'center'
      }}
      role="status"
      aria-live="polite"
    >
      {getIcon()}
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 1, 
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 500 }}
      >
        {message}
      </Typography>
      {onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{ mt: 1 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
