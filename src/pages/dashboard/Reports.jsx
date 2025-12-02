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
  Stack,
  Divider,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PrintIcon from "@mui/icons-material/Print";
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
  
  // Phase 2: View mode and filters
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "week", "month"
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

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
  const filteredReports = reports.filter((r) => {
    const patient = r.patient || r.patientName || '';
    const summary = r.summary || r.content || '';
    const status = r.status || 'completed';
    
    // Search filter
    const matchesSearch = patient.toLowerCase().includes(search.toLowerCase()) ||
      summary.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all' && r.createdAt) {
      const reportDate = new Date(r.createdAt);
      const now = new Date();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (dateFilter === 'today') {
        matchesDate = now - reportDate < dayInMs;
      } else if (dateFilter === 'week') {
        matchesDate = now - reportDate < 7 * dayInMs;
      } else if (dateFilter === 'month') {
        matchesDate = now - reportDate < 30 * dayInMs;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Export report to PDF
  const exportToPDF = (report) => {
    // Create a simple HTML document for PDF
    const patientName = report.patient || report.patientName || 'Unknown';
    const date = report.date || new Date(report.createdAt).toLocaleDateString();
    const transcript = report.content || report.transcript || 'No content available';
    const medicalAnalysis = report.medicalAnalysis || {};
    
    // Add patient copy watermark if user is a patient
    const copyType = isReadOnly ? 'PATIENT COPY' : '';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Report - ${patientName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; position: relative; }
          .header h1 { margin: 0; color: #2196f3; }
          .patient-copy { position: absolute; top: 0; right: 0; background: #4caf50; color: white; padding: 5px 15px; border-radius: 3px; font-size: 12px; font-weight: bold; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { font-weight: bold; width: 150px; }
          .transcript { background: #f5f5f5; padding: 20px; border-radius: 5px; white-space: pre-wrap; }
          .analysis-item { margin-bottom: 15px; }
          .analysis-category { font-weight: bold; color: #2196f3; margin-bottom: 5px; }
          .entity { display: inline-block; background: #e3f2fd; padding: 4px 8px; margin: 2px; border-radius: 3px; font-size: 14px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .patient-notice { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${copyType ? `<div class="patient-copy">${copyType}</div>` : ''}
          <h1>CLINICAVOICE</h1>
          <p>Medical Documentation Report</p>
        </div>
        
        ${isReadOnly ? `
        <div class="patient-notice">
          <strong>Patient Copy</strong><br>
          This is your personal copy of your medical record. This document is for your records only. 
          For official use, please request a certified copy from your healthcare provider.
        </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">PATIENT INFORMATION</div>
          <div class="info-row"><span class="info-label">Patient Name:</span> ${patientName}</div>
          <div class="info-row"><span class="info-label">Report Date:</span> ${date}</div>
          <div class="info-row"><span class="info-label">Status:</span> ${report.status || 'Completed'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">CLINICAL DOCUMENTATION</div>
          <div class="transcript">${transcript}</div>
        </div>
        
        ${medicalAnalysis.entities && medicalAnalysis.entities.length > 0 ? `
        <div class="section">
          <div class="section-title">MEDICAL ANALYSIS</div>
          
          ${(() => {
            const grouped = medicalAnalysis.entities.reduce((acc, entity) => {
              const category = entity.category || 'OTHER';
              if (!acc[category]) acc[category] = [];
              acc[category].push(entity);
              return acc;
            }, {});
            
            const categoryLabels = {
              'MEDICATION': '💊 Medications',
              'MEDICAL_CONDITION': '🩺 Medical Conditions',
              'TEST_TREATMENT_PROCEDURE': '🔬 Tests & Procedures',
              'ANATOMY': '🫀 Anatomy',
            };
            
            return Object.entries(grouped).map(([category, items]) => `
              <div class="analysis-item">
                <div class="analysis-category">${categoryLabels[category] || category}</div>
                ${items.map(entity => `<span class="entity">${entity.text}</span>`).join('')}
              </div>
            `).join('');
          })()}
        </div>
        ` : ''}
        
        ${medicalAnalysis.phi && medicalAnalysis.phi.length > 0 ? `
        <div class="section">
          <div class="section-title">⚠️ PROTECTED HEALTH INFORMATION</div>
          <p><strong>${medicalAnalysis.phi.length} PHI items detected.</strong> Ensure HIPAA compliance when storing, sharing, or transmitting this document.</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>This document was generated by ClinicaVoice AI-powered medical documentation system.</p>
          <p>Confidential - Protected Health Information</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-report-${patientName.replace(/\s+/g, '-')}-${date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    setError('');
    setAccessDeniedMessage('Report exported successfully! Open the HTML file in your browser and use Print to PDF.');
  };

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const handlePrint = (report) => {
    exportToPDF(report);
    handleMenuClose();
  };

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

      {/* Toolbar with search, filters, and view toggle */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
        {/* Search bar */}
        <TextField
          fullWidth
          placeholder="Search by patient or summary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        {/* Status Filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading}
            size="small"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
          </Select>
        </FormControl>
        
        {/* Date Filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Date</InputLabel>
          <Select
            value={dateFilter}
            label="Date"
            onChange={(e) => setDateFilter(e.target.value)}
            disabled={loading}
            size="small"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>
        
        {/* View Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="card">
            <Tooltip title="Card View">
              <ViewModuleIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="table">
            <Tooltip title="Table View">
              <ViewListIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredReports.length} of {reports.length} reports
      </Typography>

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Reports display - Card or Table view */}
      {!loading && viewMode === "card" && (
        <Grid container spacing={3}>
        {filteredReports.map((report) => {
          // Extract medical analysis summary
          const medicalAnalysis = report.medicalAnalysis || {};
          const medicationCount = medicalAnalysis.entities?.filter(e => e.category === 'MEDICATION').length || 0;
          const conditionCount = medicalAnalysis.entities?.filter(e => e.category === 'MEDICAL_CONDITION').length || 0;
          const testCount = medicalAnalysis.entities?.filter(e => e.category === 'TEST_TREATMENT_PROCEDURE').length || 0;
          const phiCount = medicalAnalysis.phi?.length || 0;
          
          // Determine status
          const status = report.status || 'completed';
          const statusConfig = {
            'completed': { label: 'Completed', color: 'success' },
            'draft': { label: 'Draft', color: 'warning' },
            'processing': { label: 'Processing', color: 'info' },
            'failed': { label: 'Failed', color: 'error' },
          };
          const statusInfo = statusConfig[status] || statusConfig['completed'];
          
          // Determine report type
          const reportType = report.type === 'transcription' ? '📋 Clinical Note' : '📄 Report';
          
          // Get patient initials for avatar
          const patientName = report.patient || report.patientName || 'Unknown';
          const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card
                sx={{
                  transition: "transform .2s, box-shadow .2s",
                  "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header with patient info and status */}
                  <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {initials}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {patientName}
                        </Typography>
                        <Chip 
                          label={statusInfo.label} 
                          size="small" 
                          color={statusInfo.color}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {reportType}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Date and time */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    📅 {report.date || new Date(report.createdAt).toLocaleDateString()}
                    {report.createdAt && ` • ${new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </Typography>

                  {/* Summary/Chief Complaint */}
                  <Typography variant="body2" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {report.summary || 'No summary available'}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Medical Analysis Summary */}
                  {medicalAnalysis.summary ? (
                    <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" fontWeight="bold" display="block" mb={1} color="primary">
                        🏥 AI Analysis Summary
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {medicationCount > 0 && (
                          <Chip label={`💊 ${medicationCount}`} size="small" variant="outlined" />
                        )}
                        {conditionCount > 0 && (
                          <Chip label={`🩺 ${conditionCount}`} size="small" variant="outlined" />
                        )}
                        {testCount > 0 && (
                          <Chip label={`🔬 ${testCount}`} size="small" variant="outlined" />
                        )}
                        {phiCount > 0 && (
                          <Chip label={`🔒 ${phiCount} PHI`} size="small" color="warning" variant="outlined" />
                        )}
                        {medicationCount === 0 && conditionCount === 0 && testCount === 0 && (
                          <Typography variant="caption" color="text.secondary">
                            No analysis available
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Medical analysis not yet available
                      </Typography>
                    </Box>
                  )}

                  {/* View Only badge for patients */}
                  {isReadOnly && (
                    <Chip 
                      label="View Only" 
                      size="small" 
                      color="default"
                      sx={{ mt: 1.5 }}
                    />
                  )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Stack direction="row" spacing={1} width="100%">
                    {isReadOnly ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewReport(report.id)}
                          sx={{ flexGrow: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => exportToPDF(report)}
                          title="Download your medical record"
                        >
                          PDF
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenTranscription(report.id)}
                          sx={{ flexGrow: 1 }}
                        >
                          Open
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => exportToPDF(report)}
                          title="Export to PDF"
                        >
                          PDF
                        </Button>
                      </>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          );
        })}

        {filteredReports.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" align="center" color="text.secondary">
              {search || statusFilter !== 'all' || dateFilter !== 'all' 
                ? "No reports found matching your filters." 
                : "No reports found."}
            </Typography>
          </Grid>
        )}
        </Grid>
      )}

      {/* Table View */}
      {!loading && viewMode === "table" && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Medical Analysis</TableCell>
                <TableCell>Summary</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map((report) => {
                // Extract medical analysis summary
                const medicalAnalysis = report.medicalAnalysis || {};
                const medicationCount = medicalAnalysis.entities?.filter(e => e.category === 'MEDICATION').length || 0;
                const conditionCount = medicalAnalysis.entities?.filter(e => e.category === 'MEDICAL_CONDITION').length || 0;
                const testCount = medicalAnalysis.entities?.filter(e => e.category === 'TEST_TREATMENT_PROCEDURE').length || 0;
                const phiCount = medicalAnalysis.phi?.length || 0;
                
                // Determine status
                const status = report.status || 'completed';
                const statusConfig = {
                  'completed': { label: 'Completed', color: 'success' },
                  'draft': { label: 'Draft', color: 'warning' },
                  'processing': { label: 'Processing', color: 'info' },
                  'failed': { label: 'Failed', color: 'error' },
                };
                const statusInfo = statusConfig[status] || statusConfig['completed'];
                
                const patientName = report.patient || report.patientName || 'Unknown';
                const reportType = report.type === 'transcription' ? 'Clinical Note' : 'Report';
                
                return (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {patientName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.date || new Date(report.createdAt).toLocaleDateString()}
                      </Typography>
                      {report.createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusInfo.label} 
                        size="small" 
                        color={statusInfo.color}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{reportType}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {medicationCount > 0 && <Chip label={`💊 ${medicationCount}`} size="small" variant="outlined" />}
                        {conditionCount > 0 && <Chip label={`🩺 ${conditionCount}`} size="small" variant="outlined" />}
                        {testCount > 0 && <Chip label={`🔬 ${testCount}`} size="small" variant="outlined" />}
                        {phiCount > 0 && <Chip label={`🔒 ${phiCount}`} size="small" color="warning" variant="outlined" />}
                        {medicationCount === 0 && conditionCount === 0 && testCount === 0 && (
                          <Typography variant="caption" color="text.secondary">N/A</Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}
                      >
                        {report.summary || 'No summary'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {isReadOnly ? (
                          <>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewReport(report.id)}
                              title="View Report"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => exportToPDF(report)}
                              title="Download your medical record"
                            >
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenTranscription(report.id)}
                              title="Open Report"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => exportToPDF(report)}
                              title="Export PDF"
                            >
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleMenuOpen(e, report)}
                              title="More options"
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                      {search || statusFilter !== 'all' || dateFilter !== 'all' 
                        ? "No reports found matching your filters." 
                        : "No reports found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedReport && handlePrint(selectedReport)}>
          <PrintIcon fontSize="small" sx={{ mr: 1 }} />
          Print / Export
        </MenuItem>
      </Menu>
    </Box>
  );
}
