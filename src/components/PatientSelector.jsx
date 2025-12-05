import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Button,
  Chip
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { apiPost } from "../services/api";

/**
 * PatientSelector Component
 * Autocomplete dropdown for selecting patients with search functionality
 * 
 * Requirements: 3.1, 3.4
 * 
 * @param {Object} value - Currently selected patient object
 * @param {Function} onChange - Callback when patient is selected (patient) => void
 * @param {Function} onAddNew - Optional callback when "Add New Patient" is clicked
 * @param {boolean} disabled - Whether the selector is disabled
 * @param {boolean} required - Whether patient selection is required
 * @param {string} label - Label for the input field
 * @param {string} placeholder - Placeholder text
 * @param {string} error - Error message to display
 * @param {string} helperText - Helper text to display
 */
export default function PatientSelector({
  value = null,
  onChange,
  onAddNew = null,
  disabled = false,
  required = false,
  label = "Select Patient",
  placeholder = "Search by name or MRN",
  error = null,
  helperText = null
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchError, setSearchError] = useState(null);
  const debounceTimerRef = useRef(null);

  // Search patients function (Requirement 3.4 - real-time filtering)
  const searchPatients = useCallback(async (query) => {
    if (!query || query.trim() === "") {
      setOptions([]);
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      // Search patients by name or MRN (Requirement 3.4)
      const response = await apiPost("/patients/search", {
        query: query.trim(),
        fields: ["name", "mrn"]
      });

      setOptions(response.results || []);
    } catch (err) {
      console.error("Error searching patients:", err);
      setSearchError("Failed to search patients. Please try again.");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search when input changes with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      searchPatients(inputValue);
    }, 300);

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, searchPatients]);

  // Handle patient selection
  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  // Handle input change
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format option label (Requirement 3.4 - display patient name, MRN, age)
  const getOptionLabel = (option) => {
    if (!option) return "";
    return `${option.firstName} ${option.lastName}`;
  };

  // Render option in dropdown
  const renderOption = (props, option) => {
    const age = calculateAge(option.dateOfBirth);
    
    return (
      <Box component="li" {...props} key={option.id}>
        <Box sx={{ width: "100%" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight={500}>
              {option.firstName} {option.lastName}
            </Typography>
            {age !== null && (
              <Chip 
                label={`${age} yrs`} 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            MRN: {option.mrn}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Autocomplete
        value={value}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        options={options}
        getOptionLabel={getOptionLabel}
        renderOption={renderOption}
        loading={loading}
        disabled={disabled}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={
          inputValue.trim() === ""
            ? "Start typing to search patients"
            : searchError
            ? searchError
            : "No patients found"
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            error={!!error}
            helperText={error || helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      
      {/* Quick Add New Patient Button (Requirement 3.4) */}
      {onAddNew && !disabled && (
        <Button
          variant="text"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddNew}
          sx={{ mt: 1 }}
        >
          Add New Patient
        </Button>
      )}
    </Box>
  );
}
