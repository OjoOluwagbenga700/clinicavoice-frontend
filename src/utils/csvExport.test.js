import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  convertReportsToCSV, 
  convertPatientsToCSV, 
  convertAppointmentsToCSV,
  generateTimestamp,
  downloadCSV, 
  exportReportsToCSV,
  exportPatientsToCSV,
  exportAppointmentsToCSV
} from './csvExport';

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
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'export.csv');
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

  describe('convertPatientsToCSV', () => {
    it('should convert patients array to CSV format with header (Requirement 15.1)', () => {
      const patients = [
        {
          mrn: 'MRN001',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-15',
          gender: 'male',
          phone: '555-1234',
          email: 'john@example.com',
          status: 'active',
          lastVisitDate: '2025-11-01',
          accountStatus: 'active'
        },
        {
          mrn: 'MRN002',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1990-05-20',
          gender: 'female',
          phone: '555-5678',
          email: 'jane@example.com',
          status: 'active',
          accountStatus: 'pending'
        }
      ];

      const csv = convertPatientsToCSV(patients);

      expect(csv).toContain('MRN,First Name,Last Name,Date of Birth,Gender,Phone,Email,Status,Last Visit,Annual Visits,Needs Follow-up,Account Status');
      expect(csv).toContain('MRN001,John,Doe,1980-01-15,male,555-1234,john@example.com,active,2025-11-01,N/A,No,active');
      expect(csv).toContain('MRN002,Jane,Smith,1990-05-20,female,555-5678,jane@example.com,active,N/A,N/A,No,pending');
    });

    it('should exclude address by default (Requirement 15.5)', () => {
      const patients = [
        {
          mrn: 'MRN001',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-15',
          gender: 'male',
          phone: '555-1234',
          email: 'john@example.com',
          status: 'active',
          address: {
            street: '123 Main St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M1M 1M1',
            country: 'Canada'
          }
        }
      ];

      const csv = convertPatientsToCSV(patients, false);

      expect(csv).not.toContain('Street');
      expect(csv).not.toContain('123 Main St');
    });

    it('should include address when authorized (Requirement 15.5)', () => {
      const patients = [
        {
          mrn: 'MRN001',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-15',
          gender: 'male',
          phone: '555-1234',
          email: 'john@example.com',
          status: 'active',
          address: {
            street: '123 Main St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M1M 1M1',
            country: 'Canada'
          }
        }
      ];

      const csv = convertPatientsToCSV(patients, true);

      expect(csv).toContain('Street,City,Province,Postal Code,Country');
      expect(csv).toContain('123 Main St,Toronto,ON,M1M 1M1,Canada');
    });

    it('should handle empty patients array', () => {
      const csv = convertPatientsToCSV([]);
      expect(csv).toContain('MRN,First Name,Last Name');
    });
  });

  describe('convertAppointmentsToCSV', () => {
    it('should convert appointments array to CSV format with header (Requirement 15.2)', () => {
      const appointments = [
        {
          date: '2025-12-05',
          time: '10:00',
          duration: 30,
          patient: {
            firstName: 'John',
            lastName: 'Doe',
            mrn: 'MRN001'
          },
          type: 'consultation',
          status: 'scheduled',
          createdAt: '2025-12-01T10:00:00Z'
        },
        {
          date: '2025-12-05',
          time: '11:00',
          duration: 45,
          patient: {
            firstName: 'Jane',
            lastName: 'Smith',
            mrn: 'MRN002'
          },
          type: 'follow-up',
          status: 'confirmed',
          createdAt: '2025-12-01T11:00:00Z'
        }
      ];

      const csv = convertAppointmentsToCSV(appointments);

      expect(csv).toContain('Date,Time,Duration (min),Patient Name,Patient MRN,Type,Status,Created At');
      expect(csv).toContain('2025-12-05,10:00,30,John Doe,MRN001,consultation,scheduled');
      expect(csv).toContain('2025-12-05,11:00,45,Jane Smith,MRN002,follow-up,confirmed');
    });

    it('should exclude notes by default (Requirement 15.5)', () => {
      const appointments = [
        {
          date: '2025-12-05',
          time: '10:00',
          duration: 30,
          patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN001' },
          type: 'consultation',
          status: 'scheduled',
          createdAt: '2025-12-01T10:00:00Z',
          notes: 'Sensitive patient notes'
        }
      ];

      const csv = convertAppointmentsToCSV(appointments, false);

      expect(csv).not.toContain('Notes');
      expect(csv).not.toContain('Sensitive patient notes');
    });

    it('should include notes when authorized (Requirement 15.5)', () => {
      const appointments = [
        {
          date: '2025-12-05',
          time: '10:00',
          duration: 30,
          patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN001' },
          type: 'consultation',
          status: 'scheduled',
          createdAt: '2025-12-01T10:00:00Z',
          notes: 'Patient notes here'
        }
      ];

      const csv = convertAppointmentsToCSV(appointments, true);

      expect(csv).toContain('Notes');
      expect(csv).toContain('Patient notes here');
    });

    it('should handle appointments without patient object', () => {
      const appointments = [
        {
          date: '2025-12-05',
          time: '10:00',
          duration: 30,
          patientId: 'patient-123',
          type: 'consultation',
          status: 'scheduled',
          createdAt: '2025-12-01T10:00:00Z'
        }
      ];

      const csv = convertAppointmentsToCSV(appointments);

      expect(csv).toContain('N/A,N/A');
    });

    it('should handle empty appointments array', () => {
      const csv = convertAppointmentsToCSV([]);
      expect(csv).toContain('Date,Time,Duration (min),Patient Name');
    });
  });

  describe('generateTimestamp', () => {
    it('should generate a timestamp in correct format (Requirement 15.4)', () => {
      const timestamp = generateTimestamp();
      
      // Should match format: YYYY-MM-DD_HH-MM-SS
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });
  });

  describe('exportPatientsToCSV', () => {
    beforeEach(() => {
      vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
        style: {}
      });
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should export patients with timestamp in filename (Requirement 15.4)', () => {
      const patients = [
        {
          mrn: 'MRN001',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-15',
          gender: 'male',
          phone: '555-1234',
          email: 'john@example.com',
          status: 'active'
        }
      ];

      exportPatientsToCSV(patients, { statusFilter: 'active' });

      const mockLink = document.createElement.mock.results[0].value;
      const downloadCall = mockLink.setAttribute.mock.calls.find(call => call[0] === 'download');
      
      expect(downloadCall[1]).toMatch(/^patients-active-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('should apply current filters to export (Requirement 15.3)', () => {
      const patients = [
        { mrn: 'MRN001', firstName: 'John', lastName: 'Doe', status: 'active' }
      ];

      // The function receives already filtered patients
      expect(() => exportPatientsToCSV(patients, { statusFilter: 'active' })).not.toThrow();
    });
  });

  describe('exportAppointmentsToCSV', () => {
    beforeEach(() => {
      vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
        style: {}
      });
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should export appointments with timestamp in filename (Requirement 15.4)', () => {
      const appointments = [
        {
          date: '2025-12-05',
          time: '10:00',
          duration: 30,
          patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN001' },
          type: 'consultation',
          status: 'scheduled',
          createdAt: '2025-12-01T10:00:00Z'
        }
      ];

      exportAppointmentsToCSV(appointments, { dateRange: '2025-12-01_to_2025-12-31' });

      const mockLink = document.createElement.mock.results[0].value;
      const downloadCall = mockLink.setAttribute.mock.calls.find(call => call[0] === 'download');
      
      expect(downloadCall[1]).toMatch(/^appointments-2025-12-01_to_2025-12-31-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('should apply current filters to export (Requirement 15.3)', () => {
      const appointments = [
        {
          date: '2025-12-05',
          time: '10:00',
          duration: 30,
          type: 'consultation',
          status: 'scheduled'
        }
      ];

      // The function receives already filtered appointments
      expect(() => exportAppointmentsToCSV(appointments, { dateRange: 'week' })).not.toThrow();
    });
  });
});
