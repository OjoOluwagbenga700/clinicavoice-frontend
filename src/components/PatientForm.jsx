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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

/**
 * PatientForm Component
 * Form for creating and editing patient records
 * 
 * Requirements: 1.2, 1.3, 1.4, 13.5
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onClose - Callback when dialog is closed
 * @param {Function} onSave - Callback when form is saved with patient data
 * @param {Object} patient - Existing patient data for editing (null for new patient)
 * @param {boolean} loading - Whether the form is in a loading state
 */
export default function PatientForm({ open, onClose, onSave, patient = null, loading = false }) {
  const isEditMode = patient !== null;

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: null,
    gender: "prefer-not-to-say",
    phone: "",
    email: "",
    address: {
      street: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Canada"
    },
    preferredContactMethod: "email"
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Initialize form with patient data when editing
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
        gender: patient.gender || "prefer-not-to-say",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || {
          street: "",
          city: "",
          province: "",
          postalCode: "",
          country: "Canada"
        },
        preferredContactMethod: patient.preferredContactMethod || "email"
      });
    } else {
      // Reset form for new patient
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: null,
        gender: "prefer-not-to-say",
        phone: "",
        email: "",
        address: {
          street: "",
          city: "",
          province: "",
          postalCode: "",
          country: "Canada"
        },
        preferredContactMethod: "email"
      });
    }
    setErrors({});
    setFormError(null);
  }, [patient, open]);

  // Handle text field changes
  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };

  // Handle address field changes
  const handleAddressChange = (field) => (event) => {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [field]: event.target.value
      }
    });
  };

  // Handle date of birth change
  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      dateOfBirth: newDate
    });
    // Clear error for date field
    if (errors.dateOfBirth) {
      setErrors({
        ...errors,
        dateOfBirth: null
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required field validation (Requirement 1.2)
    if (!formData.firstName || formData.firstName.trim() === "") {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName || formData.lastName.trim() === "") {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      // Validate date is not in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (formData.dateOfBirth > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
      
      // Validate reasonable age (not more than 150 years old)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      if (formData.dateOfBirth < minDate) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    // At least one contact method required (Requirement 1.2)
    if (!formData.phone && !formData.email) {
      newErrors.contact = "At least one contact method (phone or email) is required";
    }

    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone format validation (basic)
    if (formData.phone && formData.phone.trim() !== "") {
      // Remove all non-digit characters for validation
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        newErrors.phone = "Phone number must be at least 10 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    setFormError(null);

    if (!validateForm()) {
      setFormError("Please fix the errors below before saving");
      return;
    }

    // Format date of birth as YYYY-MM-DD
    const formattedData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth
        ? formData.dateOfBirth.toISOString().split("T")[0]
        : null,
      // Trim string fields
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: {
        street: formData.address.street.trim(),
        city: formData.address.city.trim(),
        province: formData.address.province.trim(),
        postalCode: formData.address.postalCode.trim(),
        country: formData.address.country.trim()
      }
    };

    onSave(formattedData);
  };

  // Handle cancel
  const handleCancel = () => {
    setErrors({});
    setFormError(null);
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
          {isEditMode ? "Edit Patient" : "Add New Patient"}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        {errors.contact && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.contact}
          </Alert>
        )}

        <Box component="form" noValidate>
          {/* Demographics Section */}
          <Typography variant="h6" sx={{ mt: 2, mb: 2, color: "#2E3A59" }}>
            Demographics
          </Typography>

          <Grid container spacing={2}>
            {/* First Name - Required */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                error={!!errors.firstName}
                helperText={errors.firstName}
                disabled={loading}
                autoFocus={!isEditMode}
              />
            </Grid>

            {/* Last Name - Required */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={loading}
              />
            </Grid>

            {/* Date of Birth - Required */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth *"
                  value={formData.dateOfBirth}
                  onChange={handleDateChange}
                  disabled={loading}
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dateOfBirth,
                      helperText: errors.dateOfBirth,
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Gender */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={formData.gender}
                onChange={handleChange("gender")}
                disabled={loading}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Contact Information Section */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: "#2E3A59" }}>
            Contact Information
          </Typography>

          <Grid container spacing={2}>
            {/* Phone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleChange("phone")}
                error={!!errors.phone}
                helperText={errors.phone || "At least one contact method required"}
                disabled={loading}
                placeholder="(555) 123-4567"
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                error={!!errors.email}
                helperText={errors.email || "At least one contact method required"}
                disabled={loading}
                placeholder="patient@example.com"
              />
            </Grid>

            {/* Preferred Contact Method */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Preferred Contact Method"
                value={formData.preferredContactMethod}
                onChange={handleChange("preferredContactMethod")}
                disabled={loading}
              >
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Address Section */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: "#2E3A59" }}>
            Address
          </Typography>

          <Grid container spacing={2}>
            {/* Street */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={handleAddressChange("street")}
                disabled={loading}
              />
            </Grid>

            {/* City */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={handleAddressChange("city")}
                disabled={loading}
              />
            </Grid>

            {/* Province */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Province"
                value={formData.address.province}
                onChange={handleAddressChange("province")}
                disabled={loading}
              />
            </Grid>

            {/* Postal Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.address.postalCode}
                onChange={handleAddressChange("postalCode")}
                disabled={loading}
                placeholder="A1A 1A1"
              />
            </Grid>

            {/* Country */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.address.country}
                onChange={handleAddressChange("country")}
                disabled={loading}
              />
            </Grid>
          </Grid>

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
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Saving..." : "Save Patient"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
