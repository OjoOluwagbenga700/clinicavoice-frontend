/**
 * CSV Export Utility
 * Provides functions to export data to CSV format
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

/**
 * Converts an array of reports to CSV format (Requirement 14.3)
 * @param {Array} reports - Array of report objects with patient, date, and summary
 * @returns {string} CSV formatted string
 */
export function convertReportsToCSV(reports) {
  if (!reports || reports.length === 0) {
    return 'Patient Name,Date,Summary\n';
  }

  // CSV header
  const header = 'Patient Name,Date,Summary\n';

  // CSV rows - escape fields that might contain commas or quotes
  const rows = reports.map(report => {
    const patientName = escapeCSVField(report.patient || '');
    const date = escapeCSVField(report.date || '');
    const summary = escapeCSVField(report.summary || '');
    
    return `${patientName},${date},${summary}`;
  }).join('\n');

  return header + rows;
}

/**
 * Converts an array of patients to CSV format (Requirement 15.1, 18.5)
 * @param {Array} patients - Array of patient objects
 * @param {boolean} includeAddress - Whether to include address fields (default: false for privacy)
 * @returns {string} CSV formatted string
 */
export function convertPatientsToCSV(patients, includeAddress = false) {
  if (!patients || patients.length === 0) {
    return 'MRN,First Name,Last Name,Date of Birth,Gender,Phone,Email,Status,Last Visit,Annual Visits,Needs Follow-up,Account Status\n';
  }

  // CSV header - exclude sensitive data unless authorized (Requirement 15.5)
  // Include visit frequency metrics (Requirement 18.5)
  let header = 'MRN,First Name,Last Name,Date of Birth,Gender,Phone,Email,Status,Last Visit,Annual Visits,Needs Follow-up,Account Status';
  if (includeAddress) {
    header += ',Street,City,Province,Postal Code,Country';
  }
  header += '\n';

  // CSV rows
  const rows = patients.map(patient => {
    const row = [
      escapeCSVField(patient.mrn || ''),
      escapeCSVField(patient.firstName || ''),
      escapeCSVField(patient.lastName || ''),
      escapeCSVField(patient.dateOfBirth || ''),
      escapeCSVField(patient.gender || ''),
      escapeCSVField(patient.phone || ''),
      escapeCSVField(patient.email || ''),
      escapeCSVField(patient.status || ''),
      escapeCSVField(patient.lastVisitDate || 'N/A'),
      escapeCSVField(String(patient.annualVisitCount ?? 'N/A')),
      escapeCSVField(patient.needsFollowUp ? 'Yes' : 'No'),
      escapeCSVField(patient.accountStatus || 'N/A')
    ];

    // Include address if authorized (Requirement 15.5)
    if (includeAddress && patient.address) {
      row.push(
        escapeCSVField(patient.address.street || ''),
        escapeCSVField(patient.address.city || ''),
        escapeCSVField(patient.address.province || ''),
        escapeCSVField(patient.address.postalCode || ''),
        escapeCSVField(patient.address.country || '')
      );
    }

    return row.join(',');
  }).join('\n');

  return header + rows;
}

/**
 * Converts an array of appointments to CSV format (Requirement 15.2)
 * @param {Array} appointments - Array of appointment objects
 * @param {boolean} includeNotes - Whether to include appointment notes (default: false for privacy)
 * @returns {string} CSV formatted string
 */
export function convertAppointmentsToCSV(appointments, includeNotes = false) {
  if (!appointments || appointments.length === 0) {
    return 'Date,Time,Duration (min),Patient Name,Patient MRN,Type,Status,Created At\n';
  }

  // CSV header - exclude sensitive data unless authorized (Requirement 15.5)
  let header = 'Date,Time,Duration (min),Patient Name,Patient MRN,Type,Status,Created At';
  if (includeNotes) {
    header += ',Notes';
  }
  header += '\n';

  // CSV rows
  const rows = appointments.map(appointment => {
    // Get patient name from patient object or use patientId
    const patientName = appointment.patient 
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
      : 'N/A';
    const patientMRN = appointment.patient?.mrn || 'N/A';

    const row = [
      escapeCSVField(appointment.date || ''),
      escapeCSVField(appointment.time || ''),
      escapeCSVField(String(appointment.duration || '')),
      escapeCSVField(patientName),
      escapeCSVField(patientMRN),
      escapeCSVField(appointment.type || ''),
      escapeCSVField(appointment.status || ''),
      escapeCSVField(appointment.createdAt || '')
    ];

    // Include notes if authorized (Requirement 15.5)
    if (includeNotes) {
      row.push(escapeCSVField(appointment.notes || ''));
    }

    return row.join(',');
  }).join('\n');

  return header + rows;
}

/**
 * Escapes a field for CSV format
 * Wraps field in quotes if it contains commas, quotes, or newlines
 * @param {string} field - The field to escape
 * @returns {string} Escaped field
 */
function escapeCSVField(field) {
  const stringField = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replaceAll('"', '""')}"`;
  }
  
  return stringField;
}

/**
 * Generates a timestamp for filenames (Requirement 15.4)
 * @returns {string} Timestamp in format YYYY-MM-DD_HH-MM-SS
 */
export function generateTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Triggers a CSV file download in the browser (Requirement 14.3, 15.4)
 * @param {string} csvContent - The CSV content as a string
 * @param {string} filename - The desired filename (default: 'export.csv')
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Exports reports to CSV and triggers download (Requirement 14.3)
 * @param {Array} reports - Array of report objects
 * @param {string} filename - Optional filename
 */
export function exportReportsToCSV(reports, filename) {
  const csvContent = convertReportsToCSV(reports);
  downloadCSV(csvContent, filename);
}

/**
 * Exports patients to CSV and triggers download (Requirement 15.1, 15.3, 15.4)
 * @param {Array} patients - Array of patient objects (already filtered)
 * @param {Object} options - Export options
 * @param {string} options.statusFilter - Current status filter applied
 * @param {boolean} options.includeAddress - Whether to include address (default: false)
 */
export function exportPatientsToCSV(patients, options = {}) {
  const { statusFilter = 'all', includeAddress = false } = options;
  
  // Convert patients to CSV (Requirement 15.3 - filters already applied)
  const csvContent = convertPatientsToCSV(patients, includeAddress);
  
  // Generate filename with timestamp (Requirement 15.4)
  const timestamp = generateTimestamp();
  const filename = `patients-${statusFilter}-${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
}

/**
 * Exports appointments to CSV and triggers download (Requirement 15.2, 15.3, 15.4)
 * @param {Array} appointments - Array of appointment objects (already filtered)
 * @param {Object} options - Export options
 * @param {string} options.dateRange - Description of date range filter
 * @param {boolean} options.includeNotes - Whether to include notes (default: false)
 */
export function exportAppointmentsToCSV(appointments, options = {}) {
  const { dateRange = 'all', includeNotes = false } = options;
  
  // Convert appointments to CSV (Requirement 15.3 - filters already applied)
  const csvContent = convertAppointmentsToCSV(appointments, includeNotes);
  
  // Generate filename with timestamp (Requirement 15.4)
  const timestamp = generateTimestamp();
  const filename = `appointments-${dateRange}-${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
}
