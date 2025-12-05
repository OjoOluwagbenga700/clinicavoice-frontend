import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Unified Dashboard Lambda Function
 * Handles all dashboard endpoints: /stats, /activity, /recent-notes
 */
export const handler = async (event) => {
  console.log('Dashboard Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    
    console.log(`User: ${userId}, Type: ${userType}`);
    
    // Authorization check
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // Extract endpoint from path (REST API uses event.path)
    const path = event.path;
    const endpoint = path.split('/').pop(); // Gets 'stats', 'activity', or 'recent-notes'
    
    console.log(`Dashboard endpoint: ${endpoint} for user: ${userId}, full path: ${path}`);
    
    // Route to appropriate handler
    switch (endpoint) {
      case 'stats':
        return await handleStats(userId);
      case 'activity':
        return await handleActivity(userId);
      case 'recent-notes':
        return await handleRecentNotes(userId);
      default:
        console.error(`Unknown endpoint: ${endpoint}`);
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Invalid dashboard endpoint: ${endpoint}` })
        };
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

/**
 * Handle /dashboard/stats endpoint
 * Returns: activePatients, recentTranscriptions, pendingReviews, 
 *          totalActivePatients, newPatientsThisMonth, patientsNeedingFollowup
 */
async function handleStats(userId) {
  // Fetch reports for transcription stats
  const reportsCommand = new QueryCommand({
    TableName: process.env.REPORTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  });
  
  const reportsResult = await docClient.send(reportsCommand);
  const reports = reportsResult.Items || [];
  
  // Calculate transcription statistics
  const activePatients = new Set(reports.map(r => r.patientId)).size;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTranscriptions = reports.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;
  
  const pendingReviews = reports.filter(r => r.status === 'pending' || r.status === 'draft').length;
  
  // Fetch patient statistics (Requirement 18.3)
  let totalActivePatients = 0;
  let newPatientsThisMonth = 0;
  let patientsNeedingFollowup = 0;
  
  try {
    // Query all active patients for this clinician
    const patientsCommand = new QueryCommand({
      TableName: process.env.PATIENTS_TABLE,
      IndexName: 'status-index',
      KeyConditionExpression: 'userId = :userId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':status': 'active'
      }
    });
    
    const patientsResult = await docClient.send(patientsCommand);
    const patients = patientsResult.Items || [];
    
    totalActivePatients = patients.length;
    
    // Calculate new patients this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    newPatientsThisMonth = patients.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= startOfMonth;
    }).length;
    
    // Calculate patients needing follow-up (no visit in last 6 months)
    // Need to check appointments for each patient
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Query all appointments for this clinician
    const appointmentsCommand = new QueryCommand({
      TableName: process.env.APPOINTMENTS_TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });
    
    const appointmentsResult = await docClient.send(appointmentsCommand);
    const appointments = appointmentsResult.Items || [];
    
    // Group appointments by patient and find last completed appointment
    const patientLastVisit = {};
    appointments.forEach(apt => {
      if (apt.status === 'completed') {
        const aptDate = new Date(apt.date);
        if (!patientLastVisit[apt.patientId] || aptDate > patientLastVisit[apt.patientId]) {
          patientLastVisit[apt.patientId] = aptDate;
        }
      }
    });
    
    // Count patients who haven't had a visit in 6+ months
    patientsNeedingFollowup = patients.filter(p => {
      const lastVisit = patientLastVisit[p.id];
      return !lastVisit || lastVisit < sixMonthsAgo;
    }).length;
    
  } catch (error) {
    console.error('Error fetching patient statistics:', error);
    // Continue with default values if patient stats fail
  }
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      activePatients, 
      recentTranscriptions, 
      pendingReviews,
      totalActivePatients,
      newPatientsThisMonth,
      patientsNeedingFollowup
    })
  };
}

/**
 * Handle /dashboard/activity endpoint
 * Returns: Array of {date, transcriptions} for last 30 days
 */
async function handleActivity(userId) {
  const command = new QueryCommand({
    TableName: process.env.REPORTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  });
  
  const result = await docClient.send(command);
  const reports = result.Items || [];
  
  // Group by date for last 30 days
  const activityMap = {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  reports.forEach(report => {
    const date = new Date(report.createdAt);
    if (date >= thirtyDaysAgo) {
      const dateStr = date.toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    }
  });
  
  // Convert to array format and sort by date
  const activityData = Object.entries(activityMap)
    .map(([date, transcriptions]) => ({ date, transcriptions }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData)
  };
}

/**
 * Handle /dashboard/recent-notes endpoint
 * Returns: Array of recent reports (last 10)
 */
async function handleRecentNotes(userId) {
  const command = new QueryCommand({
    TableName: process.env.REPORTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    Limit: 10,
    ScanIndexForward: false // Most recent first
  });
  
  const result = await docClient.send(command);
  const reports = result.Items || [];
  
  // Format for frontend
  const recentNotes = reports.map(report => ({
    id: report.id,
    patient: report.patientName || 'Unknown Patient',
    status: report.status || 'draft',
    date: report.createdAt
  }));
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify(recentNotes)
  };
}