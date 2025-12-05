import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Validate required appointment fields
 */
function validateAppointmentData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    // Required fields for creation
    if (!data.patientId || data.patientId.trim() === '') {
      errors.push('patientId is required');
    }
    if (!data.date) {
      errors.push('date is required');
    }
    if (!data.time) {
      errors.push('time is required');
    }
    if (!data.type) {
      errors.push('type is required');
    }
  }
  
  // Validate date format if provided (YYYY-MM-DD)
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  }
  
  // Validate time format if provided (HH:MM)
  if (data.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    errors.push('Invalid time format. Use HH:MM');
  }
  
  // Validate appointment type if provided
  if (data.type && !['consultation', 'follow-up', 'procedure', 'urgent'].includes(data.type)) {
    errors.push('Invalid appointment type. Must be: consultation, follow-up, procedure, or urgent');
  }
  
  // Validate duration if provided (must be positive and in 15-minute increments)
  if (data.duration !== undefined) {
    if (typeof data.duration !== 'number' || data.duration <= 0) {
      errors.push('Duration must be a positive number');
    } else if (data.duration % 15 !== 0) {
      errors.push('Duration must be in 15-minute increments');
    }
  }
  
  // Validate status if provided
  if (data.status && !['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(data.status)) {
    errors.push('Invalid status. Must be: scheduled, confirmed, completed, cancelled, or no-show');
  }
  
  // Validate that date is not in the past (for new appointments)
  if (!isUpdate && data.date) {
    const appointmentDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      errors.push('Cannot schedule appointments in the past');
    }
  }
  
  return errors;
}

/**
 * Get default duration for appointment type
 */
function getDefaultDuration(type) {
  const durations = {
    'consultation': 60,
    'follow-up': 30,
    'procedure': 90,
    'urgent': 45
  };
  return durations[type] || 60;
}

/**
 * Check for appointment conflicts
 * Returns true if there's a conflict, false otherwise
 */
async function checkAppointmentConflict(userId, date, time, duration, excludeAppointmentId = null) {
  try {
    // Query all appointments for this user on this date
    const command = new QueryCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: 'userId = :userId AND #date = :date',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':date': date
      }
    });
    
    const result = await docClient.send(command);
    const existingAppointments = result.Items || [];
    
    // Parse the new appointment time
    const [newHours, newMinutes] = time.split(':').map(Number);
    const newStartMinutes = newHours * 60 + newMinutes;
    const newEndMinutes = newStartMinutes + duration;
    
    // Check for overlaps
    for (const appointment of existingAppointments) {
      // Skip the appointment being updated
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        continue;
      }
      
      // Skip cancelled appointments
      if (appointment.status === 'cancelled') {
        continue;
      }
      
      const [existingHours, existingMinutes] = appointment.time.split(':').map(Number);
      const existingStartMinutes = existingHours * 60 + existingMinutes;
      const existingEndMinutes = existingStartMinutes + appointment.duration;
      
      // Check for overlap
      // Two appointments overlap if:
      // - New appointment starts before existing ends AND
      // - New appointment ends after existing starts
      if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
        return true; // Conflict found
      }
    }
    
    // Check for time block conflicts
    const timeBlocksCommand = new QueryCommand({
      TableName: process.env.TIMEBLOCKS_TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: 'userId = :userId AND #date = :date',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':date': date
      }
    });
    
    const timeBlocksResult = await docClient.send(timeBlocksCommand);
    const timeBlocks = timeBlocksResult.Items || [];
    
    for (const block of timeBlocks) {
      const [blockStartHours, blockStartMinutes] = block.startTime.split(':').map(Number);
      const [blockEndHours, blockEndMinutes] = block.endTime.split(':').map(Number);
      const blockStartMinutes = blockStartHours * 60 + blockStartMinutes;
      const blockEndMinutes = blockEndHours * 60 + blockEndMinutes;
      
      // Check for overlap with time block
      if (newStartMinutes < blockEndMinutes && newEndMinutes > blockStartMinutes) {
        return true; // Conflict with time block
      }
    }
    
    return false; // No conflicts
    
  } catch (error) {
    console.error('Error checking appointment conflicts:', error);
    throw error;
  }
}

