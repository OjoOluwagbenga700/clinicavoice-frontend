import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "../../hooks/useUserRole";
import { fetchReports } from "../../services/api";

export default function Reports() {
  const navigate = useNavigate();
  const { isPatient } = useUserRole();
  const [search, setSearch] = useState("");
  const [accessDeniedMessage, setAccessDeniedMessage] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Determine if reports should be read-only (true for patients)
  const isReadOnly = isPatient();

  // Load reports from backend on component mount (Requirement 11.1, 11.5)
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch reports from backend API
        // The backend will filter based on user role automatically
        const data = await fetchReports();
        console.log('📊 Reports loaded:', data);
        console.log('📊 Number of reports:', data?.length || 0);
        
        setReports(data || []);
      } catch (err) {
        console.error('❌ Failed to load reports:', err);
        setError('Failed to load reports. Please try again later.');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Filter reports by patient name or summary (Requirement 11.2)
  const filteredReports = reports.filter(
    (r) => {
      const patient = r.patient || r.patientName || '';
      const summary = r.summary || r.content || '';
      return (
        patient.toLowerCase().includes(search.toLowerCase()) ||
        summary.toLowerCase().includes(search.toLowerCase())
      );
    }
  );

  const handleOpenTranscription = (reportId) => {
    // Prevent patients from navigating to transcription edit
    if (isReadOnly) {
      setAccessDeniedMessage("You do not have permission to edit transcriptions. Reports are managed by your clinician.");
      return;
    }
    navigate(`/dashboard/transcribe/${reportId}`);
  };

  const handleViewReport = (reportId) => {
    // Patients can view reports in read-only mode
    // For now, we'll navigate to the same page but could add a read-only view
    navigate(`/dashboard/transcribe/${reportId}`);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {isReadOnly ? "My Reports" : "Reports"}
      </Typography>

      {/* Patient information message */}
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 3 }}>
          These reports are managed by your clinician. You have view-only access to your medical documentation.
        </Alert>
      )}

      {/* Access denied message */}
      {accessDeniedMessage && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          onClose={() => setAccessDeniedMessage("")}
        >
          {accessDeniedMessage}
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Search bar */}
      <TextField
        fullWidth
        placeholder="Search by patient or summary..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4 }}
        disabled={loading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Reports grid */}
      {!loading && (
        <Grid container spacing={3}>
        {filteredReports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card
              sx={{
                transition: "transform .2s, box-shadow .2s",
                "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {report.patient}
                  </Typography>
                  {isReadOnly && (
                    <Chip 
                      label="View Only" 
                      size="small" 
                      color="default"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {report.date}
                </Typography>
                <Typography variant="body2">{report.summary}</Typography>
              </CardContent>
              <CardActions>
                {isReadOnly ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewReport(report.id)}
                  >
                    View Report
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenTranscription(report.id)}
                  >
                    Open Transcription
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}

        {filteredReports.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" align="center" color="text.secondary">
              {search ? "No reports found matching your search." : "No reports found."}
            </Typography>
          </Grid>
        )}
        </Grid>
      )}
    </Box>
  );
}
