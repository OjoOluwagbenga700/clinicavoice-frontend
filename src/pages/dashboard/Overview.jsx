import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import DashboardCard from "../../components/DashboardCard";
import TodayAppointments from "../../components/TodayAppointments";
import PatientUpcomingAppointments from "../../components/PatientUpcomingAppointments";
import PatientAppointmentHistory from "../../components/PatientAppointmentHistory";
import { useUserRole } from "../../hooks/useUserRole";
import {
  fetchDashboardStats,
  fetchActivityChart,
  fetchRecentNotes,
  fetchPatientDashboardStats,
  fetchPatientRecentReports,
  fetchReports,
} from "../../services/api";
import { exportReportsToCSV } from "../../utils/csvExport";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Card,
  Modal,
  Paper,
} from "@mui/material";

export default function DashboardOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole, isClinician, isPatient, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState({});
  const [activityChart, setActivityChart] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (isClinician()) {
          // Fetch clinician-specific data (Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 19.4, 19.5)
          const [statsData, activityData, notesData] = await Promise.all([
            fetchDashboardStats(),
            fetchActivityChart(),
            fetchRecentNotes(),
          ]);
          
          setStats(statsData);
          setActivityChart(activityData);
          setRecentNotes(notesData);
        } else if (isPatient()) {
          // Fetch patient-specific data
          const [statsData, reportsData] = await Promise.all([
            fetchPatientDashboardStats(),
            fetchPatientRecentReports(),
          ]);
          
          setStats(statsData);
          setRecentNotes(reportsData);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch data once role is loaded
    if (!roleLoading && userRole) {
      fetchData();
    }
  }, [userRole, roleLoading]); // Fixed: use userRole instead of function references

  const handleNewTranscription = () => {
    navigate("/dashboard/transcribe");
  };

  const handleUploadAudio = () => {
    setUploadOpen(true);
    // Reset state when opening modal
    setSelectedFile(null);
    setFileError("");
  };

  const handleModalClose = () => {
    setUploadOpen(false);
    // Clean up state when closing modal
    setSelectedFile(null);
    setFileError("");
    setUploading(false);
  };

  // File validation constants
  const VALID_AUDIO_FORMATS = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/mp4'];
  const VALID_EXTENSIONS = ['.webm', '.mp3', '.wav', '.m4a'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

  const validateAudioFile = (file) => {
    if (!file) {
      return { valid: false, error: "No file selected" };
    }

    // Check file format by MIME type
    const isValidMimeType = VALID_AUDIO_FORMATS.includes(file.type);
    
    // Check file format by extension (fallback for cases where MIME type is not set correctly)
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidExtension = VALID_EXTENSIONS.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      return { 
        valid: false, 
        error: `Invalid file format. Please upload an audio file in one of these formats: ${VALID_EXTENSIONS.join(', ')}` 
      };
    }

    // Check file size (Requirement 4.3)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { 
        valid: false, 
        error: `File size (${fileSizeMB}MB) exceeds the maximum limit of 100MB` 
      };
    }

    return { valid: true, error: null };
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Validate file (Requirements 4.1, 4.2, 4.3, 4.4)
    const validation = validateAudioFile(file);
    
    if (!validation.valid) {
      setFileError(validation.error);
      setSelectedFile(null);
      // Clear the file input
      event.target.value = null;
    } else {
      setFileError("");
      setSelectedFile(file);
    }
  };

  const handleConfirmUpload = () => {
    if (!selectedFile) {
      setFileError("Please select an audio file first");
      return;
    }

    // Validate again before proceeding
    const validation = validateAudioFile(selectedFile);
    if (!validation.valid) {
      setFileError(validation.error);
      return;
    }

    // Navigate to transcribe page with the file
    // We'll pass the file through navigation state
    navigate("/dashboard/transcribe", { state: { audioFile: selectedFile } });
    
    // Close modal
    handleModalClose();
  };

  const handleExportReport = async () => {
    // Fetch all reports and export to CSV (Requirement 14.3)
    try {
      const reports = await fetchReports();
      
      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0];
      const filename = `clinicavoice_reports_${today}.csv`;
      
      // Export reports to CSV with patient name, date, and summary
      exportReportsToCSV(reports, filename);
    } catch (error) {
      console.error('Failed to export reports:', error);
      // Could add user-facing error notification here
      alert('Failed to export reports. Please try again.');
    }
  };

  const handleEditTemplates = () => {
    navigate("/dashboard/templates");
  };

  const handleViewReports = () => {
    navigate("/dashboard/reports");
  };

  const handleViewProfile = () => {
    navigate("/dashboard/profile");
  };

  return (
    <Box className="flex flex-col md:flex-row max-w-7xl mx-auto px-6 py-8 gap-6">
      <Sidebar />

      <Box className="flex-1">
        <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
          {t("dashboard_overview")}
        </Typography>

        {(loading || roleLoading) ? (
          <Typography textAlign="center" sx={{ py: 20, color: "#999" }}>
            {t("loading")}...
          </Typography>
        ) : (
          <>
            {/* Clinician Dashboard View */}
            {isClinician() && (
              <>
                {/* Top Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                  <Grid item xs={12} md={4}>
                    <DashboardCard title={t("dashboard_patients")} value={stats.activePatients} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DashboardCard title={t("dashboard_transcriptions")} value={stats.recentTranscriptions} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DashboardCard title={t("dashboard_reviews")} value={stats.pendingReviews} />
                  </Grid>
                </Grid>

                {/* Patient Statistics Cards (Requirement 18.3) */}
                <Card sx={{ p: 3, mb: 6 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    Patient Statistics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Total Active Patients
                        </Typography>
                        <Typography variant="h3" fontWeight={700} color="primary">
                          {stats.totalActivePatients || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          New Patients This Month
                        </Typography>
                        <Typography variant="h3" fontWeight={700} sx={{ color: '#2e7d32' }}>
                          {stats.newPatientsThisMonth || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Patients Needing Follow-up
                        </Typography>
                        <Typography variant="h3" fontWeight={700} sx={{ color: '#e65100' }}>
                          {stats.patientsNeedingFollowup || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          No visit in 6+ months
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>

                {/* Today's Appointments Widget */}
                <Box sx={{ mb: 6 }}>
                  <TodayAppointments />
                </Box>

                {/* Activity Chart */}
                <Card sx={{ p: 3, mb: 6 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    {t("dashboard_activity")}
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={activityChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#666" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="transcriptions" stroke="#C62828" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Recent Notes */}
                <Card sx={{ p: 3, mb: 6 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    {t("dashboard_recentNotes")}
                  </Typography>
                  <Box>
                    {recentNotes.length > 0 ? (
                      <ul style={{ paddingLeft: 20, color: "#555" }}>
                        {recentNotes.map((note) => (
                          <li key={note.id}>
                            {note.patient} —{" "}
                            <Chip
                              label={t(note.status)}
                              color={
                                note.status === "transcribed"
                                  ? "success"
                                  : note.status === "pendingReview"
                                  ? "warning"
                                  : "info"
                              }
                              size="small"
                            />{" "}
                            ({note.date})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography color="text.secondary">
                        No recent notes available
                      </Typography>
                    )}
                  </Box>
                </Card>

                {/* Quick Actions - Clinician */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    {t("dashboard_quickActions")}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleNewTranscription}>
                      {t("action_newTranscription")}
                    </Button>
                    <Button variant="outlined" onClick={handleUploadAudio}>
                      {t("action_uploadAudio")}
                    </Button>
                    <Button variant="outlined" onClick={handleExportReport}>
                      {t("action_exportReport")}
                    </Button>
                    <Button variant="outlined" onClick={handleEditTemplates}>
                      {t("action_editTemplates")}
                    </Button>
                  </Box>
                </Card>
              </>
            )}

            {/* Patient Dashboard View - Simplified */}
            {isPatient() && (
              <>
                {/* Patient Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                  <Grid item xs={12} md={4}>
                    <DashboardCard title="My Reports" value={stats.totalReports} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DashboardCard title="Upcoming Appointments" value={stats.upcomingAppointments} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, height: "100%" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Last Visit
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {stats.lastVisit}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Welcome Message */}
                <Card sx={{ p: 3, mb: 6, backgroundColor: "#f5f5f5" }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Welcome to Your Health Dashboard
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Here you can view your medical reports, check upcoming appointments, and manage your profile. 
                    All your health information is securely stored and managed by your healthcare provider.
                  </Typography>
                </Card>

                {/* Upcoming Appointments Section (Requirements 16.1, 16.2, 16.3, 16.4) */}
                <Box sx={{ mb: 6 }}>
                  <PatientUpcomingAppointments />
                </Box>

                {/* Appointment History Section (Requirements 17.1, 17.2, 17.3, 17.4, 17.5) */}
                <Box sx={{ mb: 6 }}>
                  <PatientAppointmentHistory />
                </Box>

                {/* Recent Reports */}
                <Card sx={{ p: 3, mb: 6 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Recent Reports
                  </Typography>
                  <Box>
                    {recentNotes.length > 0 ? (
                      <ul style={{ paddingLeft: 20, color: "#555" }}>
                        {recentNotes.map((report) => (
                          <li key={report.id}>
                            {report.title} —{" "}
                            <Chip
                              label={report.status}
                              color={
                                report.status === "Reviewed"
                                  ? "success"
                                  : "info"
                              }
                              size="small"
                            />{" "}
                            ({report.date})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography color="text.secondary">
                        No recent reports available
                      </Typography>
                    )}
                  </Box>
                </Card>

                {/* Quick Actions - Patient */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleViewReports}>
                      View My Reports
                    </Button>
                    <Button variant="outlined" onClick={handleViewProfile}>
                      My Profile
                    </Button>
                  </Box>
                </Card>
              </>
            )}

            {/* Upload Modal - Clinician only */}
            {isClinician() && (
              <Modal open={uploadOpen} onClose={handleModalClose}>
                <Paper
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    p: 4,
                    width: 500,
                    maxWidth: "90vw",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {t("action_uploadAudio")}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select an audio file to transcribe. Supported formats: MP3, WAV, M4A, WebM (max 100MB)
                  </Typography>

                  {/* File Input */}
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ py: 2 }}
                    >
                      {selectedFile ? selectedFile.name : "Choose Audio File"}
                      <input
                        hidden
                        type="file"
                        accept=".webm,.mp3,.wav,.m4a,audio/webm,audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a,audio/mp4"
                        onChange={handleFileSelect}
                      />
                    </Button>
                  </Box>

                  {/* File Info */}
                  {selectedFile && !fileError && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>File:</strong> {selectedFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Type:</strong> {selectedFile.type || 'Unknown'}
                      </Typography>
                    </Box>
                  )}

                  {/* Error Message */}
                  {fileError && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="error">
                        ⚠️ {fileError}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                    <Button variant="outlined" onClick={handleModalClose} disabled={uploading}>
                      {t("cancel")}
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleConfirmUpload}
                      disabled={!selectedFile || !!fileError || uploading}
                    >
                      {uploading ? "Processing..." : "Continue to Transcribe"}
                    </Button>
                  </Box>
                </Paper>
              </Modal>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