/**
 * Appointments Lambda Handler
 * Handles all appointment CRUD operations
 */
export const handler = async (event) => {
  console.log('Appointments Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const queryParameters = event.queryStringParameters || {};
    
    console.log(`Method: ${method}, User: ${userId}, Type: ${userType}`);
    
    // Authorization check
    // Patients can only view their own appointments (GET requests)
    // Clinicians can manage all appointments
    if (userType === 'patient' && method !== 'GET') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized. Patients can only view appointments.' })
      };
    }
    
    if (userType !== 'clinician' && userType !== 'patient') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized.' })
      };
    }
    
    // Route to appropriate handler
    if (method === 'GET' && !pathParameters.id) {
      return await listAppointments(userId, userType, queryParameters);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getAppointment(userId, userType, pathParameters.id);
    }
    
    if (method === 'POST' && !pathParameters.id) {
      return await createAppointment(userId, event.body);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updateAppointment(userId, pathParameters.id, event.body);
    }
    
    if (method === 'POST' && pathParameters.id && event.path.includes('/status')) {
      return await updateAppointmentStatus(userId, pathParameters.id, event.body);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await cancelAppointment(userId, pathParameters.id, event.body);
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
 * GET /appointments - List appointments with filtering
 * Query params: startDate, endDate, patientId, status, limit
 */
async function listAppointments(userId, userType, queryParams) {
  const startDate = queryParams.startDate;
  const endDate = queryParams.endDate;
  const patientId = queryParams.patientId;
  const status = queryParams.status;
  const limit = parseInt(queryParams.limit) || 100;
  
  console.log(`Listing appointments for user ${userId}, type ${userType}`);
  console.log(`Filters - startDate: ${startDate}, endDate: ${endDate}, patientId: ${patientId}, status: ${status}`);
  
  try {
    let appointments = [];
    
    // For patients, we need to find their patient record first
    if (userType === 'patient') {
      // Find patient record linked to this Cognito user
      const patientCommand = new QueryCommand({
        TableName: process.env.PATIENTS_TABLE,
        IndexName: 'cognito-user-index',
        KeyConditionExpression: 'cognitoUserId = :cognitoUserId',
        ExpressionAttributeValues: {
          ':cognitoUserId': userId
        }
      });
      
      const patientResult = await docClient.send(patientCommand);
      
      if (!patientResult.Items || patientResult.Items.length === 0) {
        console.log('No patient record found for this user');
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointments: [],
            total: 0
          })
        };
      }
      
      const patientRecord = patientResult.Items[0];
      
      // Query appointments for this patient
      const appointmentsCommand = new QueryCommand({
        TableName: process.env.APPOINTMENTS_TABLE,
        IndexName: 'patient-index',
        KeyConditionExpression: 'patientId = :patientId',
        ExpressionAttributeValues: {
          ':patientId': patientRecord.id
        },
        Limit: limit
      });
      
      const result = await docClient.send(appointmentsCommand);
      appointments = result.Items || [];
      
      // Apply filters for patients
      if (startDate) {
        appointments = appointments.filter(apt => apt.date >= startDate);
      }
      if (endDate) {
        appointments = appointments.filter(apt => apt.date <= endDate);
      }
      if (status) {
        const statuses = status.split(',');
        appointments = appointments.filter(apt => statuses.includes(apt.status));
      }
      
      // Fetch clinician details for each appointment
      for (const appointment of appointments) {
        try {
          // In a real system, we'd fetch clinician details from a Users table
          // For now, we'll just use the userId as the clinician name
          appointment.clinicianName = 'Dr. ' + appointment.userId.substring(0, 8);
        } catch (error) {
          console.error('Error fetching clinician details:', error);
        }
      }
    } 
    // For clinicians, use existing logic
    else {
      // Query by patient if patientId is provided
      if (patientId) {
        const command = new QueryCommand({
          TableName: process.env.APPOINTMENTS_TABLE,
          IndexName: 'patient-index',
          KeyConditionExpression: 'patientId = :patientId',
          ExpressionAttributeValues: {
            ':patientId': patientId
          },
          Limit: limit
        });
        
        const result = await docClient.send(command);
        appointments = result.Items || [];
        
        // Filter by userId (patient might have appointments with multiple clinicians)
        appointments = appointments.filter(apt => apt.userId === userId);
      }
      // Query by date range if provided
      else if (startDate) {
        const command = new QueryCommand({
          TableName: process.env.APPOINTMENTS_TABLE,
          IndexName: 'date-index',
          KeyConditionExpression: 'userId = :userId AND #date >= :startDate',
          ExpressionAttributeNames: {
            '#date': 'date'
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':startDate': startDate
          },
          Limit: limit
        });
        
        const result = await docClient.send(command);
        appointments = result.Items || [];
        
        // Filter by end date if provided
        if (endDate) {
          appointments = appointments.filter(apt => apt.date <= endDate);
        }
      }
      // Query by status if provided
      else if (status) {
        const command = new QueryCommand({
          TableName: process.env.APPOINTMENTS_TABLE,
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
        
        const result = await docClient.send(command);
        appointments = result.Items || [];
      }
      // Otherwise, query all appointments for this user
      else {
        const command = new QueryCommand({
          TableName: process.env.APPOINTMENTS_TABLE,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          Limit: limit
        });
        
        const result = await docClient.send(command);
        appointments = result.Items || [];
      }
      
      // Apply additional filters
      if (status && !queryParams.status) {
        appointments = appointments.filter(apt => apt.status === status);
      }
    }
    
    // Sort by date and time
    appointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
    
    console.log(`Returning ${appointments.length} appointments`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointments,
        total: appointments.length
      })
    };
    
  } catch (error) {
    console.error('Error listing appointments:', error);
    throw error;
  }
}

