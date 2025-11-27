# Testing Infrastructure

This directory contains the testing infrastructure for the ClinicaVoice platform.

## Overview

The testing setup includes:
- **Vitest**: Fast unit test runner with React support
- **React Testing Library**: Component testing utilities
- **fast-check**: Property-based testing library
- **jsdom**: Browser environment simulation

## Directory Structure

```
src/__tests__/
├── setup.js                    # Global test setup and mocks
├── utils/
│   ├── testUtils.jsx          # Custom render functions and test helpers
│   └── propertyGenerators.js  # Property-based test generators
├── properties/
│   └── *.property.test.js     # Property-based tests
└── README.md                   # This file
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run only property-based tests
npm run test:properties
```

## Writing Unit Tests

Unit tests should be co-located with the components they test:

```javascript
// src/components/MyComponent.test.jsx
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../__tests__/utils/testUtils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Writing Property-Based Tests

Property-based tests should be placed in `src/__tests__/properties/`:

```javascript
// src/__tests__/properties/myFeature.property.test.js
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { userArbitrary } from '../utils/propertyGenerators';

describe('My Feature Properties', () => {
  it('should satisfy property X', () => {
    // Feature: clinica-voice-platform, Property X: Description
    fc.assert(
      fc.property(userArbitrary, (user) => {
        // Test that property holds for all generated users
        expect(user.email).toContain('@');
      }),
      { numRuns: 100 } // Run 100 iterations
    );
  });
});
```

## Test Utilities

### renderWithProviders

Custom render function that wraps components with necessary providers (Router, Theme, i18n):

```javascript
import { renderWithProviders } from '../__tests__/utils/testUtils';

renderWithProviders(<MyComponent />, {
  route: '/dashboard',
  theme: customTheme,
});
```

### Mock Data Creators

Helper functions to create mock data objects:

```javascript
import {
  createMockUser,
  createMockTranscription,
  createMockTemplate,
  createMockReport,
} from '../__tests__/utils/testUtils';

const user = createMockUser({ userType: 'patient' });
const transcription = createMockTranscription({ status: 'completed' });
```

### Property Generators

Pre-built generators for common data types:

```javascript
import {
  emailArbitrary,
  nameArbitrary,
  userTypeArbitrary,
  audioFileArbitrary,
  transcriptionArbitrary,
  templateArbitrary,
  reportArbitrary,
} from '../__tests__/utils/propertyGenerators';
```

## Mocked Services

The following services are automatically mocked in tests:

- **AWS Amplify Auth**: signUp, signIn, signOut, getCurrentUser
- **AWS Amplify Storage**: uploadData, getUrl, remove
- **AWS Amplify API**: get, post, put, del
- **MediaRecorder**: Browser audio recording API
- **navigator.mediaDevices**: Microphone access

## Property-Based Testing Guidelines

1. **Tag each property test** with a comment in this format:
   ```javascript
   // Feature: clinica-voice-platform, Property X: Description
   ```

2. **Run at least 100 iterations** for each property test:
   ```javascript
   fc.assert(fc.property(...), { numRuns: 100 });
   ```

3. **Use smart generators** that constrain to valid input space

4. **Test universal properties**, not specific examples

5. **Common property patterns**:
   - **Idempotence**: f(x) = f(f(x))
   - **Invariants**: Properties preserved after transformation
   - **Round-trip**: encode(decode(x)) = x
   - **Metamorphic**: Relationships between inputs/outputs
   - **Error conditions**: Invalid inputs properly rejected

## Coverage Goals

- Minimum 80% code coverage
- All correctness properties from design.md implemented as property tests
- Critical user workflows covered by integration tests
- Edge cases covered by unit tests

## Troubleshooting

### Tests fail with "Cannot find module"
- Ensure all dependencies are installed: `npm install`
- Check import paths are correct

### Tests timeout
- Increase timeout in vitest.config.mjs
- Check for infinite loops or unresolved promises

### Mock not working
- Verify mock is defined in setup.js
- Check mock is called before component import

### Property test fails
- Review the counterexample provided by fast-check
- Verify generator produces valid inputs
- Check if property is correctly specified
