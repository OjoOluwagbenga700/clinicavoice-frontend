import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Button,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Download as DownloadIcon
} from "@mui/icons-material";
import PatientCard from "../../components/PatientCard";
import PatientForm from "../../components/PatientForm";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import Notification from "../../components/Notification";
import { apiGet, apiPost } from "../../services/api";
import { exportPatientsToCSV } from "../../utils/csvExport";

/**
 * Patients Page
 * Displays list of patients with search and filter functionality
 * Clinician-only page
 */
export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sortBy, setSortBy] = useState("name"); // 'name' or 'lastVisit'
  const [showFollowUpOnly, setShowFollowUpOnly] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const patientsPerPage = 12;

  // Patient form state
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch patients on mount and when filters change
  useEffect(() => {
    fetchPatients();
  }, [statusFilter, currentPage, sortBy]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * patientsPerPage;
      const params = new URLSearchParams({
        status: statusFilter,
        limit: patientsPerPage.toString(),
        offset: offset.toString(),
        sortBy: sortBy === 'lastVisit' ? 'lastVisit' : undefined,
        sortOrder: 'desc'
      });

      console.log('Fetching patients with params:', params.toString());
      const response = await apiGet(`/patients?${params.toString()}`);
      console.log('Patients response:', response);
      
      setPatients(response.patients || []);
      setTotalPatients(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / patientsPerPage));
    } catch (err) {
      console.error("Error fetching patients:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      setError(`Failed to load patients: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (event, newStatus) => {
    if (newStatus !== null) {
      setStatusFilter(newStatus);
    }
  };

  // Handle patient card click
  const handlePatientClick = (patient) => {
    navigate(`/dashboard/patients/${patient.id}`);
  };

  // Handle invitation sent callback
  const handleInvitationSent = (patientId) => {
    // Refresh the patient list to update the invitation status
    fetchPatients();
    // Show success notification
    setNotification({
      open: true,
      message: 'Invitation sent successfully!',
      severity: 'success'
    });
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Filter patients based on search query and follow-up filter
  const filteredPatients = patients.filter((patient) => {
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const mrn = (patient.mrn || "").toLowerCase();
      const phone = (patient.phone || "").toLowerCase();
      const email = (patient.email || "").toLowerCase();

      const matchesSearch = (
        fullName.includes(searchLower) ||
        mrn.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }
    
    // Apply follow-up filter
    if (showFollowUpOnly && !patient.needsFollowUp) {
      return false;
    }
    
    return true;
  });

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handle export to CSV (Requirements 15.1, 15.3, 15.4, 15.5)
  const handleExportCSV = () => {
    // Export filtered patients with current filters applied (Requirement 15.3)
    exportPatientsToCSV(filteredPatients, {
      statusFilter,
      includeAddress: false // Exclude sensitive data unless authorized (Requirement 15.5)
    });
  };

  // Handle add patient button click
  const handleAddPatient = () => {
    setFormError(null);
    setFormOpen(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setFormOpen(false);
    setFormError(null);
  };

  // Handle form save
  const handleFormSave = async (patientData) => {
    setFormLoading(true);
    setFormError(null);

    try {
      const newPatient = await apiPost("/patients", patientData);
      
      // Refresh the patient list
      await fetchPatients();
      
      // Close the form
      setFormOpen(false);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Patient created successfully!',
        severity: 'success'
      });
      
      // Navigate to the new patient's profile
      navigate(`/dashboard/patients/${newPatient.id}`);
    } catch (err) {
      console.error("Error creating patient:", err);
      setFormError(err.message || "Failed to create patient. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Typography variant="h4" sx={{ color: "#2E3A59", fontWeight: 600 }}>
          Patients
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={filteredPatients.length === 0}
            size="medium"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPatient}
            size="medium"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Add Patient
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, MRN, phone, or email"
              value={searchQuery}
              onChange={handleSearchChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={handleStatusFilterChange}
              aria-label="patient status filter"
              fullWidth
              size="small"
            >
              <ToggleButton value="active" aria-label="active patients">
                Active
              </ToggleButton>
              <ToggleButton value="inactive" aria-label="inactive patients">
                Inactive
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="lastVisit">Last Visit Date</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showFollowUpOnly}
                  onChange={(e) => setShowFollowUpOnly(e.target.checked)}
                  color="warning"
                />
              }
              label="Show only patients needing follow-up (>6 months)"
              sx={{ 
                '& .MuiFormControlLabel-label': { 
                  fontSize: { xs: '0.875rem', sm: '1rem' } 
                } 
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner message="Loading patients..." />
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorDisplay 
          message={error}
          onRetry={fetchPatients}
        />
      )}

      {/* Patient List */}
      {!loading && !error && (
        <>
          {filteredPatients.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No patients found" : "No patients yet"}
              message={
                searchQuery
                  ? "No patients match your search criteria. Try adjusting your filters or search terms."
                  : "Get started by adding your first patient to the system."
              }
              onAction={searchQuery ? null : handleAddPatient}
              actionLabel="Add First Patient"
              icon="person"
            />
          ) : (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredPatients.length} of {totalPatients} patient{totalPatients === 1 ? "" : "s"}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {filteredPatients.map((patient) => (
                  <Grid item xs={12} md={6} lg={4} key={patient.id}>
                    <PatientCard
                      patient={patient}
                      onClick={() => handlePatientClick(patient)}
                      onInvitationSent={handleInvitationSent}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Patient Form Dialog */}
      <PatientForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        patient={null}
        loading={formLoading}
      />

      {/* Form Error Notification */}
      {formError && (
        <Notification
          open={!!formError}
          onClose={() => setFormError(null)}
          message={formError}
          severity="error"
        />
      )}

      {/* Success Notification */}
      <Notification
        open={notification.open}
        onClose={handleNotificationClose}
        message={notification.message}
        severity={notification.severity}
      />
    </Box>
  );
}