/**
 * GET /appointments/{id} - Get appointment details
 */
async function getAppointment(userId, userType, appointmentId) {
  console.log(`Getting appointment ${appointmentId} for user ${userId}, type ${userType}`);
  
  try {
    let appointment;
    
    if (userType === 'patient') {
      // Find patient record linked to this Cognito user
      const patientCommand = new QueryCommand({
        TableName: process.env.PATIENTS_TABLE,
        IndexName: 'cognito-user-index',
        KeyConditionExpression: 'cognitoUserId = :cognitoUserId',
        ExpressionAttributeValues: {
          ':cognitoUserId': userId
        }
      });
      
      const patientResult = await docClient.send(patientCommand);
      
      if (!patientResult.Items || patientResult.Items.length === 0) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Patient record not found' })
        };
      }
      
      const patientRecord = patientResult.Items[0];
      
      // Get the appointment and verify it belongs to this patient
      const appointmentCommand = new QueryCommand({
        TableName: process.env.APPOINTMENTS_TABLE,
        IndexName: 'patient-index',
        KeyConditionExpression: 'patientId = :patientId',
        FilterExpression: 'id = :appointmentId',
        ExpressionAttributeValues: {
          ':patientId': patientRecord.id,
          ':appointmentId': appointmentId
        }
      });
      
      const appointmentResult = await docClient.send(appointmentCommand);
      
      if (!appointmentResult.Items || appointmentResult.Items.length === 0) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Appointment not found' })
        };
      }
      
      appointment = appointmentResult.Items[0];
      
      // Add clinician name
      appointment.clinicianName = 'Dr. ' + appointment.userId.substring(0, 8);
    } else {
      // Clinician access
      const command = new GetCommand({
        TableName: process.env.APPOINTMENTS_TABLE,
        Key: { id: appointmentId, userId }
      });
      
      const result = await docClient.send(command);
      
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Appointment not found' })
        };
      }
      
      appointment = result.Item;
      
      // Fetch patient details
      if (appointment.patientId) {
        try {
          const patientCommand = new GetCommand({
            TableName: process.env.PATIENTS_TABLE,
            Key: { id: appointment.patientId, userId }
          });
          
          const patientResult = await docClient.send(patientCommand);
          if (patientResult.Item) {
            appointment.patient = {
              id: patientResult.Item.id,
              mrn: patientResult.Item.mrn,
              firstName: patientResult.Item.firstName,
              lastName: patientResult.Item.lastName,
              phone: patientResult.Item.phone,
              email: patientResult.Item.email
            };
          }
        } catch (error) {
          console.error('Error fetching patient details:', error);
          // Continue without patient details
        }
      }
    }
    
    // TODO: Fetch linked transcription if transcriptionId exists
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    };
    
  } catch (error) {
    console.error('Error getting appointment:', error);
    throw error;
  }
}

