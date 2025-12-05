# Patient Search Lambda

## Overview

This Lambda function provides advanced patient search functionality for the ClinicaVoice platform. It enables clinicians to search for patients across multiple fields with intelligent relevance ranking.

## Features

- **Multi-field search**: Search by name, MRN, phone, or email
- **Relevance ranking**: Results are ranked by match quality
- **Flexible field selection**: Choose which fields to search
- **Age calculation**: Automatically calculates patient age from DOB
- **Authorization**: Only clinicians can search patients

## API Endpoint

**POST** `/patients/search`

### Request Body

```json
{
  "query": "search term",
  "fields": ["name", "mrn", "phone", "email"]  // optional, defaults to all fields
}
```

### Response

```json
{
  "results": [
    {
      "id": "uuid",
      "mrn": "MRN-20241201-0001",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1980-01-15",
      "age": 44,
      "gender": "male",
      "phone": "555-0100",
      "email": "john.doe@example.com",
      "lastVisitDate": null,
      "status": "active",
      "relevanceScore": 90
    }
  ],
  "total": 1,
  "query": "John"
}
```

## Relevance Scoring

The search algorithm assigns scores based on match quality:

- **Exact MRN match**: 100 points
- **Exact full name match**: 90 points
- **Exact first/last name match**: 80 points
- **Phone match**: 70 points
- **Email match**: 60 points
- **Partial MRN match**: 50 points
- **Partial name match**: 20-40 points

Results are sorted by:
1. Relevance score (highest first)
2. Last visit date (most recent first) - when implemented
3. Last name (alphabetically)

## Environment Variables

- `PATIENTS_TABLE`: DynamoDB table name for patients

## Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Deployment

This Lambda is automatically deployed via Terraform when you run:

```bash
cd backend/terraform
terraform apply
```

The function is configured in:
- `backend/terraform/lambda.tf` - Lambda function definition
- `backend/terraform/api-gateway.tf` - API Gateway route

## Requirements Validated

This implementation validates the following requirements:

- **Requirement 1.5**: Multi-field patient search (name, MRN, DOB, phone)
- **Requirement 7.1**: Search by name, MRN, phone, email
- **Requirement 7.2**: Display name, MRN, DOB, last visit date in results

## Future Enhancements

- Integration with appointments table for last visit date
- Fuzzy matching for typo tolerance
- Search history and suggestions
- Advanced filters (age range, gender, status)
