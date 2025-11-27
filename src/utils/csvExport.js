/**
 * CSV Export Utility
 * Provides functions to export data to CSV format
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
 * Triggers a CSV file download in the browser (Requirement 14.3)
 * @param {string} csvContent - The CSV content as a string
 * @param {string} filename - The desired filename (default: 'reports_export.csv')
 */
export function downloadCSV(csvContent, filename = 'reports_export.csv') {
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
