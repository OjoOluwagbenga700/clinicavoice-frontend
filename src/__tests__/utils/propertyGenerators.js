import * as fc from 'fast-check';

/**
 * Generator for valid email addresses
 */
export const emailArbitrary = fc.emailAddress();

/**
 * Generator for user names (2-50 characters)
 */
export const nameArbitrary = fc.string({ minLength: 2, maxLength: 50 }).filter(
  name => name.trim().length >= 2
);

/**
 * Generator for passwords that meet AWS Cognito requirements
 * (min 8 chars, uppercase, lowercase, number, special char)
 */
export const passwordArbitrary = fc.string({ minLength: 8, maxLength: 20 }).map(
  base => {
    // Ensure password meets complexity requirements
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    
    return (
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      digits[Math.floor(Math.random() * digits.length)] +
      special[Math.floor(Math.random() * special.length)] +
      base
    );
  }
);

/**
 * Generator for user types
 */
export const userTypeArbitrary = fc.constantFrom('clinician', 'patient');

/**
 * Generator for user objects
 */
export const userArbitrary = fc.record({
  id: fc.uuid(),
  email: emailArbitrary,
  name: nameArbitrary,
  userType: userTypeArbitrary,
  createdAt: fc.date(),
});

/**
 * Generator for audio file formats
 */
export const audioFormatArbitrary = fc.constantFrom('webm', 'mp3', 'wav', 'm4a');

/**
 * Generator for invalid audio formats
 */
export const invalidAudioFormatArbitrary = fc.constantFrom(
  'txt', 'pdf', 'jpg', 'png', 'doc', 'zip'
);

/**
 * Generator for file sizes (in bytes)
 */
export const fileSizeArbitrary = fc.integer({ min: 1, max: 100 * 1024 * 1024 }); // Up to 100MB

/**
 * Generator for file sizes exceeding limit
 */
export const oversizedFileArbitrary = fc.integer({ 
  min: 100 * 1024 * 1024 + 1, 
  max: 200 * 1024 * 1024 
});

/**
 * Generator for audio file objects
 */
export const audioFileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(
    name => `${name}.${['webm', 'mp3', 'wav', 'm4a'][Math.floor(Math.random() * 4)]}`
  ),
  size: fileSizeArbitrary,
  type: fc.constantFrom('audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a'),
});

/**
 * Generator for transcription status
 */
export const transcriptionStatusArbitrary = fc.constantFrom(
  'pending', 'completed', 'failed'
);

/**
 * Generator for transcription objects
 */
export const transcriptionArbitrary = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  patientId: fc.option(fc.uuid(), { nil: undefined }),
  audioFileKey: fc.string({ minLength: 10, maxLength: 100 }),
  audioFileName: fc.string({ minLength: 5, maxLength: 50 }),
  audioFileSize: fileSizeArbitrary,
  transcript: fc.lorem({ maxCount: 100 }),
  status: transcriptionStatusArbitrary,
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

/**
 * Generator for template placeholders
 */
export const placeholderArbitrary = fc.constantFrom(
  'PatientName', 'Date', 'Diagnosis', 'Medications', 
  'ChiefComplaint', 'VitalSigns', 'Assessment', 'Plan'
);

/**
 * Generator for template content with placeholders
 */
export const templateContentArbitrary = fc.array(placeholderArbitrary, { minLength: 1, maxLength: 5 })
  .map(placeholders => {
    return placeholders.map(p => `{{${p}}}`).join('\n');
  });

/**
 * Generator for template objects
 */
export const templateArbitrary = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  content: templateContentArbitrary,
  placeholders: fc.array(placeholderArbitrary, { minLength: 1, maxLength: 8 }),
  category: fc.constantFrom('SOAP', 'Progress', 'Consultation', 'Discharge'),
  isShared: fc.boolean(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

/**
 * Generator for report status
 */
export const reportStatusArbitrary = fc.constantFrom('draft', 'reviewed', 'finalized');

/**
 * Generator for report objects
 */
export const reportArbitrary = fc.record({
  id: fc.uuid(),
  transcriptionId: fc.uuid(),
  patientId: fc.uuid(),
  clinicianId: fc.uuid(),
  patientName: nameArbitrary,
  date: fc.date(),
  summary: fc.lorem({ maxCount: 20 }),
  content: fc.lorem({ maxCount: 100 }),
  status: reportStatusArbitrary,
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

/**
 * Generator for search queries
 */
export const searchQueryArbitrary = fc.oneof(
  fc.string({ minLength: 0, maxLength: 50 }),
  fc.constant(''),
  fc.lorem({ maxCount: 3 })
);

/**
 * Generator for viewport widths
 */
export const viewportWidthArbitrary = fc.integer({ min: 320, max: 2560 });

/**
 * Generator for language codes
 */
export const languageArbitrary = fc.constantFrom('en', 'fr');

/**
 * Generator for route paths
 */
export const routePathArbitrary = fc.constantFrom(
  '/dashboard',
  '/dashboard/overview',
  '/dashboard/transcribe',
  '/dashboard/templates',
  '/dashboard/reports',
  '/dashboard/settings',
  '/dashboard/profile'
);

/**
 * Generator for authentication tokens
 */
export const authTokenArbitrary = fc.string({ minLength: 32, maxLength: 128 });

/**
 * Generator for session storage keys
 */
export const sessionKeyArbitrary = fc.constantFrom(
  'authToken',
  'userId',
  'userType',
  'sessionExpiry'
);
