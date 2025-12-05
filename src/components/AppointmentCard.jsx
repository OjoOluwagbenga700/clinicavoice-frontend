import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  List,
  ListItem
} from "@mui/material";
import {
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Schedule as RescheduleIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreIcon,
  EventAvailable as ConfirmIcon,
  EventBusy as NoShowIcon,
  Description as TranscriptionIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import { apiPost } from "../services/api";
import { useNavigate } from "react-router-dom";

/**
 * AppointmentCard Component
 * Displays appointment information with quick action buttons
 * Requirements: 5.2, 6.1, 8.2
 * 
 * @param {Object} appointment - Appointment object with patient, date, time, duration, type, status
 * @param {Function} onClick - Callback when card is clicked
 * @param {Function} onStatusChange - Callback after status is updated
 * @param {Function} onReschedule - Callback to trigger reschedule flow
 * @param {boolean} compact - Whether to show compact version
 */
export default function AppointmentCard({ 
  appointment, 
  onClick, 
  onStatusChange,
  onReschedule,
  compact = false 
}) {
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get appointment type color
  const getTypeColor = (type) => {
    const colors = {
      consultation: '#2196F3',
      'follow-up': '#4CAF50',
      procedure: '#FF9800',
      urgent: '#F44336'
    };
    return colors[type] || '#757575';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no-show':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Format time display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle status menu
  const handleStatusMenuOpen = (e) => {
    e.stopPropagation();
    setStatusMenuAnchor(e.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    handleStatusMenuClose();

    // Special handling for completed status - prompt for transcription
    if (newStatus === 'completed') {
      setCompletionDialogOpen(true);
      return;
    }

    // Special handling for cancelled status - require reason
    if (newStatus === 'cancelled') {
      setCancelDialogOpen(true);
      return;
    }

    // For other statuses, update directly
    setLoading(true);
    setError(null);

    try {
      await apiPost(`/appointments/${appointment.id}/status`, {
        status: newStatus
      });

      if (onStatusChange) {
        onStatusChange(appointment.id, newStatus);
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle complete appointment with transcription prompt
  const handleCompleteWithTranscription = async (createTranscription) => {
    setLoading(true);
    setError(null);

    try {
      await apiPost(`/appointments/${appointment.id}/status`, {
        status: 'completed'
      });

      if (onStatusChange) {
        onStatusChange(appointment.id, 'completed');
      }

      setCompletionDialogOpen(false);

      // Navigate to transcription page if user wants to create one
      if (createTranscription) {
        navigate('/dashboard/transcribe', {
          state: {
            patientId: appointment.patientId,
            appointmentId: appointment.id
          }
        });
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError('Failed to complete appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel appointment
  const handleCancelClick = (e) => {
    e.stopPropagation();
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancellationReason.trim()) {
      setError('Cancellation reason is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiPost(`/appointments/${appointment.id}/status`, {
        status: 'cancelled',
        reason: cancellationReason
      });

      if (onStatusChange) {
        onStatusChange(appointment.id, 'cancelled');
      }

      setCancelDialogOpen(false);
      setCancellationReason("");
      setError(null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setCancellationReason("");
    setError(null);
  };

  const handleCompletionDialogClose = () => {
    setCompletionDialogOpen(false);
    setError(null);
  };

  // Handle reschedule
  const handleReschedule = (e) => {
    e.stopPropagation();
    if (onReschedule) {
      onReschedule(appointment);
    }
  };

  // Determine if actions should be shown
  const showActions = appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canChangeStatus = appointment.status !== 'completed' && appointment.status !== 'cancelled';

  return (
    <>
      <Card 
        elevation={1} 
        sx={{ 
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s',
          borderLeft: `4px solid ${getTypeColor(appointment.type)}`,
          '&:hover': onClick ? {
            elevation: 3,
            transform: 'translateY(-2px)'
          } : {}
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
          {/* Header with patient info and status */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon color="primary" fontSize="small" />
              <Typography variant={compact ? "body1" : "h6"} sx={{ color: "#2E3A59", fontWeight: 600 }}>
                {appointment.patient 
                  ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                  : 'Loading...'}
              </Typography>
            </Box>
            <Chip 
              label={appointment.status} 
              color={getStatusColor(appointment.status)}
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>

          {/* Patient MRN */}
          {appointment.patient && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>MRN:</strong> {appointment.patient.mrn}
            </Typography>
          )}

          {/* Date and Time */}
          <Box display="flex" flexDirection="column" gap={0.5} mb={1.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDate(appointment.date)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatTime(appointment.time)} ({appointment.duration} min)
              </Typography>
            </Box>
          </Box>

          {/* Appointment Type */}
          <Box mb={showActions ? 1.5 : 0}>
            <Chip 
              label={appointment.type}
              size="small"
              sx={{
                backgroundColor: getTypeColor(appointment.type),
                color: 'white',
                textTransform: 'capitalize',
                fontWeight: 500
              }}
            />
          </Box>

          {/* Quick Action Buttons */}
          {showActions && (
            <Box 
              display="flex" 
              gap={1} 
              mt={1.5}
              pt={1.5}
              borderTop="1px solid #e0e0e0"
            >
              <Tooltip title="Mark as completed">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={loading ? <CircularProgress size={16} /> : <CompleteIcon />}
                    onClick={() => handleStatusChange('completed')}
                    disabled={loading}
                    sx={{ flex: 1 }}
                  >
                    Complete
                  </Button>
                </span>
              </Tooltip>
              
              <Tooltip title="Reschedule appointment">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleReschedule}
                    disabled={loading}
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 1
                    }}
                  >
                    <RescheduleIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Tooltip title="More actions">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleStatusMenuOpen}
                    disabled={loading}
                    sx={{
                      border: '1px solid',
                      borderColor: 'action.active',
                      borderRadius: 1
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}

          {/* Status change button for non-active appointments */}
          {!showActions && canChangeStatus && (
            <Box 
              display="flex" 
              gap={1} 
              mt={1.5}
              pt={1.5}
              borderTop="1px solid #e0e0e0"
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<MoreIcon />}
                onClick={handleStatusMenuOpen}
                disabled={loading}
                fullWidth
              >
                Change Status
              </Button>
            </Box>
          )}

          {/* Status History Toggle */}
          {appointment.statusHistory && appointment.statusHistory.length > 1 && (
            <Box 
              mt={1.5}
              pt={1.5}
              borderTop="1px solid #e0e0e0"
            >
              <Button
                size="small"
                startIcon={<HistoryIcon />}
                endIcon={showHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistory(!showHistory);
                }}
                sx={{ textTransform: 'none' }}
              >
                Status History ({appointment.statusHistory.length})
              </Button>
              
              <Collapse in={showHistory}>
                <List dense sx={{ mt: 1 }}>
                  {appointment.statusHistory.slice().reverse().map((history, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <Box>
                        <Typography variant="caption" display="block">
                          <strong>{history.status}</strong>
                          {history.reason && ` - ${history.reason}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(history.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          )}

          {/* Error message */}
          {error && !cancelDialogOpen && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem 
          onClick={() => handleStatusChange('scheduled')}
          disabled={appointment.status === 'scheduled'}
        >
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Scheduled</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleStatusChange('confirmed')}
          disabled={appointment.status === 'confirmed'}
        >
          <ListItemIcon>
            <ConfirmIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Confirmed</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleStatusChange('completed')}
          disabled={appointment.status === 'completed'}
        >
          <ListItemIcon>
            <CompleteIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Completed</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => handleStatusChange('no-show')}
          disabled={appointment.status === 'no-show'}
        >
          <ListItemIcon>
            <NoShowIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>No-Show</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleStatusChange('cancelled')}
          disabled={appointment.status === 'cancelled'}
        >
          <ListItemIcon>
            <CancelIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Cancelled</ListItemText>
        </MenuItem>
      </Menu>

      {/* Completion Dialog with Transcription Prompt */}
      <Dialog 
        open={completionDialogOpen} 
        onClose={handleCompletionDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Would you like to create a transcription for this appointment?
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creating a transcription now will help document the visit details while they're fresh.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={16} /> : <TranscriptionIcon />}
              onClick={() => handleCompleteWithTranscription(true)}
              disabled={loading}
            >
              {loading ? 'Completing...' : 'Yes, Create Transcription'}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleCompleteWithTranscription(false)}
              disabled={loading}
            >
              Complete Without Transcription
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCompletionDialogClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={handleCancelDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for cancelling this appointment:
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="e.g., Patient requested cancellation, scheduling conflict, etc."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelDialogClose}
            disabled={loading}
          >
            Close
          </Button>
          <Button 
            onClick={handleCancelConfirm}
            variant="contained"
            color="error"
            disabled={loading || !cancellationReason.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
