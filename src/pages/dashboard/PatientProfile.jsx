import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Cake as CakeIcon
} from "@mui/icons-material";
import { apiGet } from "../../services/api";
import { useUserRole } from "../../hooks/useUserRole";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorDisplay from "../../components/ErrorDisplay";

/**
 * PatientProfile Component
 * Displays comprehensive patient information including demographics,
 * transcription history, appointment history, and medical history summary
 * 
 * Supports two views:
 * - Clinician view: Full access with edit capabilities (Requirements: 2.1, 2.2, 2.3, 2.4, 11.1)
 * - Patient view: View-only access to own profile (Requirements: 17.1)
 */
export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPatient, userInfo, loading: roleLoading } = useUserRole();
  
  const [patient, setPatient] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for role to load before fetching profile
    if (!roleLoading) {
      fetchPatientProfile();
    }
  }, [id, roleLoading, isPatient, userInfo]);

  const fetchPatientProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Determine which patient ID to fetch
      let patientIdToFetch = id;
      
      // If user is a patient and no ID is provided, fetch their own profile
      if (isPatient() && !id) {
        // For patients, fetch their own profile using their linked patient ID
        // The userInfo should contain the patient ID from Cognito attributes
        if (userInfo?.attributes?.['custom:patientId']) {
          patientIdToFetch = userInfo.attributes['custom:patientId'];
        } else {
          setError("Unable to load your profile. Please contact support.");
          setLoading(false);
          return;
        }
      } else if (isPatient() && id) {
        // Patients can only view their own profile
        // Verify the requested ID matches their patient ID
        const userPatientId = userInfo?.attributes?.['custom:patientId'];
        if (id !== userPatientId) {
          setError("You can only view your own profile.");
          setLoading(false);
          return;
        }
        patientIdToFetch = id;
      } else if (!patientIdToFetch) {
        setError("Patient ID is required.");
        setLoading(false);
        return;
      }

      // Fetch patient details with associated records
      const response = await apiGet(`/patients/${patientIdToFetch}`);
      setPatient(response.patient || {});
      setTranscriptions(response.transcriptions || []);
      setAppointments(response.appointments || []);
    } catch (err) {
      console.error("Error fetching patient profile:", err);
      setError("Failed to load patient profile. Please try again.");
    } finally {
      setLoading(false);
    }
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Get appointment status color
  const getAppointmentStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "scheduled":
      case "confirmed":
        return "primary";
      case "cancelled":
        return "error";
      case "no-show":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading patient profile..." />;
  }

  if (error) {
    return (
      <Box>
        <ErrorDisplay 
          message={error}
          onRetry={fetchPatientProfile}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard/patients")}
          >
            Back to Patients
          </Button>
        </Box>
      </Box>
    );
  }

  if (!patient) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Patient not found.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard/patients")}
        >
          Back to Patients
        </Button>
      </Box>
    );
  }

  const age = calculateAge(patient.dateOfBirth);

  const isPatientView = isPatient();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          {!isPatientView && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard/patients")}
            >
              Back
            </Button>
          )}
          <Typography variant="h4" sx={{ color: "#2E3A59", fontWeight: 600 }}>
            {isPatientView ? "My Profile" : "Patient Profile"}
          </Typography>
        </Box>
        {!isPatientView && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              // TODO: Open edit patient dialog
              console.log("Edit patient clicked");
            }}
          >
            Edit Patient
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Patient Demographics */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PersonIcon color="primary" />
              <Typography variant="h6" sx={{ color: "#2E3A59" }}>
                Demographics
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {patient.firstName} {patient.lastName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  MRN
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {patient.mrn}
                </Typography>
              </Box>

              <Box display="flex" gap={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <CakeIcon fontSize="small" color="action" />
                    <Typography variant="body1">
                      {formatDate(patient.dateOfBirth)}
                      {age !== null && ` (${age} years old)`}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="body1">
                    {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "N/A"}
                  </Typography>
                </Box>
              </Box>

              {!isPatientView && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={patient.status === "active" ? "Active" : "Inactive"}
                    color={patient.status === "active" ? "success" : "default"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              )}
              
              {isPatientView && patient.accountStatus && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Account Status
                  </Typography>
                  <Chip
                    label={patient.accountStatus === "active" ? "Active" : patient.accountStatus}
                    color={patient.accountStatus === "active" ? "success" : "default"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Phone as PhoneIcon color="primary" />
              <Typography variant="h6" sx={{ color: "#2E3A59" }}>
                Contact Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.phone || "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body1">
                    {patient.email || "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Box display="flex" alignItems="flex-start" gap={0.5}>
                  <HomeIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                  <Box>
                    {patient.address ? (
                      <>
                        <Typography variant="body1">
                          {patient.address.street}
                        </Typography>
                        <Typography variant="body1">
                          {patient.address.city}, {patient.address.province} {patient.address.postalCode}
                        </Typography>
                        <Typography variant="body1">
                          {patient.address.country}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body1">N/A</Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Preferred Contact Method
                </Typography>
                <Typography variant="body1">
                  {patient.preferredContactMethod ? 
                    patient.preferredContactMethod.charAt(0).toUpperCase() + patient.preferredContactMethod.slice(1) 
                    : "N/A"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Appointment History */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#2E3A59", mb: 2 }}>
                Appointment History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {(() => {
                // Filter appointments based on user role
                // Patients should only see completed appointments (Requirement 17.4)
                const displayAppointments = isPatientView
                  ? appointments.filter(apt => apt.status === 'completed')
                  : appointments;

                return displayAppointments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                    {isPatientView 
                      ? "You have no completed appointments yet."
                      : "No appointments found for this patient."}
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          {!isPatientView && <TableCell>Notes</TableCell>}
                          {isPatientView && <TableCell>Clinician</TableCell>}
                          {isPatientView && <TableCell>Records</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{formatDate(appointment.date)}</TableCell>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              {appointment.type ? 
                                appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1) 
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={appointment.status}
                                color={getAppointmentStatusColor(appointment.status)}
                                size="small"
                              />
                            </TableCell>
                            {!isPatientView && (
                              <TableCell>
                                {appointment.notes ? 
                                  (appointment.notes.length > 50 ? 
                                    appointment.notes.substring(0, 50) + "..." 
                                    : appointment.notes)
                                  : "-"}
                              </TableCell>
                            )}
                            {isPatientView && (
                              <>
                                <TableCell>
                                  {appointment.clinicianName || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {appointment.transcriptionId ? (
                                    <Button
                                      size="small"
                                      onClick={() => navigate(`/dashboard/reports`)}
                                    >
                                      View Report
                                    </Button>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      No report
                                    </Typography>
                                  )}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Records / Transcription History */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#2E3A59", mb: 2 }}>
                {isPatientView ? "Medical Records" : "Transcription History"}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {transcriptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  {isPatientView 
                    ? "No medical records available yet."
                    : "No transcriptions found for this patient."}
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transcriptions.map((transcription) => (
                        <TableRow key={transcription.id}>
                          <TableCell>{formatDate(transcription.createdAt)}</TableCell>
                          <TableCell>{transcription.title || "Medical Record"}</TableCell>
                          <TableCell>
                            <Chip
                              label={transcription.status || "Completed"}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => navigate(`/dashboard/reports`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Visit Frequency (Requirements 18.1, 18.2, 18.3) */}
        {!isPatientView && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "#2E3A59", mb: 2 }}>
                  Visit Frequency
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Last Visit Date
                      </Typography>
                      <Typography variant="h6" sx={{ color: "#2E3A59" }}>
                        {patient.lastVisitDate ? formatDate(patient.lastVisitDate) : 'No visits yet'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Visits (Past Year)
                      </Typography>
                      <Typography variant="h6" sx={{ color: "#2E3A59" }}>
                        {patient.annualVisitCount ?? 0}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Follow-up Status
                      </Typography>
                      {patient.needsFollowUp ? (
                        <Chip 
                          label="Needs Follow-up (>6 months)" 
                          color="warning"
                          size="medium"
                        />
                      ) : (
                        <Chip 
                          label="Up to date" 
                          color="success"
                          size="medium"
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Medical History Summary */}
        {!isPatientView && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "#2E3A59", mb: 2 }}>
                  Medical History Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {patient.medicalHistory ? (
                  <Box>
                    {patient.medicalHistory.recentDiagnoses && patient.medicalHistory.recentDiagnoses.length > 0 && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Recent Diagnoses
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {patient.medicalHistory.recentDiagnoses.map((diagnosis, index) => (
                            <Chip key={index} label={diagnosis} size="small" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {patient.medicalHistory.medications && patient.medicalHistory.medications.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Current Medications
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {patient.medicalHistory.medications.map((medication, index) => (
                            <Chip key={index} label={medication} size="small" color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                    No medical history available for this patient.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
