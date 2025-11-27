# Backend Integration Status & Next Steps

## Overview
This document provides a comprehensive status of backend integration for the ClinicaVoice platform and outlines the steps needed to complete the integration with real AWS services.

---

## ✅ Already Integrated (Using Mock API)

### 1. Dashboard Statistics
**Status:** ✅ Integrated with mock API  
**Files:** `src/services/api.js`, `src/pages/dashboard/Overview.jsx`  
**Functions:**
- `fetchDashboardStats()` - Clinician statistics
- `fetchActivityChart()` - Activity chart data
- `fetchRecentNotes()` - Recent transcriptions
- `fetchPatientDashboardStats()` - Patient statistics
- `fetchPatientRecentReports()` - Patient reports

**What's Working:**
- Dashboard loads data from API service
- Loading states implemented
- Error handling in place
- Role-based data fetching

**To Complete:**
- Switch `USE_MOCK_API = false` in `src/services/api.js`
- Implement backend Lambda functions for these endpoints
- Deploy API Gateway endpoints

### 2. Reports Management
**Status:** ✅ Integrated with mock API  
**Files:** `src/services/api.js`, `src/pages/dashboard/Reports.jsx`  
**Functions:**
- `fetchReports()` - Get all reports
- `fetchReportById()` - Get specific report

**What's Working:**
- Reports load from API
- Search and filtering work
- Loading states implemented
- Role-based access control

**To Complete:**
- Implement backend Lambda functions
- Set up DynamoDB table for reports
- Deploy API Gateway endpoints

### 3. Template Management
**Status:** ✅ Integrated with mock API  
**Files:** `src/pages/dashboard/TemplateBuilder.jsx`  
**Functions:**
- Load templates: `apiGet('/templates')`
- Create template: `apiPost('/templates', data)`
- Update template: `apiPut('/templates/:id', data)`
- Delete template: `apiDelete('/templates/:id')`

**What's Working:**
- Full CRUD operations
- Loading states
- Error handling
- Auto-save functionality

**To Complete:**
- Implement backend Lambda functions
- Set up DynamoDB table for templates
- Deploy API Gateway endpoints

---

## 🔄 Partially Integrated

### 4. Transcription Service
**Status:** 🔄 Partially integrated  
**Files:** `src/pages/dashboard/Transcribe.jsx`  
**Current Implementation:**
- ✅ Audio recording with MediaRecorder API
- ✅ File upload to S3 via AWS Amplify Storage
- ✅ Transcription via AWS Transcribe (through API Gateway)
- ✅ File validation (format, size)
- ✅ Error handling

**What's Working:**
- Recording audio in browser
- Uploading to S3
- Calling transcription API
- Displaying transcripts

**To Complete:**
- Verify Lambda function for transcription is deployed
- Test with real AWS Transcribe service
- Implement transcript saving to database
- Add transcription history

---

## ❌ Not Yet Integrated

### 5. Authentication
**Status:** ✅ Fully integrated with AWS Cognito  
**Files:** `src/pages/Login.jsx`, `src/pages/Register.jsx`, `src/utils/auth.js`  
**What's Working:**
- User registration with Cognito
- Email confirmation
- Login/logout
- Session management
- Role-based access control (custom:user_type attribute)

**No Action Needed** - Already using real AWS Cognito

---

## 🎯 Backend Implementation Checklist

### Phase 1: Set Up Infrastructure (If Not Done)

- [ ] **DynamoDB Tables**
  - [ ] `clinicavoice-reports` table
  - [ ] `clinicavoice-templates` table
  - [ ] `clinicavoice-transcriptions` table
  - [ ] Configure indexes for efficient queries

- [ ] **Lambda Functions**
  - [ ] Dashboard statistics function
  - [ ] Reports CRUD functions
  - [ ] Templates CRUD functions
  - [ ] Transcription processing function

- [ ] **API Gateway**
  - [ ] Configure REST API endpoints
  - [ ] Set up CORS
  - [ ] Configure Cognito authorizer
  - [ ] Deploy to production stage

- [ ] **IAM Roles & Permissions**
  - [ ] Lambda execution roles
  - [ ] S3 access permissions
  - [ ] DynamoDB access permissions
  - [ ] Transcribe service permissions

### Phase 2: Implement Backend Endpoints

#### Dashboard Endpoints

```
GET /dashboard/stats
GET /dashboard/activity
GET /dashboard/recent-notes
GET /dashboard/patient/stats
GET /dashboard/patient/recent-reports
```

