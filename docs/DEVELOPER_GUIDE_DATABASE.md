# Database Schema Documentation

## Overview

The Patient Management and Appointments system uses Amazon DynamoDB for data storage. This document describes the table structures, indexes, and data models.

## Table of Contents

1. [DynamoDB Tables](#dynamodb-tables)
2. [Patients Table](#patients-table)
3. [Appointments Table](#appointments-table)
4. [TimeBlocks Table](#timeblocks-table)
5. [Data Models](#data-models)
6. [Indexes and Query Patterns](#indexes-and-query-patterns)
7. [Data Relationships](#data-relationships)

---

## DynamoDB Tables

### Overview

The system uses three main DynamoDB tables:

1. **Patients** - Stores patient demographic and account information
2. **Appointments** - Stores appointment scheduling data
3. **TimeBlocks** - Stores blocked time slots for clinicians

All tables use:
- Encryption at rest
- Point-in-time recovery
- On-demand billing mode
- TTL for temporary data (tokens)

---

## Patients Table

### Table Configuration

**Table Name**: `clinicavoice-patients-{environment}`

**Primary Key**:
- Partition Key: `id` (String) - Patient UUID
- Sort Key: `userId` (String) - Clinician ID

**Billing Mode**: On-Demand

**Encryption**: AWS managed keys

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Patient UUID (partition key) |
| userId | String | Yes | Clinician ID (sort key) |
| mrn | String | Yes | Medical Record Number (unique) |
| firstName | String | Yes | Patient first name |
| lastName | String | Yes | Patient last name |
| dateOfBirth | String | Yes | ISO date (YYYY-MM-DD) |
| gender | String | Yes | male, female, other, prefer-not-to-say |
| phone | String | Yes | Phone number |
| email | String | Yes | Email address |
| address | Map | No | Address object |
| preferredContactMethod | String | No | phone, email, sms |
| status | String | Yes | active, inactive |
| cognitoUserId | String | No | Linked Cognito user ID |
| accountStatus | String | Yes | pending, active, inactive |
| invitationToken | String | No | Hashed activation token |
| invitationSentAt | String | No | ISO timestamp |
| invitationExpiresAt | String | No | ISO timestamp |
| activatedAt | String | No | ISO timestamp |
| lastLoginAt | String | No | ISO timestamp |
| createdAt | String | Yes | ISO timestamp |
| updatedAt | String | Yes | ISO timestamp |
| createdBy | String | Yes | Clinician ID |
| updatedBy | String | Yes | Clinician ID |

### Address Object Structure

```json
{
  "street": "123 Main St",
  "city": "Toronto",
  "province": "ON",
  "postalCode": "M1A 1A1",
  "country": "Canada"
}
```

### Global Secondary Indexes (GSI)

#### GSI 1: MRN Index
**Index Name**: `mrn-index`
- Partition Key: `mrn` (String)
- Sort Key: `userId` (String)
- Projection: ALL
- **Use Case**: Lookup patient by MRN

#### GSI 2: Status Index
**Index Name**: `status-index`
- Partition Key: `userId` (String)
- Sort Key: `status` (String)
- Projection: ALL
- **Use Case**: Filter patients by status (active/inactive)

#### GSI 3: Last Name Index
**Index Name**: `lastName-index`
- Partition Key: `userId` (String)
- Sort Key: `lastName` (String)
- Projection: ALL
- **Use Case**: Sort and search patients by last name

### TTL Configuration

**TTL Attribute**: `invitationExpiresAt`
- Automatically deletes expired invitation tokens
- Tokens expire 7 days after creation

### Example Item

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "clinician-123",
  "mrn": "MRN-12345",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-01-15",
  "gender": "male",
  "phone": "+14165551234",
  "email": "john.doe@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Toronto",
    "province": "ON",
    "postalCode": "M1A 1A1",
    "country": "Canada"
  },
  "preferredContactMethod": "email",
  "status": "active",
  "cognitoUserId": "cognito-user-id-123",
  "accountStatus": "active",
  "invitationToken": null,
  "invitationSentAt": "2025-01-15T09:05:00Z",
  "invitationExpiresAt": null,
  "activatedAt": "2025-01-16T10:30:00Z",
  "lastLoginAt": "2025-12-05T10:30:00Z",
  "createdAt": "2025-01-15T09:00:00Z",
  "updatedAt": "2025-12-01T14:20:00Z",
  "createdBy": "clinician-123",
  "updatedBy": "clinician-123"
}
```

---

## Appointments Table

### Table Configuration

**Table Name**: `clinicavoice-appointments-{environment}`

**Primary Key**:
- Partition Key: `id` (String) - Appointment UUID
- Sort Key: `userId` (String) - Clinician ID

**Billing Mode**: On-Demand

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | Appointment UUID (partition key) |
| userId | String | Yes | Clinician ID (sort key) |
| patientId | String | Yes | Patient UUID |
| date | String | Yes | ISO date (YYYY-MM-DD) |
| time | String | Yes | Time (HH:MM) |
| duration | Number | Yes | Duration in minutes |
| type | String | Yes | consultation, follow-up, procedure, urgent |
| status | String | Yes | scheduled, confirmed, completed, cancelled, no-show |
| statusHistory | List | Yes | Array of status change objects |
| notes | String | No | Appointment notes |
| notesHistory | List | No | Array of notes change objects |
| transcriptionId | String | No | Linked transcription UUID |
| cancellationReason | String | No | Reason for cancellation |
| cancelledAt | String | No | ISO timestamp |
| cancelledBy | String | No | User ID who cancelled |
| createdAt | String | Yes | ISO timestamp |
| updatedAt | String | Yes | ISO timestamp |
| createdBy | String | Yes | Clinician ID |
| updatedBy | String | Yes | Clinician ID |

### Status History Object Structure

```json
{
  "status": "completed",
  "timestamp": "2025-12-10T14:30:00Z",
  "changedBy": "clinician-123",
  "reason": "Patient completed visit"
}
```

### Global Secondary Indexes (GSI)

#### GSI 1: Patient Index
**Index Name**: `patient-index`
- Partition Key: `patientId` (String)
- Sort Key: `date` (String)
- Projection: ALL
- **Use Case**: Get all appointments for a patient, sorted by date

#### GSI 2: Date Index
**Index Name**: `date-index`
- Partition Key: `userId` (String)
- Sort Key: `date` (String)
- Projection: ALL
- **Use Case**: Get appointments for a clinician by date range

#### GSI 3: Status Index
**Index Name**: `status-index`
- Partition Key: `userId` (String)
- Sort Key: `status` (String)
- Projection: ALL
- **Use Case**: Filter appointments by status

### Example Item

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "clinician-123",
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-12-10",
  "time": "14:00",
  "duration": 30,
  "type": "follow-up",
  "status": "completed",
  "statusHistory": [
    {
      "status": "scheduled",
      "timestamp": "2025-12-01T10:00:00Z",
      "changedBy": "clinician-123"
    },
    {
      "status": "completed",
      "timestamp": "2025-12-10T14:30:00Z",
      "changedBy": "clinician-123",
      "reason": "Patient completed visit"
    }
  ],
  "notes": "Follow-up on blood pressure medication",
  "transcriptionId": "transcription-uuid-123",
  "createdAt": "2025-12-01T10:00:00Z",
  "updatedAt": "2025-12-10T14:30:00Z",
  "createdBy": "clinician-123",
  "updatedBy": "clinician-123"
}
```

---

## TimeBlocks Table

### Table Configuration

**Table Name**: `clinicavoice-timeblocks-{environment}`

**Primary Key**:
- Partition Key: `id` (String) - TimeBlock UUID
- Sort Key: `userId` (String) - Clinician ID

**Billing Mode**: On-Demand

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | TimeBlock UUID (partition key) |
| userId | String | Yes | Clinician ID (sort key) |
| date | String | Yes | ISO date (YYYY-MM-DD) |
| startTime | String | Yes | Time (HH:MM) |
| endTime | String | Yes | Time (HH:MM) |
| recurrence | Map | No | Recurrence configuration |
| reason | String | Yes | Reason for blocking time |
| type | String | Yes | break, admin, meeting, other |
| createdAt | String | Yes | ISO timestamp |
| createdBy | String | Yes | Clinician ID |

### Recurrence Object Structure

```json
{
  "type": "weekly",
  "endDate": "2025-12-31",
  "daysOfWeek": [1, 3, 5]
}
```

### Global Secondary Index

#### GSI 1: Date Index
**Index Name**: `date-index`
- Partition Key: `userId` (String)
- Sort Key: `date` (String)
- Projection: ALL
- **Use Case**: Get time blocks for a clinician by date

### Example Item

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "userId": "clinician-123",
  "date": "2025-12-10",
  "startTime": "12:00",
  "endTime": "13:00",
  "recurrence": {
    "type": "daily",
    "endDate": "2025-12-31"
  },
  "reason": "Lunch break",
  "type": "break",
  "createdAt": "2025-12-01T09:00:00Z",
  "createdBy": "clinician-123"
}
```

---

## Data Models

### Patient Model (TypeScript)

```typescript
interface Patient {
  id: string;
  userId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  phone: string;
  email: string;
  address?: Address;
  preferredContactMethod?: 'phone' | 'email' | 'sms';
  status: 'active' | 'inactive';
  cognitoUserId?: string;
  accountStatus: 'pending' | 'active' | 'inactive';
  invitationToken?: string;
  invitationSentAt?: string;
  invitationExpiresAt?: string;
  activatedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}
```

### Appointment Model (TypeScript)

```typescript
interface Appointment {
  id: string;
  userId: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'follow-up' | 'procedure' | 'urgent';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  statusHistory: StatusChange[];
  notes?: string;
  notesHistory?: NotesChange[];
  transcriptionId?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface StatusChange {
  status: string;
  timestamp: string;
  changedBy: string;
  reason?: string;
}

interface NotesChange {
  notes: string;
  timestamp: string;
  changedBy: string;
}
```

### TimeBlock Model (TypeScript)

```typescript
interface TimeBlock {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrence?: Recurrence;
  reason: string;
  type: 'break' | 'admin' | 'meeting' | 'other';
  createdAt: string;
  createdBy: string;
}

interface Recurrence {
  type: 'daily' | 'weekly' | 'custom';
  endDate?: string;
  daysOfWeek?: number[];
}
```

---

## Indexes and Query Patterns

### Common Query Patterns

#### 1. Get Patient by ID
```
Table: Patients
Key: id = patient-uuid AND userId = clinician-id
```

#### 2. Get Patient by MRN
```
Index: mrn-index
Key: mrn = "MRN-12345"
```

#### 3. List Active Patients for Clinician
```
Index: status-index
Key: userId = clinician-id AND status = "active"
```

#### 4. Search Patients by Last Name
```
Index: lastName-index
Key: userId = clinician-id
Filter: lastName begins_with "Doe"
```

#### 5. Get Appointments for Date Range
```
Index: date-index
Key: userId = clinician-id AND date BETWEEN "2025-12-01" AND "2025-12-31"
```

#### 6. Get Patient's Appointments
```
Index: patient-index
Key: patientId = patient-uuid
Sort: date (ascending)
```

#### 7. Get Appointments by Status
```
Index: status-index
Key: userId = clinician-id AND status = "scheduled"
```

#### 8. Get Time Blocks for Date
```
Index: date-index (TimeBlocks)
Key: userId = clinician-id AND date = "2025-12-10"
```

### Query Performance

**Best Practices**:
- Use partition key + sort key for single-item lookups
- Use GSIs for filtered queries
- Implement pagination for large result sets
- Use batch operations for multiple items
- Cache frequently accessed data

**Avoid**:
- Scanning entire tables
- Querying without partition key
- Over-fetching data
- Excessive GSI usage

---

## Data Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│   Patient   │
│  (Patients) │
└──────┬──────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐       ┌──────────────┐
│ Appointment │──────▶│Transcription │
│(Appointments)│  0:1  │  (Reports)   │
└──────┬──────┘       └──────────────┘
       │
       │ N:1
       │
       ▼
┌─────────────┐
│  Clinician  │
│  (Cognito)  │
└─────────────┘

┌─────────────┐
│  TimeBlock  │
│(TimeBlocks) │
└──────┬──────┘
       │
       │ N:1
       │
       ▼
┌─────────────┐
│  Clinician  │
│  (Cognito)  │
└─────────────┘
```

### Relationship Details

**Patient → Clinician**
- Many-to-one relationship
- Each patient belongs to one clinician
- Clinician can have many patients
- Enforced by userId in Patients table

**Patient → Appointment**
- One-to-many relationship
- Each patient can have multiple appointments
- Each appointment belongs to one patient
- Linked by patientId in Appointments table

**Appointment → Transcription**
- One-to-one relationship (optional)
- Each appointment can have one transcription
- Linked by transcriptionId in Appointments table

**Clinician → TimeBlock**
- One-to-many relationship
- Each clinician can have multiple time blocks
- Each time block belongs to one clinician
- Enforced by userId in TimeBlocks table

### Data Integrity

**Referential Integrity**:
- Patient ID must exist before creating appointment
- Clinician ID validated through Cognito
- Soft deletes preserve relationships
- Orphaned records prevented through validation

**Consistency**:
- Status history maintains audit trail
- Timestamps track all changes
- Created/updated by fields track ownership
- Optimistic locking prevents conflicts

---

## Backup and Recovery

### Backup Strategy

**Point-in-Time Recovery**:
- Enabled on all tables
- 35-day retention period
- Restore to any point in time

**On-Demand Backups**:
- Manual backups before major changes
- Retained indefinitely
- Restore to new table

### Disaster Recovery

**RTO (Recovery Time Objective)**: 1 hour
**RPO (Recovery Point Objective)**: 5 minutes

**Recovery Procedures**:
1. Identify affected tables
2. Determine recovery point
3. Restore from point-in-time backup
4. Validate data integrity
5. Update application configuration
6. Resume operations

---

## Monitoring and Maintenance

### CloudWatch Metrics

**Key Metrics**:
- Read/Write capacity units
- Throttled requests
- System errors
- User errors
- Latency (GetItem, PutItem, Query, Scan)

**Alarms**:
- High error rate
- Throttling events
- Latency spikes
- Capacity exceeded

### Maintenance Tasks

**Regular Tasks**:
- Review access patterns
- Optimize indexes
- Clean up expired tokens (automatic via TTL)
- Monitor costs
- Review security policies

**Periodic Tasks**:
- Backup verification
- Disaster recovery testing
- Performance tuning
- Capacity planning

---

## Security

### Encryption

**At Rest**:
- AWS managed keys (default)
- All tables encrypted
- Automatic key rotation

**In Transit**:
- TLS 1.2+ required
- HTTPS only
- Certificate validation

### Access Control

**IAM Policies**:
- Least privilege principle
- Role-based access
- Lambda execution roles
- Service-to-service authentication

**Data Isolation**:
- Clinician data separation via userId
- Patient data access control
- Role-based filtering
- Audit logging

### Compliance

**HIPAA**:
- Encryption at rest and in transit
- Audit logging enabled
- Access controls enforced
- Data retention policies
- Backup and recovery procedures

---

## Migration Guide

### Initial Setup

1. **Create Tables**:
   ```bash
   terraform apply
   ```

2. **Verify Tables**:
   ```bash
   aws dynamodb list-tables
   ```

3. **Test Indexes**:
   - Query each GSI
   - Verify projections
   - Check performance

### Data Migration

**From Existing System**:
1. Export data from source
2. Transform to DynamoDB format
3. Validate data integrity
4. Batch import using AWS SDK
5. Verify imported data
6. Update application configuration

**Rollback Plan**:
1. Keep source system active
2. Parallel run period
3. Validate data consistency
4. Switch traffic gradually
5. Monitor for issues

---

## Troubleshooting

### Common Issues

**Throttling**:
- Increase provisioned capacity (if using provisioned mode)
- Implement exponential backoff
- Use batch operations
- Optimize query patterns

**Hot Partitions**:
- Review partition key design
- Distribute load evenly
- Use composite keys
- Consider sharding

**High Latency**:
- Check network connectivity
- Review query complexity
- Optimize indexes
- Use caching

**Data Inconsistency**:
- Verify write operations
- Check error handling
- Review transaction logic
- Validate data on read

---

## Best Practices

### Design Principles

✅ **Do**:
- Use composite keys for access patterns
- Create GSIs for common queries
- Implement pagination
- Use batch operations
- Cache frequently accessed data
- Monitor performance metrics

❌ **Don't**:
- Scan tables unnecessarily
- Over-provision capacity
- Create too many GSIs
- Store large items (>400KB)
- Use sequential IDs as partition keys

### Performance Optimization

- Use eventually consistent reads when possible
- Implement client-side caching
- Batch read/write operations
- Use projection expressions
- Optimize item size
- Monitor and tune regularly

---

## Support

For database support:
- Review CloudWatch metrics
- Check error logs
- Consult this documentation
- Contact DevOps team
- Submit support tickets
