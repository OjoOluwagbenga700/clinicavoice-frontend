import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBDocumentClient);

// Import handler after mocking
const { handler } = await import('./index.mjs');

describe('Patient Search Lambda', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.PATIENTS_TABLE = 'test-patients-table';
  });

  const createMockEvent = (body, userType = 'clinician') => ({
    httpMethod: 'POST',
    body: JSON.stringify(body),
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123',
          'custom:user_type': userType
        }
      }
    }
  });

  const mockPatients = [
    {
      id: '1',
      userId: 'test-user-123',
      mrn: 'MRN-20241201-0001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-15',
      gender: 'male',
      phone: '555-0100',
      email: 'john.doe@example.com',
      status: 'active'
    },
    {
      id: '2',
      userId: 'test-user-123',
      mrn: 'MRN-20241201-0002',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1990-05-20',
      gender: 'female',
      phone: '555-0200',
      email: 'jane.smith@example.com',
      status: 'active'
    },
    {
      id: '3',
      userId: 'test-user-123',
      mrn: 'MRN-20241201-0003',
      firstName: 'Bob',
      lastName: 'Johnson',
      dateOfBirth: '1975-12-10',
      gender: 'male',
      phone: '555-0300',
      email: 'bob.johnson@example.com',
      status: 'active'
    }
  ];

  it('should return 403 for non-clinician users', async () => {
    const event = createMockEvent({ query: 'John' }, 'patient');
    const response = await handler(event);
    
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Unauthorized');
  });

  it('should return 400 when query is missing', async () => {
    const event = createMockEvent({});
    const response = await handler(event);
    
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Query parameter is required');
  });

  it('should return 400 when query is empty', async () => {
    const event = createMockEvent({ query: '' });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Query parameter is required');
  });

  it('should search by first name', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'John', fields: ['name'] });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // "john" matches both "John Doe" and "Bob Johnson" (last name contains "john")
    expect(body.results.length).toBeGreaterThanOrEqual(1);
    // The first result should be John Doe (exact first name match has higher score)
    expect(body.results[0].firstName).toBe('John');
    expect(body.results[0].lastName).toBe('Doe');
  });

  it('should search by last name', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'Smith', fields: ['name'] });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].firstName).toBe('Jane');
    expect(body.results[0].lastName).toBe('Smith');
  });

  it('should search by MRN', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'MRN-20241201-0002', fields: ['mrn'] });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].mrn).toBe('MRN-20241201-0002');
  });

  it('should search by phone', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: '555-0200', fields: ['phone'] });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].phone).toBe('555-0200');
  });

  it('should search by email', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'jane.smith', fields: ['email'] });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].email).toBe('jane.smith@example.com');
  });

  it('should search across multiple fields by default', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'john' });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // Should match both "John Doe" (name) and "bob.johnson@example.com" (email)
    expect(body.results.length).toBeGreaterThanOrEqual(1);
  });

  it('should rank results by relevance', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'john' });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    
    // Exact first name match should rank higher than email partial match
    if (body.results.length > 1) {
      expect(body.results[0].firstName).toBe('John');
    }
  });

  it('should return empty results when no matches found', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'NonExistentName' });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.results).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('should calculate age correctly', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'John' });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.results[0].age).toBeDefined();
    expect(typeof body.results[0].age).toBe('number');
    expect(body.results[0].age).toBeGreaterThan(0);
  });

  it('should include required fields in results', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: mockPatients
    });

    const event = createMockEvent({ query: 'John' });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    
    const result = body.results[0];
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('mrn');
    expect(result).toHaveProperty('firstName');
    expect(result).toHaveProperty('lastName');
    expect(result).toHaveProperty('dateOfBirth');
    expect(result).toHaveProperty('age');
    expect(result).toHaveProperty('gender');
    expect(result).toHaveProperty('phone');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('status');
  });

  it('should handle DynamoDB errors gracefully', async () => {
    ddbMock.on(QueryCommand).rejects(new Error('DynamoDB error'));

    const event = createMockEvent({ query: 'John' });
    const response = await handler(event);
    
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Internal server error');
  });
});