**Lambda Function Example:**
```javascript
// dashboard-stats-handler.js
export const handler = async (event) => {
  const userId = event.requestContext.authorizer.claims.sub;
  const userType = event.requestContext.authorizer.claims['custom:user_type'];
  
  // Query DynamoDB for user's statistics
  const stats = await getStatsFromDB(userId, userType);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stats)
  };
};
```

#### Reports Endpoints

```
GET /reports
GET /reports/:id
POST /reports
PUT /reports/:id
DELETE /reports/:id
```

**DynamoDB Schema:**
```javascript
{
  id: 'report-uuid',
  userId: 'cognito-user-id',
  patientId: 'patient-id',
  patientName: 'John Doe',
  date: '2025-11-27',
  summary: 'General checkup notes',
  content: 'Full report content...',
  status: 'reviewed',
  createdAt: '2025-11-27T10:00:00Z',
  updatedAt: '2025-11-27T10:00:00Z'
}
```

#### Templates Endpoints

```
GET /templates
GET /templates/:id
POST /templates
PUT /templates/:id
DELETE /templates/:id
```

**DynamoDB Schema:**
```javascript
{
  id: 'template-uuid',
  userId: 'cognito-user-id',
  name: 'SOAP Note',
  content: '<p>Template content with {{placeholders}}</p>',
  placeholders: ['PatientName', 'Date', 'Diagnosis'],
  category: 'SOAP',
  isShared: false,
  createdAt: '2025-11-27T10:00:00Z',
  updatedAt: '2025-11-27T10:00:00Z'
}
```

#### Transcription Endpoints

```
POST /transcribe
GET /transcriptions
GET /transcriptions/:id
PUT /transcriptions/:id
```

**Lambda Function for Transcription:**
```javascript
// transcribe-handler.js
import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';

export const handler = async (event) => {
  const { fileKey, fileName } = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.claims.sub;
  
  const transcribeClient = new TranscribeClient({ region: 'us-east-1' });
  
  const params = {
    TranscriptionJobName: `transcription-${Date.now()}`,
    LanguageCode: 'en-US',
    MediaFormat: 'webm',
    Media: {
      MediaFileUri: `s3://your-bucket/${fileKey}`
    },
    OutputBucketName: 'your-output-bucket'
  };
  
  const command = new StartTranscriptionJobCommand(params);
  const response = await transcribeClient.send(command);
  
  // Save transcription job info to DynamoDB
  await saveTranscriptionJob(userId, response.TranscriptionJob);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ jobName: response.TranscriptionJob.TranscriptionJobName })
  };
};
```

### Phase 3: Update Frontend Configuration

#### Step 1: Switch from Mock to Real API

In `src/services/api.js`, change:
```javascript
const USE_MOCK_API = false; // Change from true to false
```

#### Step 2: Verify API Gateway Endpoint

In `src/aws/amplifyConfig.js`, ensure:
```javascript
API: {
  endpoints: [
    {
      name: "ClinicaVoiceAPI",
      endpoint: "https://r7le6kf535.execute-api.us-east-1.amazonaws.com",
      region: "us-east-1",
    },
  ],
}
```

#### Step 3: Test Each Endpoint

Create a test script to verify all endpoints:
```javascript
// test-api-endpoints.js
import { 
  fetchDashboardStats, 
  fetchReports, 
  fetchActivityChart 
} from './src/services/api.js';

async function testEndpoints() {
  try {
    console.log('Testing dashboard stats...');
    const stats = await fetchDashboardStats();
    console.log('✅ Dashboard stats:', stats);
    
    console.log('Testing reports...');
    const reports = await fetchReports();
    console.log('✅ Reports:', reports);
    
    console.log('Testing activity chart...');
    const activity = await fetchActivityChart();
    console.log('✅ Activity:', activity);
    
    console.log('All tests passed! ✅');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEndpoints();
```

### Phase 4: Deploy Backend with Terraform/CDK

If you're using Terraform (based on your S3 bucket name), here's a sample configuration:

```hcl
# terraform/main.tf

# DynamoDB Tables
resource "aws_dynamodb_table" "reports" {
  name           = "clinicavoice-reports"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Environment = "production"
    Application = "ClinicaVoice"
  }
}

resource "aws_dynamodb_table" "templates" {
  name           = "clinicavoice-templates"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Environment = "production"
    Application = "ClinicaVoice"
  }
}