/**
 * POST /appointments - Create appointment with conflict check
 */
async function createAppointment(userId, body) {
  console.log(`Creating appointment for user ${userId}`);
  
  try {
    const data = JSON.parse(body);
    
    // Validate required fields
    const validationErrors = validateAppointmentData(data);
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
    
    // Verify patient exists
    const patientCommand = new GetCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: data.patientId, userId }
    });
    
    const patientResult = await docClient.send(patientCommand);
    if (!patientResult.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Patient not found' })
      };
    }
    
    // Set default duration if not provided
    const duration = data.duration || getDefaultDuration(data.type);
    
    // Check for conflicts
    const hasConflict = await checkAppointmentConflict(userId, data.date, data.time, duration);
    if (hasConflict) {
      return {
        statusCode: 409,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Time slot conflict',
          message: 'This time slot is already booked or blocked'
        })
      };
    }
    
    const now = new Date().toISOString();
    
    // Create appointment record
    const appointment = {
      id: randomUUID(),
      userId,
      patientId: data.patientId,
      date: data.date,
      time: data.time,
      duration,
      type: data.type,
      status: 'scheduled',
      statusHistory: [{
        status: 'scheduled',
        timestamp: now,
        changedBy: userId
      }],
      notes: data.notes || '',
      notesHistory: data.notes ? [{
        notes: data.notes,
        timestamp: now,
        changedBy: userId
      }] : [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId
    };
    
    const command = new PutCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      Item: appointment
    });
    
    await docClient.send(command);
    
    console.log(`Appointment created successfully: ${appointment.id}`);
    
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    };
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

/**
 * PUT /appointments/{id} - Update/reschedule appointment
 */
async function updateAppointment(userId, appointmentId, body) {
  console.log(`Updating appointment ${appointmentId} for user ${userId}`);
  
  try {
    const data = JSON.parse(body);
    
    // Validate data
    const validationErrors = validateAppointmentData(data, true);
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
    
    // Check if appointment exists
    const getCommand = new GetCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      Key: { id: appointmentId, userId }
    });
    
    const existingAppointment = await docClient.send(getCommand);
    if (!existingAppointment.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Appointment not found' })
      };
    }
    
    const appointment = existingAppointment.Item;
    
    // If rescheduling (date or time changed), check for conflicts
    if ((data.date && data.date !== appointment.date) || 
        (data.time && data.time !== appointment.time) ||
        (data.duration && data.duration !== appointment.duration)) {
      
      const newDate = data.date || appointment.date;
      const newTime = data.time || appointment.time;
      const newDuration = data.duration || appointment.duration;
      
      const hasConflict = await checkAppointmentConflict(userId, newDate, newTime, newDuration, appointmentId);
      if (hasConflict) {
        return {
          statusCode: 409,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Time slot conflict',
            message: 'The new time slot is already booked or blocked'
          })
        };
      }
    }
    
    // Build dynamic update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString(),
      ':updatedBy': userId
    };
    
    // Update allowed fields
    const allowedFields = ['date', 'time', 'duration', 'type', 'notes'];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = data[field];
      }
    });
    
    // Update notes history if notes changed
    if (data.notes !== undefined && data.notes !== appointment.notes) {
      const notesHistory = appointment.notesHistory || [];
      notesHistory.push({
        notes: data.notes,
        timestamp: expressionAttributeValues[':updatedAt'],
        changedBy: userId
      });
      updateExpressions.push('notesHistory = :notesHistory');
      expressionAttributeValues[':notesHistory'] = notesHistory;
    }
    
    updateExpressions.push('updatedAt = :updatedAt');
    updateExpressions.push('updatedBy = :updatedBy');
    
    const updateCommand = new UpdateCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      Key: { id: appointmentId, userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const result = await docClient.send(updateCommand);
    
    console.log(`Appointment updated successfully: ${appointmentId}`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Attributes)
    };
    
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
}

