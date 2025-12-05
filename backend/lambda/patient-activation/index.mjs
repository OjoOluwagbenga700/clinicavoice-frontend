import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * Validate activation token
 * Returns patient record if token is valid
 */
async function validateToken(token) {
  if (!token || token.trim() === '') {
    throw new Error('Activation token is required');
  }
  
  // Scan for patient with matching token
  // Note: In production, consider using a GSI on invitationToken for better performance
  const scanCommand = new ScanCommand({
    TableName: process.env.PATIENTS_TABLE,
    FilterExpression: 'invitationToken = :token',
    ExpressionAttributeValues: {
      ':token': token
    }
  });
  
  const result = await docClient.send(scanCommand);
  
  if (!result.Items || result.Items.length === 0) {
    throw new Error('Invalid activation token');
  }
  
  const patient = result.Items[0];
  
  // Check if token has expired
  if (patient.invitationExpiresAt) {
    const expirationDate = new Date(patient.invitationExpiresAt);
    const now = new Date();
    
    if (now > expirationDate) {
      throw new Error('Activation token has expired');
    }
  }
  
  // Check if account is already active
  if (patient.accountStatus === 'active') {
    throw new Error('Account is already activated');
  }
  
  return patient;
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  return null;
}

/**
 * Create Cognito user with patient role
 */
async function createCognitoUser(patient, password) {
  const email = patient.email;
  
  try {
    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        },
        {
          Name: 'name',
          Value: `${patient.firstName} ${patient.lastName}`
        },
        {
          Name: 'custom:user_type',
          Value: 'patient'
        },
        {
          Name: 'custom:patientId',
          Value: patient.id
        }
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: password // Set temporary password
    });
    
    const createResult = await cognitoClient.send(createUserCommand);
    const cognitoUserId = createResult.User.Username;
    
    console.log(`Cognito user created: ${cognitoUserId}`);
    
    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    });
    
    await cognitoClient.send(setPasswordCommand);
    
    console.log(`Password set for user: ${email}`);
    
    return cognitoUserId;
    
  } catch (error) {
    console.error('Error creating Cognito user:', error);
    
    // Handle specific Cognito errors
    if (error.name === 'UsernameExistsException') {
      throw new Error('An account with this email already exists');
    }
    
    throw new Error(`Failed to create user account: ${error.message}`);
  }
}

/**
 * Link Cognito user to patient record and update status
 */
async function activatePatientAccount(patient, cognitoUserId) {
  const now = new Date().toISOString();
  
  const updateCommand = new UpdateCommand({
    TableName: process.env.PATIENTS_TABLE,
    Key: {
      id: patient.id,
      userId: patient.userId
    },
    UpdateExpression: `
      SET cognitoUserId = :cognitoUserId,
          accountStatus = :accountStatus,
          activatedAt = :activatedAt,
          invitationToken = :nullValue,
          updatedAt = :updatedAt
    `,
    ExpressionAttributeValues: {
      ':cognitoUserId': cognitoUserId,
      ':accountStatus': 'active',
      ':activatedAt': now,
      ':nullValue': null,
      ':updatedAt': now
    },
    ReturnValues: 'ALL_NEW'
  });
  
  const result = await docClient.send(updateCommand);
  
  console.log(`Patient account activated: ${patient.id}`);
  
  return result.Attributes;
}

/**
 * Patient Activation Lambda Handler
 * POST /patients/activate
 * Body: { token, password }
 */
export const handler = async (event) => {
  console.log('Patient Activation Lambda invoked:', JSON.stringify(event, null, 2));
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };
  
  try {
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'OK' })
      };
    }
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { token, password } = body;
    
    // Validate input
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          message: 'Activation token is required'
        })
      };
    }
    
    if (!password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          message: 'Password is required'
        })
      };
    }
    
    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          message: passwordError
        })
      };
    }
    
    // Validate activation token
    let patient;
    try {
      patient = await validateToken(token);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid token',
          message: error.message
        })
      };
    }
    
    // Create Cognito user with patient role
    let cognitoUserId;
    try {
      cognitoUserId = await createCognitoUser(patient, password);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Account creation failed',
          message: error.message
        })
      };
    }
    
    // Link Cognito user to patient record and activate account
    const updatedPatient = await activatePatientAccount(patient, cognitoUserId);
    
    // Remove sensitive fields from response
    delete updatedPatient.invitationToken;
    delete updatedPatient.invitationSentAt;
    delete updatedPatient.invitationExpiresAt;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Account activated successfully',
        patient: {
          id: updatedPatient.id,
          firstName: updatedPatient.firstName,
          lastName: updatedPatient.lastName,
          email: updatedPatient.email,
          accountStatus: updatedPatient.accountStatus,
          activatedAt: updatedPatient.activatedAt
        }
      })
    };
    
  } catch (error) {
    console.error('Error in patient activation:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