# Lambda Functions
resource "aws_lambda_function" "dashboard_stats" {
  filename      = "lambda/dashboard-stats.zip"
  function_name = "clinicavoice-dashboard-stats"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"

  environment {
    variables = {
      REPORTS_TABLE = aws_dynamodb_table.reports.name
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "clinicavoice" {
  name        = "ClinicaVoiceAPI"
  description = "API for ClinicaVoice Platform"
}

# ... more resources
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (Already Done)
- ✅ API service functions tested
- ✅ Component integration tests
- ✅ CSV export tests

### 2. Integration Tests (To Do)
- [ ] Test with real AWS services
- [ ] End-to-end user workflows
- [ ] Load testing
- [ ] Security testing

### 3. Manual Testing Checklist
- [ ] Register new user
- [ ] Login with credentials
- [ ] View dashboard (clinician)
- [ ] View dashboard (patient)
- [ ] Create transcription
- [ ] Upload audio file
- [ ] View transcription results
- [ ] Create template
- [ ] Edit template
- [ ] Delete template
- [ ] View reports
- [ ] Search reports
- [ ] Export CSV
- [ ] Test role-based access
- [ ] Test session expiration
- [ ] Test on mobile devices

---

## 📊 Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                        │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Login/     │  │  Dashboard   │  │  Transcribe  │ │
│  │   Register   │  │   Overview   │  │    Page      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                   ┌────────▼────────┐                   │
│                   │  API Service    │                   │
│                   │  (api.js)       │                   │
│                   └────────┬────────┘                   │
└────────────────────────────┼──────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  AWS Amplify    │
                    │  Configuration  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   Cognito      │  │  API Gateway    │  │      S3        │
│  (Auth)        │  │  (REST API)     │  │  (Storage)     │
│                │  │                 │  │                │
│ ✅ LIVE        │  │ 🔄 PARTIAL     │  │ ✅ LIVE        │
└────────────────┘  └────────┬────────┘  └────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Lambda         │
                    │  Functions      │
                    │                 │
                    │ ❌ TO DEPLOY   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   DynamoDB     │  │  Transcribe     │  │  CloudWatch    │
│  (Database)    │  │  (AI Service)   │  │  (Monitoring)  │
│                │  │                 │  │                │
│ ❌ TO CREATE  │  │ ✅ CONFIGURED  │  │ ❌ TO SETUP   │
└────────────────┘  └─────────────────┘  └────────────────┘
```

---

## 🚀 Quick Start: Deploy Backend

### Option 1: Using AWS SAM (Recommended)

1. **Install AWS SAM CLI:**
```bash
brew install aws-sam-cli  # macOS
```

2. **Create SAM template** (`template.yaml`):
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # DynamoDB Tables
  ReportsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: clinicavoice-reports
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: userId
          KeyType: RANGE

  # Lambda Functions
  DashboardStatsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda/dashboard-stats/
      Handler: index.handler
      Runtime: nodejs18.x
      Environment:
        Variables:
          REPORTS_TABLE: !Ref ReportsTable
      Events:
        GetStats:
          Type: Api
          Properties:
            Path: /dashboard/stats
            Method: get
            Auth:
              Authorizer: CognitoAuthorizer
```

3. **Deploy:**
```bash
sam build
sam deploy --guided
```

### Option 2: Using Terraform (If Already Set Up)

1. **Add backend resources to your Terraform config**
2. **Run:**
```bash
terraform plan
terraform apply
```

### Option 3: Manual AWS Console Setup

1. Create DynamoDB tables
2. Create Lambda functions
3. Configure API Gateway
4. Set up IAM roles
5. Test endpoints

---

## 📝 Next Immediate Steps

1. **Choose deployment method** (SAM, Terraform, or Manual)
2. **Create DynamoDB tables** for reports and templates
3. **Deploy Lambda functions** for each endpoint
4. **Configure API Gateway** with Cognito authorizer
5. **Test endpoints** with Postman or curl
6. **Switch frontend** to use real API (`USE_MOCK_API = false`)
7. **Test end-to-end** workflows
8. **Deploy frontend** to Amplify Hosting

---

## 💡 Tips for Success

- **Start small**: Deploy one endpoint at a time
- **Test thoroughly**: Use Postman to test each endpoint before frontend integration
- **Monitor logs**: Use CloudWatch to debug Lambda functions
- **Use environment variables**: Don't hardcode table names or endpoints
- **Implement proper error handling**: Return meaningful error messages
- **Set up CORS**: Ensure API Gateway allows requests from your frontend domain
- **Use Cognito authorizer**: Protect all endpoints with authentication
- **Implement rate limiting**: Prevent abuse of your API
- **Set up monitoring**: Use CloudWatch alarms for errors and performance

---

## 🆘 Need Help?

If you need assistance with any of these steps, I can help you:
1. Write Lambda function code
2. Create Terraform/SAM templates
3. Set up API Gateway configuration
4. Debug integration issues
5. Write integration tests

Just let me know which part you'd like to tackle first!
