import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Validate required time block fields
 */
function validateTimeBlockData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    // Required fields for creation
    if (!data.date) {
      errors.push('date is required');
    }
    if (!data.startTime) {
      errors.push('startTime is required');
    }
    if (!data.endTime) {
      errors.push('endTime is required');
    }
    if (!data.reason || data.reason.trim() === '') {
      errors.push('reason is required');
    }
  }
  
  // Validate date format if provided (YYYY-MM-DD)
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  }
  
  // Validate time format if provided (HH:MM)
  if (data.startTime && !/^([0-1]?\d|2[0-3]):[0-5]\d$/.test(data.startTime)) {
    errors.push('Invalid startTime format. Use HH:MM');
  }
  
  if (data.endTime && !/^([0-1]?\d|2[0-3]):[0-5]\d$/.test(data.endTime)) {
    errors.push('Invalid endTime format. Use HH:MM');
  }
  
  // Validate that endTime is after startTime
  if (data.startTime && data.endTime) {
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    if (endMinutesTotal <= startMinutesTotal) {
      errors.push('endTime must be after startTime');
    }
  }
  
  // Validate type if provided
  if (data.type && !['break', 'admin', 'meeting', 'other'].includes(data.type)) {
    errors.push('Invalid type. Must be: break, admin, meeting, or other');
  }
  
  // Validate recurrence if provided
  if (data.recurrence) {
    if (!data.recurrence.type || !['daily', 'weekly', 'custom'].includes(data.recurrence.type)) {
      errors.push('Invalid recurrence type. Must be: daily, weekly, or custom');
    }
    
    if (data.recurrence.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.recurrence.endDate)) {
      errors.push('Invalid recurrence endDate format. Use YYYY-MM-DD');
    }
    
    if (data.recurrence.daysOfWeek) {
      if (!Array.isArray(data.recurrence.daysOfWeek)) {
        errors.push('recurrence.daysOfWeek must be an array');
      } else {
        const invalidDays = data.recurrence.daysOfWeek.filter(day => 
          typeof day !== 'number' || day < 0 || day > 6
        );
        if (invalidDays.length > 0) {
          errors.push('recurrence.daysOfWeek must contain numbers 0-6 (Sunday-Saturday)');
        }
      }
    }
  }
  
  return errors;
}

/**
 * Check if time block conflicts with existing appointments
 */
async function checkTimeBlockConflictsWithAppointments(userId, date, startTime, endTime, excludeTimeBlockId = null) {
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
    const appointments = result.Items || [];
    
    // Parse the time block times
    const [blockStartHours, blockStartMinutes] = startTime.split(':').map(Number);
    const [blockEndHours, blockEndMinutes] = endTime.split(':').map(Number);
    const blockStartMinutesTotal = blockStartHours * 60 + blockStartMinutes;
    const blockEndMinutesTotal = blockEndHours * 60 + blockEndMinutes;
    
    // Check for overlaps with appointments
    for (const appointment of appointments) {
      // Skip cancelled appointments
      if (appointment.status === 'cancelled') {
        continue;
      }
      
      const [aptHours, aptMinutes] = appointment.time.split(':').map(Number);
      const aptStartMinutes = aptHours * 60 + aptMinutes;
      const aptEndMinutes = aptStartMinutes + appointment.duration;
      
      // Check for overlap
      if (blockStartMinutesTotal < aptEndMinutes && blockEndMinutesTotal > aptStartMinutes) {
        return {
          hasConflict: true,
          conflictType: 'appointment',
          conflictDetails: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            time: appointment.time,
            duration: appointment.duration
          }
        };
      }
    }
    
    return { hasConflict: false };
    
  } catch (error) {
    console.error('Error checking time block conflicts:', error);
    throw error;
  }
}

/**
 * Time Blocks Lambda Handler
 * Handles all time block CRUD operations
 */
export const handler = async (event) => {
  console.log('Time Blocks Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const queryParameters = event.queryStringParameters || {};
    
    console.log(`Method: ${method}, User: ${userId}, Type: ${userType}`);
    
    // Authorization check - only clinicians can manage time blocks
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized. Only clinicians can manage time blocks.' })
      };
    }
    
    // Route to appropriate handler
    if (method === 'GET' && !pathParameters.id) {
      return await listTimeBlocks(userId, queryParameters);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getTimeBlock(userId, pathParameters.id);
    }
    
    if (method === 'POST' && !pathParameters.id) {
      return await createTimeBlock(userId, event.body);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updateTimeBlock(userId, pathParameters.id, event.body);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await deleteTimeBlock(userId, pathParameters.id);
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
 * GET /time-blocks - List time blocks with filtering
 * Query params: startDate, endDate, type, limit
 */
async function listTimeBlocks(userId, queryParams) {
  const startDate = queryParams.startDate;
  const endDate = queryParams.endDate;
  const type = queryParams.type;
  const limit = Number.parseInt(queryParams.limit, 10) || 100;
  
  console.log(`Listing time blocks for user ${userId}`);
  console.log(`Filters - startDate: ${startDate}, endDate: ${endDate}, type: ${type}`);
  
  try {
    let timeBlocks = [];
    
    // Query by date range if provided
    if (startDate) {
      const command = new QueryCommand({
        TableName: process.env.TIMEBLOCKS_TABLE,
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
      timeBlocks = result.Items || [];
      
      // Filter by end date if provided
      if (endDate) {
        timeBlocks = timeBlocks.filter(block => block.date <= endDate);
      }
    }
    // Otherwise, query all time blocks for this user
    else {
      const command = new QueryCommand({
        TableName: process.env.TIMEBLOCKS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: limit
      });
      
      const result = await docClient.send(command);
      timeBlocks = result.Items || [];
    }
    
    // Apply type filter if provided
    if (type) {
      timeBlocks = timeBlocks.filter(block => block.type === type);
    }
    
    // Sort by date and start time
    timeBlocks.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
    
    console.log(`Returning ${timeBlocks.length} time blocks`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeBlocks,
        total: timeBlocks.length
      })
    };
    
  } catch (error) {
    console.error('Error listing time blocks:', error);
    throw error;
  }
}

/**
 * GET /time-blocks/{id} - Get time block details
 */
async function getTimeBlock(userId, timeBlockId) {
  console.log(`Getting time block ${timeBlockId} for user ${userId}`);
  
  try {
    const command = new GetCommand({
      TableName: process.env.TIMEBLOCKS_TABLE,
      Key: { id: timeBlockId, userId }
    });
    
    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Time block not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Item)
    };
    
  } catch (error) {
    console.error('Error getting time block:', error);
    throw error;
  }
}