/**
 * POST /appointments/{id}/status - Update appointment status
 */
async function updateAppointmentStatus(userId, appointmentId, body) {
  console.log(`Updating status for appointment ${appointmentId}`);
  
  try {
    const data = JSON.parse(body);
    
    // Validate status
    if (!data.status) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Status is required' })
      };
    }
    
    if (!['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(data.status)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid status',
          message: 'Status must be: scheduled, confirmed, completed, cancelled, or no-show'
        })
      };
    }
    
    // Check if appointment exists
    const getCommand = new GetCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      Key: { id: appointmentId, userId }
    });
    
    const existingAppointment = await docClient.send(getCommand);
    if (!existingAppointment.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Appointment not found' })
      };
    }
    
    const appointment = existingAppointment.Item;
    const now = new Date().toISOString();
    
    // Add to status history
    const statusHistory = appointment.statusHistory || [];
    statusHistory.push({
      status: data.status,
      timestamp: now,
      changedBy: userId,
      reason: data.reason || undefined
    });
    
    // Build update expression
    const updateExpression = 'SET #status = :status, statusHistory = :statusHistory, updatedAt = :updatedAt, updatedBy = :updatedBy';
    const expressionAttributeNames = {
      '#status': 'status'
    };
    const expressionAttributeValues = {
      ':status': data.status,
      ':statusHistory': statusHistory,
      ':updatedAt': now,
      ':updatedBy': userId
    };
    
    const updateCommand = new UpdateCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      Key: { id: appointmentId, userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const result = await docClient.send(updateCommand);
    
    console.log(`Appointment status updated successfully: ${appointmentId} -> ${data.status}`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Attributes)
    };
    
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
}

/**
 * DELETE /appointments/{id} - Cancel appointment
 */
async function cancelAppointment(userId, appointmentId, body) {
  console.log(`Cancelling appointment ${appointmentId} for user ${userId}`);
  
  try {
    const data = body ? JSON.parse(body) : {};
    
    // Validate cancellation reason is provided
    if (!data.reason || data.reason.trim() === '') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Cancellation reason is required',
          message: 'Please provide a reason for cancelling this appointment'
        })
      };
    }
    
    // Check if appointment exists
    const getCommand = new GetCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      Key: { id: appointmentId, userId }
    });
    
    const existingAppointment = await docClient.send(getCommand);
    if (!existingAppointment.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Appointment not found' })
      };
    }
    
    const appointment = existingAppointment.Item;
    const now = new Date().toISOString();
    
    // Add to status history
    const statusHistory = appointment.statusHistory || [];
    statusHistory.push({
      status: 'cancelled',
      timestamp: now,
      changedBy: userId,
      reason: data.reason
    });
    
    // Update appointment to cancelled status
    const updateCommand = new UpdateCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      Key: { id: appointmentId, userId },
      UpdateExpression: 'SET #status = :status, statusHistory = :statusHistory, cancellationReason = :reason, cancelledAt = :cancelledAt, cancelledBy = :cancelledBy, updatedAt = :updatedAt, updatedBy = :updatedBy',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':statusHistory': statusHistory,
        ':reason': data.reason,
        ':cancelledAt': now,
        ':cancelledBy': userId,
        ':updatedAt': now,
        ':updatedBy': userId
      },
      ReturnValues: 'ALL_NEW'
    });
    
    await docClient.send(updateCommand);
    
    console.log(`Appointment cancelled successfully: ${appointmentId}`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        message: 'Appointment cancelled successfully'
      })
    };
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
}
