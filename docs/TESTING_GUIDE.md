# ClinicaVoice Testing Guide

## Overview

This document provides comprehensive guidance on testing the ClinicaVoice platform. The testing infrastructure supports both unit testing and property-based testing to ensure code correctness and reliability.

## Testing Stack

- **Vitest**: Fast, Vite-native test runner
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation
- **fast-check**: Property-based testing library
- **jsdom**: Browser environment simulation

## Quick Start

### Installation

All testing dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run only property-based tests
npm run test:properties
```

## Project Structure

```
ClinicaVoice-Frontend/
├── src/
│   ├── __tests__/
│   │   ├── setup.js                    # Global test configuration
│   │   ├── utils/
│   │   │   ├── testUtils.jsx          # Custom render & helpers
│   │   │   └── propertyGenerators.js  # PBT generators
│   │   ├── properties/
│   │   │   └── *.property.test.js     # Property-based tests
│   │   └── README.md                   # Testing documentation
│   ├── components/
│   │   ├── Header.jsx
│   │   └── Header.test.jsx            # Co-located unit tests
│   └── pages/
│       ├── Login.jsx
│       └── Login.test.jsx             # Co-located unit tests
├── vitest.config.mjs                   # Vitest configuration
└── TESTING_GUIDE.md                    # This file
```

## Writing Unit Tests

### Basic Component Test

```javascript
// src/components/MyComponent.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '../__tests__/utils/testUtils';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render with correct text', () => {
    renderWithProviders(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle button click', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithProviders(<MyComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with Routing

```javascript
import { renderWithProviders } from '../__tests__/utils/testUtils';

renderWithProviders(<MyComponent />, {
  route: '/dashboard/transcribe',
});
```

### Testing Async Operations

```javascript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  renderWithProviders(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

## Writing Property-Based Tests

### Basic Property Test

```javascript
// src/__tests__/properties/authentication.property.test.js
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { emailArbitrary, passwordArbitrary } from '../utils/propertyGenerators';

describe('Authentication Properties', () => {
  it('should validate email format', () => {
    // Feature: clinica-voice-platform, Property 1: Email validation
    fc.assert(
      fc.property(emailArbitrary, (email) => {
        // Property: All valid emails contain @ symbol
        expect(email).toContain('@');
        expect(email.split('@')).toHaveLength(2);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Property Test with Multiple Inputs

```javascript
it('should handle user registration', () => {
  // Feature: clinica-voice-platform, Property 2: User registration
  fc.assert(
    fc.property(
      emailArbitrary,
      nameArbitrary,
      passwordArbitrary,
      userTypeArbitrary,
      (email, name, password, userType) => {
        // Test property holds for all combinations
        const user = createUser(email, name, password, userType);
        expect(user.email).toBe(email);
        expect(user.userType).toBe(userType);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Common Property Patterns

#### 1. Idempotence
```javascript
// Applying operation twice = applying once
fc.assert(
  fc.property(fc.string(), (str) => {
    expect(str.trim()).toBe(str.trim().trim());
  })
);
```

#### 2. Invariants
```javascript
// Property preserved after transformation
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const doubled = arr.map(x => x * 2);
    expect(doubled.length).toBe(arr.length);
  })
);
```

#### 3. Round-trip
```javascript
// encode(decode(x)) = x
fc.assert(
  fc.property(templateArbitrary, (template) => {
    const serialized = JSON.stringify(template);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(template);
  })
);
```

#### 4. Metamorphic
```javascript
// Relationship between operations
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const filtered = arr.filter(x => x > 0);
    expect(filtered.length).toBeLessThanOrEqual(arr.length);
  })
);
```

## Test Utilities

### Custom Render Function

`renderWithProviders` wraps components with necessary providers:

```javascript
import { renderWithProviders } from '../__tests__/utils/testUtils';

const { container, rerender } = renderWithProviders(
  <MyComponent />,
  {
    route: '/dashboard',
    theme: customTheme,
  }
);
```

### Mock Data Creators

```javascript
import {
  createMockUser,
  createMockTranscription,
  createMockTemplate,
  createMockReport,
} from '../__tests__/utils/testUtils';

// Create mock with defaults
const user = createMockUser();

// Create mock with overrides
const patient = createMockUser({
  attributes: { 'custom:user_type': 'patient' }
});

const transcription = createMockTranscription({
  status: 'completed',
  transcript: 'Custom transcript text'
});
```

### Property Generators

```javascript
import {
  emailArbitrary,
  nameArbitrary,
  userTypeArbitrary,
  audioFileArbitrary,
  transcriptionArbitrary,
  templateArbitrary,
  reportArbitrary,
  searchQueryArbitrary,
} from '../__tests__/utils/propertyGenerators';

// Use in property tests
fc.assert(
  fc.property(userTypeArbitrary, (userType) => {
    // Test with generated user types
  })
);
```

## Mocked Services

The following services are automatically mocked in all tests:

### AWS Amplify Auth
```javascript
import { signIn, signUp, signOut } from 'aws-amplify/auth';
// These are automatically mocked
```

### AWS Amplify Storage
```javascript
import { uploadData, getUrl } from 'aws-amplify/storage';
// These are automatically mocked
```

### AWS Amplify API
```javascript
import { get, post } from 'aws-amplify/api';
// These are automatically mocked
```

### Browser APIs
- `MediaRecorder` - Audio recording
- `navigator.mediaDevices` - Microphone access
- `window.matchMedia` - Responsive design

## Best Practices

### Unit Testing

1. **Test behavior, not implementation**
   - Focus on what the component does, not how it does it
   - Test from the user's perspective

2. **Use semantic queries**
   ```javascript
   // Good
   screen.getByRole('button', { name: /submit/i })
   
   // Avoid
   container.querySelector('.submit-button')
   ```

3. **Keep tests simple and focused**
   - One assertion per test when possible
   - Clear test names that describe the behavior

4. **Clean up after tests**
   - Cleanup is automatic with React Testing Library
   - Clear mocks between tests if needed

### Property-Based Testing

1. **Tag all property tests**
   ```javascript
   // Feature: clinica-voice-platform, Property X: Description
   ```

2. **Run sufficient iterations**
   - Minimum 100 iterations per property
   - Increase to 500+ in CI for critical properties

3. **Use smart generators**
   - Constrain to valid input space
   - Avoid generating invalid data unless testing error handling

4. **Write clear properties**
   - Properties should be universal statements
   - Use "for all" thinking

5. **Handle counterexamples**
   - When a property fails, investigate the counterexample
   - Determine if it's a bug in code, test, or specification

## Coverage Goals

- **Minimum 80% code coverage** across the codebase
- **All correctness properties** from design.md implemented as property tests
- **Critical user workflows** covered by integration tests
- **Edge cases** covered by unit tests

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every commit to main branch
- Before deployment

CI configuration:
- All tests must pass before merge
- Coverage reports generated
- Property tests run with increased iterations (500+)

## Troubleshooting

### Common Issues

#### Tests fail with "Cannot find module"
```bash
# Solution: Reinstall dependencies
npm install
```

#### Tests timeout
```javascript
// Solution: Increase timeout in test
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

#### Mock not working
```javascript
// Solution: Import mock before component
import { vi } from 'vitest';
vi.mock('aws-amplify/auth');
import MyComponent from './MyComponent';
```

#### Property test fails with strange values
```javascript
// Solution: Add constraints to generator
const validEmailArbitrary = emailArbitrary.filter(
  email => email.length < 100
);
```

### Getting Help

1. Check test output for specific error messages
2. Review the test setup in `src/__tests__/setup.js`
3. Consult the Vitest documentation: https://vitest.dev
4. Consult the React Testing Library docs: https://testing-library.com/react
5. Consult the fast-check docs: https://fast-check.dev

## Next Steps

1. Write unit tests for existing components
2. Implement property-based tests for correctness properties in design.md
3. Add integration tests for critical user workflows
4. Monitor and improve test coverage
5. Refine property generators based on actual usage

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [fast-check Documentation](https://fast-check.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
