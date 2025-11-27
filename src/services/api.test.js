import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchDashboardStats,
  fetchActivityChart,
  fetchRecentNotes,
  fetchPatientDashboardStats,
  fetchPatientRecentReports,
} from './api';

describe('Dashboard API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchDashboardStats', () => {
    it('should fetch clinician dashboard statistics', async () => {
      const stats = await fetchDashboardStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('activePatients');
      expect(stats).toHaveProperty('recentTranscriptions');
      expect(stats).toHaveProperty('pendingReviews');
      expect(typeof stats.activePatients).toBe('number');
      expect(typeof stats.recentTranscriptions).toBe('number');
      expect(typeof stats.pendingReviews).toBe('number');
    });
  });

  describe('fetchActivityChart', () => {
    it('should fetch activity chart data', async () => {
      const activityData = await fetchActivityChart();
      
      expect(Array.isArray(activityData)).toBe(true);
      expect(activityData.length).toBeGreaterThan(0);
      
      const firstItem = activityData[0];
      expect(firstItem).toHaveProperty('date');
      expect(firstItem).toHaveProperty('transcriptions');
      expect(typeof firstItem.date).toBe('string');
      expect(typeof firstItem.transcriptions).toBe('number');
    });
  });

  describe('fetchRecentNotes', () => {
    it('should fetch recent notes data', async () => {
      const notes = await fetchRecentNotes();
      
      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBeGreaterThan(0);
      
      const firstNote = notes[0];
      expect(firstNote).toHaveProperty('id');
      expect(firstNote).toHaveProperty('patient');
      expect(firstNote).toHaveProperty('status');
      expect(firstNote).toHaveProperty('date');
    });
  });

  describe('fetchPatientDashboardStats', () => {
    it('should fetch patient dashboard statistics', async () => {
      const stats = await fetchPatientDashboardStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalReports');
      expect(stats).toHaveProperty('upcomingAppointments');
      expect(stats).toHaveProperty('lastVisit');
      expect(typeof stats.totalReports).toBe('number');
      expect(typeof stats.upcomingAppointments).toBe('number');
      expect(typeof stats.lastVisit).toBe('string');
    });
  });

  describe('fetchPatientRecentReports', () => {
    it('should fetch patient recent reports', async () => {
      const reports = await fetchPatientRecentReports();
      
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThan(0);
      
      const firstReport = reports[0];
      expect(firstReport).toHaveProperty('id');
      expect(firstReport).toHaveProperty('title');
      expect(firstReport).toHaveProperty('status');
      expect(firstReport).toHaveProperty('date');
    });
  });
});
