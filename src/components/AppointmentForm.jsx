import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import PatientSelector from "./PatientSelector";
import { apiGet } from "../services/api";

/**
 * AppointmentForm Component
 * Form for creating and editing appointments
 * 
 * Requirements: 4.1, 10.1, 12.1, 12.2, 12.3
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onClose - Callback when dialog is closed
 * @param {Function} onSave - Callback when form is saved with appointment data
 * @param {Object} appointment - Existing appointment data for editing (null for new appointment)
 * @param {boolean} loading - Whether the form is in a loading state
 */
export default function AppointmentForm({ 
  open, 
  onClose, 
  onSave, 
  appointment = null, 
  loading = false 
}) {
  const isEditMode = appointment !== null;

  // Appointment types with default durations (Requirement 12.2)
  const appointmentTypes = [
    { value: "consultation", label: "Consultation", defaultDuration: 60 },
    { value: "follow-up", label: "Follow-up", defaultDuration: 30 },
    { value: "procedure", label: "Procedure", defaultDuration: 90 },
    { value: "urgent", label: "Urgent", defaultDuration: 45 }
  ];

  // Duration options in 15-minute increments (Requirement 12.3)
  const durationOptions = [15, 30, 45, 60, 75, 90, 105, 120];

  // Form state
  const [formData, setFormData] = useState({
    patient: null,
    date: null,
    time: null,
    type: "consultation",
    duration: 60,
    notes: ""
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Initialize form with appointment data when editing
  useEffect(() => {
    if (appointment) {
      // Parse time string to Date object
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);

      setFormData({
        patient: appointment.patient || null,
        date: appointment.date ? new Date(appointment.date) : null,
        time: timeDate,
        type: appointment.type || "consultation",
        duration: appointment.duration || 60,
        notes: appointment.notes || ""
      });
    } else {
      // Reset form for new appointment
      setFormData({
        patient: null,
        date: null,
        time: null,
        type: "consultation",
        duration: 60,
        notes: ""
      });
    }
    setErrors({});
    setFormError(null);
    setConflictError(null);
  }, [appointment, open]);

  // Handle patient selection
  const handlePatientChange = (newPatient) => {
    setFormData({
      ...formData,
      patient: newPatient
    });
    // Clear error for patient field
    if (errors.patient) {
      setErrors({
        ...errors,
        patient: null
      });
    }
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      date: newDate
    });
    // Clear error for date field
    if (errors.date) {
      setErrors({
        ...errors,
        date: null
      });
    }
    // Clear conflict error when date changes
    setConflictError(null);
  };

  // Handle time change
  const handleTimeChange = (newTime) => {
    setFormData({
      ...formData,
      time: newTime
    });
    // Clear error for time field
    if (errors.time) {
      setErrors({
        ...errors,
        time: null
      });
    }
    // Clear conflict error when time changes
    setConflictError(null);
  };

  // Handle appointment type change (Requirement 12.2 - set default duration)
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    const typeConfig = appointmentTypes.find(t => t.value === newType);
    
    setFormData({
      ...formData,
      type: newType,
      duration: typeConfig ? typeConfig.defaultDuration : 60
    });
  };

  // Handle duration change
  const handleDurationChange = (event) => {
    setFormData({
      ...formData,
      duration: event.target.value
    });
    // Clear conflict error when duration changes
    setConflictError(null);
  };

  // Handle notes change
  const handleNotesChange = (event) => {
    setFormData({
      ...formData,
      notes: event.target.value
    });
  };

  // Check for appointment conflicts (Requirement 4.2, 4.4)
  const checkConflicts = async () => {
    if (!formData.date || !formData.time || !formData.duration) {
      return true; // Skip conflict check if required fields are missing
    }

    setCheckingConflict(true);
    setConflictError(null);

    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const timeStr = format(formData.time, 'HH:mm');

      // Fetch appointments for the selected date
      const response = await apiGet(
        `/appointments?startDate=${dateStr}&endDate=${dateStr}`
      );

      const existingAppointments = response.appointments || [];

      // Check for overlapping appointments
      for (const apt of existingAppointments) {
        // Skip checking against the same appointment when editing
        if (isEditMode && apt.id === appointment.id) {
          continue;
        }

        // Parse appointment time
        const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
        const aptStartMinutes = aptHours * 60 + aptMinutes;
        const aptEndMinutes = aptStartMinutes + apt.duration;

        // Parse form time
        const formStartMinutes = formData.time.getHours() * 60 + formData.time.getMinutes();
        const formEndMinutes = formStartMinutes + formData.duration;

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
    } catch (error) {
      console.error('Error checking conflicts:', error);
      // Don't block submission on conflict check error
      return true;
    } finally {
      setCheckingConflict(false);
    }
  };

  // Validate form (Requirement 4.1)
  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.patient) {
      newErrors.patient = "Patient selection is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      // Validate date is not in the past (except for today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = "Cannot schedule appointments in the past";
      }
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
    }

    if (!formData.type) {
      newErrors.type = "Appointment type is required";
    }

    if (!formData.duration) {
      newErrors.duration = "Duration is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setFormError(null);
    setConflictError(null);

    if (!validateForm()) {
      setFormError("Please fix the errors below before saving");
      return;
    }

    // Check for conflicts (Requirement 4.2, 4.4)
    const noConflict = await checkConflicts();
    if (!noConflict) {
      setFormError("Cannot save appointment due to time slot conflict");
      return;
    }

    // Format data for submission
    const formattedData = {
      patientId: formData.patient.id,
      date: format(formData.date, 'yyyy-MM-dd'),
      time: format(formData.time, 'HH:mm'),
      type: formData.type,
      duration: formData.duration,
      notes: formData.notes.trim()
    };

    onSave(formattedData);
  };

  // Handle cancel
  const handleCancel = () => {
    setErrors({});
    setFormError(null);
    setConflictError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#2E3A59" }}>
          {isEditMode ? "Edit Appointment" : "Schedule New Appointment"}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        {conflictError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {conflictError}
          </Alert>
        )}

        <Box component="form" noValidate>
          {/* Patient Selection (Requirement 4.1) */}
          <Typography variant="h6" sx={{ mt: 2, mb: 2, color: "#2E3A59" }}>
            Patient Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PatientSelector
                value={formData.patient}
                onChange={handlePatientChange}
                disabled={loading || isEditMode}
                required
                error={errors.patient}
                helperText={
                  isEditMode 
                    ? "Patient cannot be changed when editing" 
                    : errors.patient || "Select the patient for this appointment"
                }
              />
            </Grid>
          </Grid>

          {/* Date and Time (Requirement 4.1) */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: "#2E3A59" }}>
            Date & Time
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Appointment Date *"
                  value={formData.date}
                  onChange={handleDateChange}
                  disabled={loading}
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date,
                      helperText: errors.date,
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Appointment Time *"
                  value={formData.time}
                  onChange={handleTimeChange}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.time,
                      helperText: errors.time,
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>

          {/* Appointment Type and Duration (Requirements 12.1, 12.2, 12.3) */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: "#2E3A59" }}>
            Appointment Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Appointment Type"
                value={formData.type}
                onChange={handleTypeChange}
                error={!!errors.type}
                helperText={errors.type || "Type determines default duration"}
                disabled={loading}
              >
                {appointmentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label} ({type.defaultDuration} min default)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Duration"
                value={formData.duration}
                onChange={handleDurationChange}
                error={!!errors.duration}
                helperText={errors.duration || "Duration in 15-minute increments"}
                disabled={loading}
              >
                {durationOptions.map((duration) => (
                  <MenuItem key={duration} value={duration}>
                    {duration} minutes
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* Notes (Requirement 10.1) */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: "#2E3A59" }}>
            Notes
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Appointment Notes"
                value={formData.notes}
                onChange={handleNotesChange}
                disabled={loading}
                placeholder="Add any notes or special instructions for this appointment..."
                helperText="Optional notes about the appointment"
              />
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

          {/* Required fields indicator */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              * Required fields
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleCancel} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || checkingConflict}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Saving..." : isEditMode ? "Update Appointment" : "Schedule Appointment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
