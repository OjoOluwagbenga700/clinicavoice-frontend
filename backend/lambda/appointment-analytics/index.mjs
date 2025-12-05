import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Appointment Analytics Lambda Handler
 * Provides analytics data for appointments
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */
export const handler = async (event) => {
  console.log('Appointment Analytics Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    const queryParameters = event.queryStringParameters || {};
    
    console.log(`User: ${userId}, Type: ${userType}`);
    
    // Only clinicians can access analytics
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized. Only clinicians can access analytics.' })
      };
    }
    
    return await getAnalytics(userId, queryParameters);
    
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
 * GET /appointments/analytics - Get appointment analytics
 * Query params: startDate, endDate, type, status
 */
async function getAnalytics(userId, queryParams) {
  const startDate = queryParams.startDate;
  const endDate = queryParams.endDate;
  const filterType = queryParams.type;
  const filterStatus = queryParams.status;
  
  console.log(`Getting analytics for user ${userId}`);
  console.log(`Filters - startDate: ${startDate}, endDate: ${endDate}, type: ${filterType}, status: ${filterStatus}`);
  
  try {
    let appointments = [];
    
    // Query appointments by date range if provided
    if (startDate) {
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
        }
      });
      
      const result = await docClient.send(command);
      appointments = result.Items || [];
      
      // Filter by end date if provided
      if (endDate) {
        appointments = appointments.filter(apt => apt.date <= endDate);
      }
    } else {
      // Query all appointments for this user
      const command = new QueryCommand({
        TableName: process.env.APPOINTMENTS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      });
      
      const result = await docClient.send(command);
      appointments = result.Items || [];
    }
    
    // Apply additional filters (Requirement 20.5)
    if (filterType) {
      const types = filterType.split(',');
      appointments = appointments.filter(apt => types.includes(apt.type));
    }
    
    if (filterStatus) {
      const statuses = filterStatus.split(',');
      appointments = appointments.filter(apt => statuses.includes(apt.status));
    }
    
    // Calculate analytics
    const analytics = calculateAnalytics(appointments);
    
    console.log(`Returning analytics for ${appointments.length} appointments`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(analytics)
    };
    
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
}

/**
 * Calculate analytics from appointments data
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */
function calculateAnalytics(appointments) {
  // Requirement 20.1: Appointment counts by status
  const statusCounts = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    'no-show': 0
  };
  
  appointments.forEach(apt => {
    if (statusCounts.hasOwnProperty(apt.status)) {
      statusCounts[apt.status]++;
    }
  });
  
  // Total scheduled appointments (not cancelled)
  const totalScheduled = statusCounts.scheduled + statusCounts.confirmed + 
                         statusCounts.completed + statusCounts['no-show'];
  
  // Requirement 20.2: No-show and cancellation rates
  const noShowRate = totalScheduled > 0 
    ? (statusCounts['no-show'] / totalScheduled) * 100 
    : 0;
  
  const cancellationRate = appointments.length > 0
    ? (statusCounts.cancelled / appointments.length) * 100
    : 0;
  
  // Requirement 20.3: Average duration by type
  const durationByType = {
    consultation: { total: 0, count: 0 },
    'follow-up': { total: 0, count: 0 },
    procedure: { total: 0, count: 0 },
    urgent: { total: 0, count: 0 }
  };
  
  appointments.forEach(apt => {
    if (durationByType[apt.type]) {
      durationByType[apt.type].total += apt.duration;
      durationByType[apt.type].count++;
    }
  });
  
  const averageDurationByType = {};
  Object.keys(durationByType).forEach(type => {
    const data = durationByType[type];
    averageDurationByType[type] = data.count > 0 
      ? Math.round(data.total / data.count) 
      : 0;
  });
  
  // Requirement 20.4: Patient volume trends
  // Group appointments by date
  const volumeByDate = {};
  appointments.forEach(apt => {
    if (!volumeByDate[apt.date]) {
      volumeByDate[apt.date] = 0;
    }
    // Only count completed appointments for volume
    if (apt.status === 'completed') {
      volumeByDate[apt.date]++;
    }
  });
  
  // Convert to array and sort by date
  const patientVolumeTrends = Object.entries(volumeByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Group by week for weekly trends
  const volumeByWeek = {};
  appointments.forEach(apt => {
    if (apt.status === 'completed') {
      const date = new Date(apt.date);
      // Get the Monday of the week
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];
      
      if (!volumeByWeek[weekKey]) {
        volumeByWeek[weekKey] = 0;
      }
      volumeByWeek[weekKey]++;
    }
  });
  
  const weeklyVolumeTrends = Object.entries(volumeByWeek)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
  
  // Group by month for monthly trends
  const volumeByMonth = {};
  appointments.forEach(apt => {
    if (apt.status === 'completed') {
      const monthKey = apt.date.substring(0, 7); // YYYY-MM
      if (!volumeByMonth[monthKey]) {
        volumeByMonth[monthKey] = 0;
      }
      volumeByMonth[monthKey]++;
    }
  });
  
  const monthlyVolumeTrends = Object.entries(volumeByMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  // Additional useful metrics
  const totalAppointments = appointments.length;
  const completedAppointments = statusCounts.completed;
  const completionRate = totalScheduled > 0
    ? (completedAppointments / totalScheduled) * 100
    : 0;
  
  // Average appointments per day (for days with appointments)
  const daysWithAppointments = Object.keys(volumeByDate).length;
  const avgAppointmentsPerDay = daysWithAppointments > 0
    ? totalAppointments / daysWithAppointments
    : 0;
  
  return {
    // Requirement 20.1: Appointment counts by status
    statusCounts,
    
    // Requirement 20.2: No-show and cancellation rates
    noShowRate: Math.round(noShowRate * 100) / 100, // Round to 2 decimal places
    cancellationRate: Math.round(cancellationRate * 100) / 100,
    
    // Requirement 20.3: Average duration by type
    averageDurationByType,
    
    // Requirement 20.4: Patient volume trends
    patientVolumeTrends: {
      daily: patientVolumeTrends,
      weekly: weeklyVolumeTrends,
      monthly: monthlyVolumeTrends
    },
    
    // Additional metrics
    summary: {
      totalAppointments,
      totalScheduled,
      completedAppointments,
      completionRate: Math.round(completionRate * 100) / 100,
      avgAppointmentsPerDay: Math.round(avgAppointmentsPerDay * 100) / 100
    }
  };
}