/**
 * POST /time-blocks - Create time block
 */
async function createTimeBlock(userId, body) {
  console.log(`Creating time block for user ${userId}`);
  
  try {
    const data = JSON.parse(body);
    
    // Validate required fields
    const validationErrors = validateTimeBlockData(data);
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
    
    // Check for conflicts with existing appointments
    const conflictCheck = await checkTimeBlockConflictsWithAppointments(
      userId, 
      data.date, 
      data.startTime, 
      data.endTime
    );
    
    if (conflictCheck.hasConflict) {
      return {
        statusCode: 409,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Time block conflicts with existing appointment',
          message: 'Cannot create time block that overlaps with scheduled appointments',
          conflict: conflictCheck.conflictDetails
        })
      };
    }
    
    const now = new Date().toISOString();
    
    // Create time block record
    const timeBlock = {
      id: randomUUID(),
      userId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      type: data.type || 'other',
      recurrence: data.recurrence || null,
      createdAt: now,
      createdBy: userId
    };
    
    const command = new PutCommand({
      TableName: process.env.TIMEBLOCKS_TABLE,
      Item: timeBlock
    });
    
    await docClient.send(command);
    
    console.log(`Time block created successfully: ${timeBlock.id}`);
    
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(timeBlock)
    };
    
  } catch (error) {
    console.error('Error creating time block:', error);
    throw error;
  }
}

/**
 * PUT /time-blocks/{id} - Update time block
 */
async function updateTimeBlock(userId, timeBlockId, body) {
  console.log(`Updating time block ${timeBlockId} for user ${userId}`);
  
  try {
    const data = JSON.parse(body);
    
    // Validate data
    const validationErrors = validateTimeBlockData(data, true);
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
    
    // Check if time block exists
    const getCommand = new GetCommand({
      TableName: process.env.TIMEBLOCKS_TABLE,
      Key: { id: timeBlockId, userId }
    });
    
    const existingTimeBlock = await docClient.send(getCommand);
    if (!existingTimeBlock.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Time block not found' })
      };
    }
    
    const timeBlock = existingTimeBlock.Item;
    
    // If date or time changed, check for conflicts
    if ((data.date && data.date !== timeBlock.date) || 
        (data.startTime && data.startTime !== timeBlock.startTime) ||
        (data.endTime && data.endTime !== timeBlock.endTime)) {
      
      const newDate = data.date || timeBlock.date;
      const newStartTime = data.startTime || timeBlock.startTime;
      const newEndTime = data.endTime || timeBlock.endTime;
      
      const conflictCheck = await checkTimeBlockConflictsWithAppointments(
        userId, 
        newDate, 
        newStartTime, 
        newEndTime,
        timeBlockId
      );
      
      if (conflictCheck.hasConflict) {
        return {
          statusCode: 409,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Time block conflicts with existing appointment',
            message: 'Cannot update time block to overlap with scheduled appointments',
            conflict: conflictCheck.conflictDetails
          })
        };
      }
    }
    
    // Build dynamic update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    // Update allowed fields
    const allowedFields = ['date', 'startTime', 'endTime', 'reason', 'type', 'recurrence'];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = data[field];
      }
    });
    
    if (updateExpressions.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No fields to update' })
      };
    }
    
    const updateCommand = new UpdateCommand({
      TableName: process.env.TIMEBLOCKS_TABLE,
      Key: { id: timeBlockId, userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const result = await docClient.send(updateCommand);
    
    console.log(`Time block updated successfully: ${timeBlockId}`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Attributes)
    };
    
  } catch (error) {
    console.error('Error updating time block:', error);
    throw error;
  }
}

/**
 * DELETE /time-blocks/{id} - Delete time block
 */
async function deleteTimeBlock(userId, timeBlockId) {
  console.log(`Deleting time block ${timeBlockId} for user ${userId}`);
  
  try {
    // Check if time block exists
    const getCommand = new GetCommand({
      TableName: process.env.TIMEBLOCKS_TABLE,
      Key: { id: timeBlockId, userId }
    });
    
    const existingTimeBlock = await docClient.send(getCommand);
    if (!existingTimeBlock.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Time block not found' })
      };
    }
    
    // Delete the time block
    const deleteCommand = new DeleteCommand({
      TableName: process.env.TIMEBLOCKS_TABLE,
      Key: { id: timeBlockId, userId }
    });
    
    await docClient.send(deleteCommand);
    
    console.log(`Time block deleted successfully: ${timeBlockId}`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        message: 'Time block deleted successfully'
      })
    };
    
  } catch (error) {
    console.error('Error deleting time block:', error);
    throw error;
  }
}
