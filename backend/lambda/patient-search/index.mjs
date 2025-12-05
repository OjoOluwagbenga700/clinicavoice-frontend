import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Calculate relevance score for search results
 * Higher score = better match
 */
function calculateRelevanceScore(patient, query) {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Exact MRN match gets highest score
  if (patient.mrn && patient.mrn.toLowerCase() === queryLower) {
    score += 100;
  } else if (patient.mrn && patient.mrn.toLowerCase().includes(queryLower)) {
    score += 50;
  }
  
  // Full name exact match
  const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
  if (fullName === queryLower) {
    score += 90;
  } else if (fullName.includes(queryLower)) {
    score += 40;
  }
  
  // First name match
  if (patient.firstName && patient.firstName.toLowerCase() === queryLower) {
    score += 80;
  } else if (patient.firstName && patient.firstName.toLowerCase().startsWith(queryLower)) {
    score += 35;
  } else if (patient.firstName && patient.firstName.toLowerCase().includes(queryLower)) {
    score += 20;
  }
  
  // Last name match
  if (patient.lastName && patient.lastName.toLowerCase() === queryLower) {
    score += 80;
  } else if (patient.lastName && patient.lastName.toLowerCase().startsWith(queryLower)) {
    score += 35;
  } else if (patient.lastName && patient.lastName.toLowerCase().includes(queryLower)) {
    score += 20;
  }
  
  // Phone match
  if (patient.phone && patient.phone.includes(query)) {
    score += 70;
  }
  
  // Email match
  if (patient.email && patient.email.toLowerCase().includes(queryLower)) {
    score += 60;
  }
  
  return score;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get last visit date for a patient
 * TODO: This will query the appointments table once it's implemented
 */
async function getLastVisitDate(patientId) {
  // Placeholder - will be implemented when appointments are available
  return null;
}

/**
 * Patient Search Lambda Handler
 * POST /patients/search
 * Body: { query, fields: ['name', 'mrn', 'phone', 'email'] }
 */
export const handler = async (event) => {
  console.log('Patient Search Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    
    console.log(`User: ${userId}, Type: ${userType}`);
    
    // Authorization check - only clinicians can search patients
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized. Only clinicians can search patients.' })
      };
    }
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const query = body.query || '';
    const fields = body.fields || ['name', 'mrn', 'phone', 'email'];
    
    // Validate query
    if (!query || query.trim() === '') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Query parameter is required',
          message: 'Please provide a search query'
        })
      };
    }
    
    console.log(`Searching for: "${query}" in fields: ${fields.join(', ')}`);
    
    // Query all active patients for this user
    // We'll filter in-memory since DynamoDB doesn't support full-text search
    const command = new QueryCommand({
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
    
    const result = await docClient.send(command);
    let patients = result.Items || [];
    
    console.log(`Found ${patients.length} active patients`);
    
    // Filter patients based on search query and fields
    const queryLower = query.toLowerCase();
    const matchedPatients = patients.filter(patient => {
      // Check each requested field
      if (fields.includes('name')) {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        if (fullName.includes(queryLower)) return true;
      }
      
      if (fields.includes('mrn')) {
        if (patient.mrn && patient.mrn.toLowerCase().includes(queryLower)) return true;
      }
      
      if (fields.includes('phone')) {
        if (patient.phone && patient.phone.includes(query)) return true;
      }
      
      if (fields.includes('email')) {
        if (patient.email && patient.email.toLowerCase().includes(queryLower)) return true;
      }
      
      return false;
    });
    
    console.log(`Matched ${matchedPatients.length} patients`);
    
    // Calculate relevance scores
    const scoredPatients = matchedPatients.map(patient => ({
      ...patient,
      relevanceScore: calculateRelevanceScore(patient, query)
    }));
    
    // Sort by relevance score (highest first), then by last visit date, then by last name
    scoredPatients.sort((a, b) => {
      // Primary sort: relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort: last visit date (most recent first)
      // TODO: Implement when appointments are available
      
      // Tertiary sort: last name alphabetically
      const lastNameA = (a.lastName || '').toLowerCase();
      const lastNameB = (b.lastName || '').toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });
    
    // Enhance results with computed fields
    const enhancedResults = await Promise.all(
      scoredPatients.map(async (patient) => {
        const age = calculateAge(patient.dateOfBirth);
        const lastVisitDate = await getLastVisitDate(patient.id);
        
        return {
          id: patient.id,
          mrn: patient.mrn,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          age,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          lastVisitDate,
          status: patient.status,
          relevanceScore: patient.relevanceScore
        };
      })
    );
    
    console.log(`Returning ${enhancedResults.length} search results`);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        results: enhancedResults,
        total: enhancedResults.length,
        query: query
      })
    };
    
  } catch (error) {
    console.error('Error searching patients:', error);
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
