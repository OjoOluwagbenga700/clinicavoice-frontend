# ClinicaVoice - AI-Powered Clinical Transcription Platform

An AI-powered clinical transcription and documentation platform for Canadian healthcare professionals. Built with React, Material-UI, and AWS services.

## 🚀 Quick Start

### Deploy to AWS Amplify (5 Minutes)

```bash
# 1. Commit and push
git add .
git commit -m "Deploy ClinicaVoice"
git push origin main

# 2. Go to AWS Amplify Console
# https://console.aws.amazon.com/amplify/

# 3. Follow the guide in docs/DEPLOY_NOW.md
```

### Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## ✨ Features

- **Authentication** - AWS Cognito with email confirmation
- **Role-Based Access Control** - Separate interfaces for clinicians and patients
- **Audio Transcription** - Record or upload audio, transcribe with AWS Transcribe
- **Template Builder** - Create and manage medical documentation templates
- **Reports Management** - View, search, and export clinical reports
- **Dashboard** - Statistics, activity charts, and recent notes
- **Internationalization** - English and French support
- **Responsive Design** - Works on mobile, tablet, and desktop

## 🏗️ Tech Stack

- **Frontend:** React 18, Vite, Material-UI 5
- **Authentication:** AWS Cognito
- **Storage:** AWS S3
- **Transcription:** AWS Transcribe
- **API:** AWS API Gateway (configured)
- **Deployment:** AWS Amplify Hosting

## 📚 Documentation

All documentation is in the `docs/` folder:

### Deployment
- **[DEPLOY_NOW.md](docs/DEPLOY_NOW.md)** - Quick 5-minute deployment guide ⭐
- **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- **[AMPLIFY_DEPLOYMENT_GUIDE.md](docs/AMPLIFY_DEPLOYMENT_GUIDE.md)** - Comprehensive guide

### Testing
- **[PRE_DEPLOYMENT_TEST.md](docs/PRE_DEPLOYMENT_TEST.md)** - Local testing guide
- **[MANUAL_TESTING_GUIDE.md](docs/MANUAL_TESTING_GUIDE.md)** - Manual testing procedures
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Testing overview

### Backend Integration
- **[BACKEND_INTEGRATION_STATUS.md](docs/BACKEND_INTEGRATION_STATUS.md)** - Backend status and roadmap
- **[DASHBOARD_BACKEND_INTEGRATION.md](docs/DASHBOARD_BACKEND_INTEGRATION.md)** - Dashboard API integration
- **[REPORTS_BACKEND_INTEGRATION.md](docs/REPORTS_BACKEND_INTEGRATION.md)** - Reports API integration
- **[TEMPLATE_BACKEND_INTEGRATION.md](docs/TEMPLATE_BACKEND_INTEGRATION.md)** - Templates API integration

### Implementation
- **[RBAC_QUICK_TEST_GUIDE.md](docs/RBAC_QUICK_TEST_GUIDE.md)** - Role-based access control testing
- **[SESSION_EXPIRATION_IMPLEMENTATION.md](docs/SESSION_EXPIRATION_IMPLEMENTATION.md)** - Session management

## 🔧 Configuration

### AWS Services

The app is configured to use:
- **Cognito User Pool:** `us-east-1_7fvXVi5oM`
- **API Gateway:** `https://r7le6kf535.execute-api.us-east-1.amazonaws.com`
- **S3 Bucket:** `terraform-20251121023049872500000001`
- **Region:** `us-east-1`

Configuration file: `src/aws/amplifyConfig.js`

### Mock API

Currently using mock API for:
- Dashboard statistics
- Reports data
- Templates data

To switch to real backend, set `USE_MOCK_API = false` in `src/services/api.js`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property-based tests
npm run test:properties

# Run with coverage
npm run test:coverage
```

## 📦 Project Structure

```
/
├── docs/                    # Documentation
├── src/
│   ├── api/                # Mock API
│   ├── aws/                # AWS configuration
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization
│   └── __tests__/          # Test files
├── amplify.yml             # Amplify build config
└── package.json
```

## 🚀 Deployment Status

- ✅ Frontend code ready
- ✅ AWS Cognito configured
- ✅ AWS S3 configured
- ✅ AWS Transcribe configured
- 🔄 Using mock API (backend to be added)
- 📦 Ready to deploy to Amplify

## 🔐 User Roles

### Clinician
- Full access to all features
- Create transcriptions
- Manage templates
- View all reports
- Dashboard with statistics

### Patient
- View own reports (read-only)
- Simplified dashboard
- Cannot create transcriptions
- Cannot manage templates

## 🌍 Internationalization

Supported languages:
- English (default)
- French

Switch languages using the language selector in the header.

## 📝 License

Private - ClinicaVoice Platform

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📞 Support

For deployment help, see:
- [Quick Deployment Guide](docs/DEPLOY_NOW.md)
- [Troubleshooting](docs/AMPLIFY_DEPLOYMENT_GUIDE.md#troubleshooting)
- [Backend Integration Status](docs/BACKEND_INTEGRATION_STATUS.md)

---

**Ready to deploy?** Check out [docs/DEPLOY_NOW.md](docs/DEPLOY_NOW.md) to get started! 🚀
