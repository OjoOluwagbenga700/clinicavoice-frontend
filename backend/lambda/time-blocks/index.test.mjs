import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handler } from './index.mjs';

// Mock AWS SDK
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn()
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: vi.fn()
    }))
  },
  QueryCommand: vi.fn(),
  PutCommand: vi.fn(),
  UpdateCommand: vi.fn(),
  GetCommand: vi.fn(),
  DeleteCommand: vi.fn()
}));

describe('Time Blocks Lambda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TIMEBLOCKS_TABLE = 'test-timeblocks-table';
    process.env.APPOINTMENTS_TABLE = 'test-appointments-table';
  });

  describe('Authorization', () => {
    it('should reject non-clinician users', async () => {
      const event = {
        httpMethod: 'GET',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123',
              'custom:user_type': 'patient'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {}
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body).error).toContain('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should validate required fields for time block creation', async () => {
      const event = {
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'clinician-123',
              'custom:user_type': 'clinician'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {},
        body: JSON.stringify({
          date: '2025-12-10'
          // Missing startTime, endTime, reason
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.errors).toContain('startTime is required');
      expect(body.errors).toContain('endTime is required');
      expect(body.errors).toContain('reason is required');
    });

    it('should validate date format', async () => {
      const event = {
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'clinician-123',
              'custom:user_type': 'clinician'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {},
        body: JSON.stringify({
          date: '12/10/2025', // Invalid format
          startTime: '09:00',
          endTime: '10:00',
          reason: 'Break'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errors).toContain('Invalid date format. Use YYYY-MM-DD');
    });

    it('should validate time format', async () => {
      const event = {
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'clinician-123',
              'custom:user_type': 'clinician'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {},
        body: JSON.stringify({
          date: '2025-12-10',
          startTime: '9am', // Invalid format
          endTime: '10:00',
          reason: 'Break'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errors).toContain('Invalid startTime format. Use HH:MM');
    });

    it('should validate endTime is after startTime', async () => {
      const event = {
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'clinician-123',
              'custom:user_type': 'clinician'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {},
        body: JSON.stringify({
          date: '2025-12-10',
          startTime: '10:00',
          endTime: '09:00', // Before startTime
          reason: 'Break'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errors).toContain('endTime must be after startTime');
    });

    it('should validate time block type', async () => {
      const event = {
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'clinician-123',
              'custom:user_type': 'clinician'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {},
        body: JSON.stringify({
          date: '2025-12-10',
          startTime: '09:00',
          endTime: '10:00',
          reason: 'Break',
          type: 'invalid-type'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errors).toContain('Invalid type. Must be: break, admin, meeting, or other');
    });

    it('should validate recurrence type', async () => {
      const event = {
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'clinician-123',
              'custom:user_type': 'clinician'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {},
        body: JSON.stringify({
          date: '2025-12-10',
          startTime: '09:00',
          endTime: '10:00',
          reason: 'Break',
          recurrence: {
            type: 'invalid'
          }
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errors).toContain('Invalid recurrence type. Must be: daily, weekly, or custom');
    });

    it('should validate recurrence daysOfWeek', async () => {
      const event = {
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'clinician-123',
              'custom:user_type': 'clinician'
            }
          }
        },
        pathParameters: {},
        queryStringParameters: {},
        body: JSON.stringify({
          date: '2025-12-10',
          startTime: '09:00',
          endTime: '10:00',
          reason: 'Break',
          recurrence: {
            type: 'weekly',
            daysOfWeek: [0, 7, 8] // Invalid days
          }
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errors).toContain('recurrence.daysOfWeek must contain numbers 0-6 (Sunday-Saturday)');
    });
  });
});
