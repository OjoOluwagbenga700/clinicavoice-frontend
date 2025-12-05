import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient({});

/**
 * Generate a unique Medical Record Number (MRN)
 * Format: MRN-YYYYMMDD-XXXX (where XXXX is random)
 */
function generateMRN() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MRN-${year}${month}${day}-${random}`;
}

/**
 * Validate required patient fields
 */
function validatePatientData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    // Required fields for creation
    if (!data.firstName || data.firstName.trim() === '') {
      errors.push('firstName is required');
    }
    if (!data.lastName || data.lastName.trim() === '') {
      errors.push('lastName is required');
    }
    if (!data.dateOfBirth) {
      errors.push('dateOfBirth is required');
    }
    if (!data.phone && !data.email) {
      errors.push('At least one contact method (phone or email) is required');
    }
  }
  
  // Validate email format if provided
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate date of birth format if provided
  if (data.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
    errors.push('Invalid dateOfBirth format. Use YYYY-MM-DD');
  }
  
  // Validate gender if provided
  if (data.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(data.gender)) {
    errors.push('Invalid gender value');
  }
  
  return errors;
}

/**
 * Patients Lambda Handler
 * Handles all patient CRUD operations
 */
export const handler = async (event) => {
  console.log('Patients Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const queryParameters = event.queryStringParameters || {};
    
    console.log(`Method: ${method}, User: ${userId}, Type: ${userType}`);
    
    // Authorization check - only clinicians can manage patients
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized. Only clinicians can manage patients.' })
      };
    }
    
    // Route to appropriate handler
    if (method === 'GET' && !pathParameters.id) {
      return await listPatients(userId, queryParameters);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getPatient(userId, pathParameters.id);
    }
    
    if (method === 'POST') {
      return await createPatient(userId, event.body);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updatePatient(userId, pathParameters.id, event.body);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await deletePatient(userId, pathParameters.id);
    }
    
    if (method === 'POST' && pathParameters.id && event.path.endsWith('/resend-invitation')) {
      return await resendInvitation(userId, pathParameters.id);
    }
    
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request' })
    };
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

/**
 * GET /patients - List patients with filtering
 * Query params: status (active/inactive), search, limit, offset
 */
async function listPatients(userId, queryParams) {
  const status = queryParams.status || 'active';
  const search = queryParams.search || '';
  const limit = parseInt(queryParams.limit) || 50;
  
  console.log(`Listing patients for user ${userId}, status: ${status}, search: ${search}`);
  
  try {
    let command;
    
    // If filtering by status, use the status-index GSI
    if (status && !search) {
      command = new QueryCommand({
        TableName: process.env.PATIENTS_TABLE,
        IndexName: 'status-index',
        KeyConditionExpression: 'userId = :userId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':status': status
        },
        Limit: limit
      });
    } else {
      // Otherwise, query all patients for this user
      command = new QueryCommand({
        TableName: process.env.PATIENTS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        IndexName: 'status-index',
        Limit: limit
      });
    }
    
    const result = await docClient.send(command);
    let patients = result.Items || [];
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const mrn = (patient.mrn || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();
        
        return fullName.includes(searchLower) ||
               mrn.includes(searchLower) ||
               phone.includes(searchLower) ||
               email.includes(searchLower);
      });
    }
    
    // Calculate age and visit frequency for each patient
    patients = await Promise.all(patients.map(async (patient) => {
      if (patient.dateOfBirth) {
        const dob = new Date(patient.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        patient.age = age;
      }
      
      // Calculate visit frequency metrics
      const visitFrequency = await calculateVisitFrequency(userId, patient.id);
      patient.lastVisitDate = visitFrequency.lastVisitDate;
      patient.annualVisitCount = visitFrequency.annualVisitCount;
      patient.needsFollowUp = visitFrequency.needsFollowUp;
      
      return patient;
    }));
    
    // Apply sorting if requested
    if (queryParams.sortBy === 'lastVisit') {
      patients.sort((a, b) => {
        // Patients with no visits go to the end
        if (!a.lastVisitDate && !b.lastVisitDate) return 0;
        if (!a.lastVisitDate) return 1;
        if (!b.lastVisitDate) return -1;
        
        // Sort by date descending (most recent first) or ascending based on sortOrder
        const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
        return sortOrder * b.lastVisitDate.localeCompare(a.lastVisitDate);
      });
    }
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patients,
        total: patients.length,
        hasMore: result.LastEvaluatedKey !== undefined
      })
    };
    
  } catch (error) {
    console.error('Error listing patients:', error);
    throw error;
  }
}

/**
 * Calculate visit frequency metrics for a patient
 * Returns: { lastVisitDate, annualVisitCount, needsFollowUp }
 */
async function calculateVisitFrequency(userId, patientId) {
  try {
    // Query all completed appointments for this patient
    const command = new QueryCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      IndexName: 'patient-index',
      KeyConditionExpression: 'patientId = :patientId',
      ExpressionAttributeValues: {
        ':patientId': patientId
      }
    });
    
    const result = await docClient.send(command);
    const appointments = result.Items || [];
    
    // Filter for completed appointments only
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    
    if (completedAppointments.length === 0) {
      return {
        lastVisitDate: null,
        annualVisitCount: 0,
        needsFollowUp: false
      };
    }
    
    // Sort by date descending to get the most recent
    completedAppointments.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
    
    const lastVisitDate = completedAppointments[0].date;
    
    // Calculate if patient needs follow-up (>6 months since last visit)
    const lastVisit = new Date(lastVisitDate);
    const today = new Date();
    const monthsSinceLastVisit = (today.getFullYear() - lastVisit.getFullYear()) * 12 + 
                                  (today.getMonth() - lastVisit.getMonth());
    const needsFollowUp = monthsSinceLastVisit > 6;
    
    // Calculate annual visit count (past 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    const annualVisitCount = completedAppointments.filter(apt => apt.date >= oneYearAgoStr).length;
    
    return {
      lastVisitDate,
      annualVisitCount,
      needsFollowUp
    };
    
  } catch (error) {
    console.error('Error calculating visit frequency:', error);
    return {
      lastVisitDate: null,
      annualVisitCount: 0,
      needsFollowUp: false
    };
  }
}

/**
 * GET /patients/{id} - Get patient details
 */
async function getPatient(userId, patientId) {
  console.log(`Getting patient ${patientId} for user ${userId}`);
  
  try {
    const command = new GetCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId }
    });
    
    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Patient not found' })
      };
    }
    
    const patient = result.Item;
    
    // Calculate age
    if (patient.dateOfBirth) {
      const dob = new Date(patient.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      patient.age = age;
    }
    
    // Calculate visit frequency metrics
    const visitFrequency = await calculateVisitFrequency(userId, patientId);
    patient.lastVisitDate = visitFrequency.lastVisitDate;
    patient.annualVisitCount = visitFrequency.annualVisitCount;
    patient.needsFollowUp = visitFrequency.needsFollowUp;
    
    // TODO: Fetch associated transcriptions and appointments
    // This will be implemented in later tasks
    patient.transcriptions = [];
    patient.appointments = [];
    patient.medicalHistory = {};
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    };
    
  } catch (error) {
    console.error('Error getting patient:', error);
    throw error;
  }
}

/**
 * POST /patients - Create new patient
 */
async function createPatient(userId, body) {
  console.log(`Creating patient for user ${userId}`);
  
  try {
    const data = JSON.parse(body);
    
    // Validate required fields
    const validationErrors = validatePatientData(data);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation failed',
          errors: validationErrors 
        })
      };
    }
    
    // Generate unique MRN
    const mrn = generateMRN();
    
    // Check if MRN already exists (very unlikely but possible)
    const checkCommand = new QueryCommand({
      TableName: process.env.PATIENTS_TABLE,
      IndexName: 'mrn-index',
      KeyConditionExpression: 'mrn = :mrn',
      ExpressionAttributeValues: { ':mrn': mrn }
    });
    
    const existingPatient = await docClient.send(checkCommand);
    if (existingPatient.Items && existingPatient.Items.length > 0) {
      // Regenerate MRN if collision (extremely rare)
      return await createPatient(userId, body);
    }
    
    const now = new Date().toISOString();
    
    // Create patient record
    const patient = {
      id: randomUUID(),
      userId,
      mrn,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender || 'prefer-not-to-say',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: ''
      },
      preferredContactMethod: data.preferredContactMethod || 'email',
      status: 'active',
      // Patient portal fields (will be used in later tasks)
      cognitoUserId: null,
      accountStatus: 'pending',
      invitationToken: null,
      invitationSentAt: null,
      invitationExpiresAt: null,
      activatedAt: null,
      lastLoginAt: null,
      // Metadata
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId
    };
    
    const command = new PutCommand({
      TableName: process.env.PATIENTS_TABLE,
      Item: patient
    });
    
    await docClient.send(command);
    
    console.log(`Patient created successfully: ${patient.id}, MRN: ${mrn}`);
    
    // Send invitation email if patient has email
    if (patient.email) {
      await invokeInvitationLambda(patient.id, userId, 'Your healthcare provider');
    }
    
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    };
    
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}

/**
 * PUT /patients/{id} - Update patient
 */
async function updatePatient(userId, patientId, body) {
  console.log(`Updating patient ${patientId} for user ${userId}`);
  
  try {
    const data = JSON.parse(body);
    
    // Validate data
    const validationErrors = validatePatientData(data, true);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation failed',
          errors: validationErrors 
        })
      };
    }
    
    // Check if patient exists
    const getCommand = new GetCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId }
    });
    
    const existingPatient = await docClient.send(getCommand);
    if (!existingPatient.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Patient not found' })
      };
    }
    
    // Build dynamic update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString(),
      ':updatedBy': userId
    };
    
    // Update allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender',
      'phone', 'email', 'address', 'preferredContactMethod'
    ];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = data[field];
      }
    });
    
    updateExpressions.push('updatedAt = :updatedAt');
    updateExpressions.push('updatedBy = :updatedBy');
    
    const updateCommand = new UpdateCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const result = await docClient.send(updateCommand);
    
    console.log(`Patient updated successfully: ${patientId}`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Attributes)
    };
    
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
}

/**
 * Invoke patient invitation Lambda
 */
async function invokeInvitationLambda(patientId, userId, clinicianName) {
  try {
    const payload = {
      patientId,
      userId,
      clinicianName
    };
    
    const command = new InvokeCommand({
      FunctionName: process.env.INVITATION_LAMBDA_NAME,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify(payload)
    });
    
    await lambdaClient.send(command);
    console.log(`Invitation Lambda invoked for patient ${patientId}`);
  } catch (error) {
    console.error('Error invoking invitation Lambda:', error);
    // Don't fail patient creation if invitation fails
    // The invitation can be resent later
  }
}

/**
 * POST /patients/{id}/resend-invitation - Resend invitation email
 */
async function resendInvitation(userId, patientId) {
  console.log(`Resending invitation for patient ${patientId}`);
  
  try {
    // Get patient record
    const getCommand = new GetCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId }
    });
    
    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Patient not found' })
      };
    }
    
    const patient = result.Item;
    
    // Validate patient status
    if (patient.accountStatus === 'active') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Patient account is already active',
          message: 'Cannot resend invitation to an active account'
        })
      };
    }
    
    if (!patient.email) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Patient does not have an email address',
          message: 'Please add an email address before sending invitation'
        })
      };
    }
    
    // Invoke invitation Lambda
    await invokeInvitationLambda(patientId, userId, 'Your healthcare provider');
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        message: 'Invitation email will be sent shortly',
        sentAt: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error resending invitation:', error);
    throw error;
  }
}

/**
 * DELETE /patients/{id} - Soft delete (mark as inactive)
 */
async function deletePatient(userId, patientId) {
  console.log(`Soft deleting patient ${patientId} for user ${userId}`);
  
  try {
    // Check if patient exists
    const getCommand = new GetCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId }
    });
    
    const existingPatient = await docClient.send(getCommand);
    if (!existingPatient.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Patient not found' })
      };
    }
    
    // Soft delete by updating status to inactive
    const updateCommand = new UpdateCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, updatedBy = :updatedBy',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'inactive',
        ':updatedAt': new Date().toISOString(),
        ':updatedBy': userId
      },
      ReturnValues: 'ALL_NEW'
    });
    
    await docClient.send(updateCommand);
    
    console.log(`Patient soft deleted successfully: ${patientId}`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Patient marked as inactive' })
    };
    
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
}
