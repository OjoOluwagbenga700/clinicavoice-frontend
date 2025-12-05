import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { apiGet, apiPut } from "../services/api";

/**
 * RescheduleDialog Component
 * Modal dialog for rescheduling appointments
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.5
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onClose - Callback when dialog is closed
 * @param {Object} appointment - Appointment to reschedule
 * @param {Function} onSuccess - Callback after successful reschedule
 */
export default function RescheduleDialog({ 
  open, 
  onClose, 
  appointment,
  onSuccess
}) {
  // Form state
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Initialize form with current appointment data
  useEffect(() => {
    if (appointment && open) {
      // Parse current date
      const currentDate = appointment.date ? new Date(appointment.date) : null;
      setNewDate(currentDate);

      // Parse current time
      if (appointment.time) {
        const [hours, minutes] = appointment.time.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        setNewTime(timeDate);
      } else {
        setNewTime(null);
      }

      setError(null);
      setConflictError(null);
    }
  }, [appointment, open]);

  // Handle date change
  const handleDateChange = (date) => {
    setNewDate(date);
    setConflictError(null);
  };

  // Handle time change
  const handleTimeChange = (time) => {
    setNewTime(time);
    setConflictError(null);
  };

  // Check for appointment conflicts (Requirement 9.2)
  const checkConflicts = async () => {
    if (!newDate || !newTime || !appointment) {
      return true;
    }

    setCheckingConflict(true);
    setConflictError(null);

    try {
      const dateStr = format(newDate, 'yyyy-MM-dd');
      const timeStr = format(newTime, 'HH:mm');

      // Skip conflict check if date and time haven't changed
      if (dateStr === appointment.date && timeStr === appointment.time) {
        return true;
      }

      // Fetch appointments for the selected date
      const response = await apiGet(
        `/appointments?startDate=${dateStr}&endDate=${dateStr}`
      );

      const existingAppointments = response.appointments || [];

      // Check for overlapping appointments
      for (const apt of existingAppointments) {
        // Skip checking against the same appointment
        if (apt.id === appointment.id) {
          continue;
        }

        // Skip cancelled appointments
        if (apt.status === 'cancelled') {
          continue;
        }

        // Parse appointment time
        const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
        const aptStartMinutes = aptHours * 60 + aptMinutes;
        const aptEndMinutes = aptStartMinutes + apt.duration;

        // Parse form time
        const formStartMinutes = newTime.getHours() * 60 + newTime.getMinutes();
        const formEndMinutes = formStartMinutes + appointment.duration;

        // Check for overlap
        if (
          (formStartMinutes >= aptStartMinutes && formStartMinutes < aptEndMinutes) ||
          (formEndMinutes > aptStartMinutes && formEndMinutes <= aptEndMinutes) ||
          (formStartMinutes <= aptStartMinutes && formEndMinutes >= aptEndMinutes)
        ) {
          setConflictError(
            `Time slot conflicts with existing appointment at ${apt.time} (${apt.duration} min)`
          );
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Error checking conflicts:', err);
      // Don't block submission on conflict check error
      return true;
    } finally {
      setCheckingConflict(false);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!newDate) {
      setError("Date is required");
      return false;
    }

    if (!newTime) {
      setError("Time is required");
      return false;
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(newDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError("Cannot reschedule to a date in the past");
      return false;
    }

    return true;
  };

  // Handle reschedule submission (Requirement 9.1)
  const handleReschedule = async () => {
    setError(null);
    setConflictError(null);

    if (!validateForm()) {
      return;
    }

    // Check for conflicts (Requirement 9.2)
    const noConflict = await checkConflicts();
    if (!noConflict) {
      setError("Cannot reschedule due to time slot conflict");
      return;
    }

    setLoading(true);

    try {
      const dateStr = format(newDate, 'yyyy-MM-dd');
      const timeStr = format(newTime, 'HH:mm');

      // Update appointment with new date/time
      // Note: The backend preserves createdAt automatically (Requirement 9.3)
      const response = await apiPut(`/appointments/${appointment.id}`, {
        date: dateStr,
        time: timeStr
      });

      console.log('Appointment rescheduled successfully:', response);

      if (onSuccess) {
        onSuccess(response);
      }

      handleClose();
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      setError(err.message || 'Failed to reschedule appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel (Requirement 9.5)
  const handleClose = () => {
    setError(null);
    setConflictError(null);
    onClose();
  };

  // Format time display
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!appointment) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#2E3A59" }}>
          Reschedule Appointment
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Current Appointment Info */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Current Appointment
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
            {appointment.patient 
              ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
              : 'Patient'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(appointment.date)} at {formatTime(appointment.time)}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={appointment.type}
              size="small"
              sx={{ mr: 1, textTransform: 'capitalize' }}
            />
            <Chip 
              label={`${appointment.duration} min`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Error Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {conflictError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {conflictError}
          </Alert>
        )}

        {/* New Date and Time Selection */}
        <Typography variant="h6" sx={{ mb: 2, color: "#2E3A59" }}>
          Select New Date & Time
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="New Date *"
                value={newDate}
                onChange={handleDateChange}
                disabled={loading}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="New Time *"
                value={newTime}
                onChange={handleTimeChange}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        {/* Conflict checking indicator */}
        {checkingConflict && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Checking for conflicts...
            </Typography>
          </Box>
        )}

        {/* Info message */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            * The appointment type, duration, and notes will remain unchanged.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleReschedule}
          variant="contained"
          disabled={loading || checkingConflict}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Rescheduling..." : "Reschedule Appointment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
