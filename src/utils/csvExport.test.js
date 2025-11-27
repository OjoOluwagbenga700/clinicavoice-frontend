import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertReportsToCSV, downloadCSV, exportReportsToCSV } from './csvExport';

describe('CSV Export Utility', () => {
  describe('convertReportsToCSV', () => {
    it('should convert reports array to CSV format with header', () => {
      const reports = [
        { patient: 'John Doe', date: '2025-10-31', summary: 'General checkup notes' },
        { patient: 'Jane Smith', date: '2025-10-30', summary: 'Cardiology notes' },
      ];

      const csv = convertReportsToCSV(reports);

      expect(csv).toContain('Patient Name,Date,Summary');
      expect(csv).toContain('John Doe,2025-10-31,General checkup notes');
      expect(csv).toContain('Jane Smith,2025-10-30,Cardiology notes');
    });

    it('should handle empty reports array', () => {
      const csv = convertReportsToCSV([]);
      expect(csv).toBe('Patient Name,Date,Summary\n');
    });

    it('should handle null or undefined reports', () => {
      expect(convertReportsToCSV(null)).toBe('Patient Name,Date,Summary\n');
      expect(convertReportsToCSV(undefined)).toBe('Patient Name,Date,Summary\n');
    });

    it('should escape fields containing commas', () => {
      const reports = [
        { patient: 'Doe, John', date: '2025-10-31', summary: 'General checkup, routine' },
      ];

      const csv = convertReportsToCSV(reports);

      expect(csv).toContain('"Doe, John"');
      expect(csv).toContain('"General checkup, routine"');
    });

    it('should escape fields containing quotes', () => {
      const reports = [
        { patient: 'John "Johnny" Doe', date: '2025-10-31', summary: 'Patient said "feeling better"' },
      ];

      const csv = convertReportsToCSV(reports);

      expect(csv).toContain('"John ""Johnny"" Doe"');
      expect(csv).toContain('"Patient said ""feeling better"""');
    });

    it('should escape fields containing newlines', () => {
      const reports = [
        { patient: 'John Doe', date: '2025-10-31', summary: 'Line 1\nLine 2' },
      ];

      const csv = convertReportsToCSV(reports);

      expect(csv).toContain('"Line 1\nLine 2"');
    });

    it('should handle missing fields gracefully', () => {
      const reports = [
        { patient: 'John Doe' }, // missing date and summary
        { date: '2025-10-31' }, // missing patient and summary
      ];

      const csv = convertReportsToCSV(reports);

      expect(csv).toContain('Patient Name,Date,Summary');
      expect(csv).toContain('John Doe,,');
      expect(csv).toContain(',2025-10-31,');
    });
  });

  describe('downloadCSV', () => {
    let createElementSpy;
    let createObjectURLSpy;
    let revokeObjectURLSpy;

    beforeEach(() => {
      // Mock DOM methods
      createElementSpy = vi.spyOn(document, 'createElement');
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      // Mock link element
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
        style: {},
      };
      createElementSpy.mockReturnValue(mockLink);

      // Mock appendChild and removeChild
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a download link with correct attributes', () => {
      const csvContent = 'Patient Name,Date,Summary\nJohn Doe,2025-10-31,Test';
      const filename = 'test_export.csv';

      downloadCSV(csvContent, filename);

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
    });

    it('should use default filename when not provided', () => {
      const csvContent = 'Patient Name,Date,Summary\n';

      downloadCSV(csvContent);

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'reports_export.csv');
    });

    it('should trigger download and cleanup', () => {
      const csvContent = 'Patient Name,Date,Summary\n';

      downloadCSV(csvContent);

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.remove).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('exportReportsToCSV', () => {
    it('should convert reports and trigger download without errors', () => {
      const reports = [
        { patient: 'John Doe', date: '2025-10-31', summary: 'General checkup notes' },
      ];

      // This is an integration test - verify the function runs without throwing
      expect(() => exportReportsToCSV(reports, 'test.csv')).not.toThrow();
    });
  });
});
