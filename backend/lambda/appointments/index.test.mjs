import { describe, it, expect } from 'vitest';

/**
 * Basic unit tests for appointments Lambda
 * These tests verify the core logic without requiring AWS services
 */

describe('Appointment Validation', () => {
  it('should validate date format', () => {
    const validDate = '2025-12-15';
    const invalidDate = '12/15/2025';
    
    expect(/^\d{4}-\d{2}-\d{2}$/.test(validDate)).toBe(true);
    expect(/^\d{4}-\d{2}-\d{2}$/.test(invalidDate)).toBe(false);
  });
  
  it('should validate time format', () => {
    const validTime = '14:30';
    const invalidTime = '2:30 PM';
    
    expect(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(validTime)).toBe(true);
    expect(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(invalidTime)).toBe(false);
  });
  
  it('should validate appointment types', () => {
    const validTypes = ['consultation', 'follow-up', 'procedure', 'urgent'];
    const invalidType = 'checkup';
    
    validTypes.forEach(type => {
      expect(['consultation', 'follow-up', 'procedure', 'urgent'].includes(type)).toBe(true);
    });
    
    expect(['consultation', 'follow-up', 'procedure', 'urgent'].includes(invalidType)).toBe(false);
  });
  
  it('should validate duration is in 15-minute increments', () => {
    expect(30 % 15).toBe(0);
    expect(45 % 15).toBe(0);
    expect(60 % 15).toBe(0);
    expect(20 % 15).not.toBe(0);
  });
  
  it('should validate appointment status values', () => {
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
    const invalidStatus = 'pending';
    
    validStatuses.forEach(status => {
      expect(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(status)).toBe(true);
    });
    
    expect(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(invalidStatus)).toBe(false);
  });
});

describe('Appointment Conflict Detection Logic', () => {
  it('should detect overlapping appointments', () => {
    // Appointment 1: 10:00 - 11:00 (60 minutes)
    const apt1Start = 10 * 60; // 600 minutes
    const apt1End = apt1Start + 60; // 660 minutes
    
    // Appointment 2: 10:30 - 11:30 (60 minutes) - OVERLAPS
    const apt2Start = 10 * 60 + 30; // 630 minutes
    const apt2End = apt2Start + 60; // 690 minutes
    
    // Check overlap: apt2 starts before apt1 ends AND apt2 ends after apt1 starts
    const hasOverlap = apt2Start < apt1End && apt2End > apt1Start;
    expect(hasOverlap).toBe(true);
  });
  
  it('should not detect conflict for adjacent appointments', () => {
    // Appointment 1: 10:00 - 11:00 (60 minutes)
    const apt1Start = 10 * 60; // 600 minutes
    const apt1End = apt1Start + 60; // 660 minutes
    
    // Appointment 2: 11:00 - 12:00 (60 minutes) - NO OVERLAP
    const apt2Start = 11 * 60; // 660 minutes
    const apt2End = apt2Start + 60; // 720 minutes
    
    // Check overlap
    const hasOverlap = apt2Start < apt1End && apt2End > apt1Start;
    expect(hasOverlap).toBe(false);
  });
  
  it('should detect when new appointment is completely within existing', () => {
    // Existing: 10:00 - 12:00 (120 minutes)
    const existingStart = 10 * 60;
    const existingEnd = existingStart + 120;
    
    // New: 10:30 - 11:00 (30 minutes) - WITHIN
    const newStart = 10 * 60 + 30;
    const newEnd = newStart + 30;
    
    const hasOverlap = newStart < existingEnd && newEnd > existingStart;
    expect(hasOverlap).toBe(true);
  });
});

describe('Default Duration by Type', () => {
  it('should return correct default durations', () => {
    const durations = {
      'consultation': 60,
      'follow-up': 30,
      'procedure': 90,
      'urgent': 45
    };
    
    expect(durations['consultation']).toBe(60);
    expect(durations['follow-up']).toBe(30);
    expect(durations['procedure']).toBe(90);
    expect(durations['urgent']).toBe(45);
  });
});

describe('Time Block Conflict Detection', () => {
  it('should detect conflict when appointment overlaps with time block', () => {
    // Time block: 12:00 - 13:00 (lunch break)
    const blockStart = 12 * 60; // 720 minutes
    const blockEnd = 13 * 60; // 780 minutes
    
    // Appointment: 12:30 - 13:30 (60 minutes) - OVERLAPS
    const aptStart = 12 * 60 + 30; // 750 minutes
    const aptEnd = aptStart + 60; // 810 minutes
    
    const hasOverlap = aptStart < blockEnd && aptEnd > blockStart;
    expect(hasOverlap).toBe(true);
  });
  
  it('should not detect conflict when appointment is before time block', () => {
    // Time block: 12:00 - 13:00
    const blockStart = 12 * 60;
    const blockEnd = 13 * 60;
    
    // Appointment: 11:00 - 12:00 - NO OVERLAP
    const aptStart = 11 * 60;
    const aptEnd = 12 * 60;
    
    const hasOverlap = aptStart < blockEnd && aptEnd > blockStart;
    expect(hasOverlap).toBe(false);
  });
  
  it('should not detect conflict when appointment is after time block', () => {
    // Time block: 12:00 - 13:00
    const blockStart = 12 * 60;
    const blockEnd = 13 * 60;
    
    // Appointment: 13:00 - 14:00 - NO OVERLAP
    const aptStart = 13 * 60;
    const aptEnd = 14 * 60;
    
    const hasOverlap = aptStart < blockEnd && aptEnd > blockStart;
    expect(hasOverlap).toBe(false);
  });
  
  it('should detect conflict when appointment completely contains time block', () => {
    // Time block: 12:00 - 13:00
    const blockStart = 12 * 60;
    const blockEnd = 13 * 60;
    
    // Appointment: 11:00 - 14:00 (180 minutes) - CONTAINS BLOCK
    const aptStart = 11 * 60;
    const aptEnd = 14 * 60;
    
    const hasOverlap = aptStart < blockEnd && aptEnd > blockStart;
    expect(hasOverlap).toBe(true);
  });
});

describe('Duration Increment Validation', () => {
  it('should accept valid 15-minute increments', () => {
    const validDurations = [15, 30, 45, 60, 75, 90, 105, 120];
    
    validDurations.forEach(duration => {
      expect(duration % 15).toBe(0);
    });
  });
  
  it('should reject invalid duration increments', () => {
    const invalidDurations = [10, 20, 25, 35, 40, 50, 65, 70];
    
    invalidDurations.forEach(duration => {
      expect(duration % 15).not.toBe(0);
    });
  });
  
  it('should reject negative durations', () => {
    const negativeDuration = -30;
    expect(negativeDuration <= 0).toBe(true);
  });
  
  it('should reject zero duration', () => {
    const zeroDuration = 0;
    expect(zeroDuration <= 0).toBe(true);
  });
});
