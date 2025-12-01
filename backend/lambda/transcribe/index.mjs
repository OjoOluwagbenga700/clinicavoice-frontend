import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only clinicians can access transcriptions' })
      };
    }
    
    // Use httpMethod for REST API (not http.method)
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    
    // GET /transcribe - List user's transcriptions
    if (method === 'GET' && !pathParameters.id) {
      const command = new QueryCommand({
        TableName: process.env.REPORTS_TABLE,
        IndexName: 'TypeIndex',
        KeyConditionExpression: '#type = :type AND userId = :userId',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { 
          ':type': 'transcription',
          ':userId': userId 
        },
        ScanIndexForward: false // Most recent first
      });
      
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Items || [])
      };
    }
    
    // GET /transcribe/{id} - Get specific transcription
    if (method === 'GET' && pathParameters.id) {
      const command = new GetCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { id: pathParameters.id, userId: userId }
      });
      
      const result = await docClient.send(command);
      if (!result.Item || result.Item.type !== 'transcription') {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Transcription not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Item)
      };
    }
    
    // POST /transcribe/{id} - Check transcription status for a specific file
    if (method === 'POST' && pathParameters.id) {
      const fileId = pathParameters.id;
      
      console.log(`Checking transcription status for fileId: ${fileId}, userId: ${userId}`);
      
      // Get transcription record directly by primary key (id = fileId, userId = userId)
      const command = new GetCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { 
          id: fileId, 
          userId: userId 
        }
      });
      
      const result = await docClient.send(command);
      
      console.log(`DynamoDB query result:`, JSON.stringify(result, null, 2));
      
      if (result.Item) {
        console.log(`Found item with type: ${result.Item.type}, status: ${result.Item.status}`);
        
        if (result.Item.type === 'transcription') {
          const transcription = result.Item;
          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: transcription.status || 'processing',
              transcript: transcription.transcript,
              fileId: fileId,
              id: transcription.id,
              jobName: transcription.jobName,
              updatedAt: transcription.updatedAt,
              medicalAnalysis: transcription.medicalAnalysis || null
            })
          };
        }
      }
      
      console.log(`No transcription record found for fileId: ${fileId}`);
      
      // If not found, return processing status (transcription may still be in progress)
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'processing',
          fileId: fileId,
          message: 'Transcription is being processed'
        })
      };
    }
    
    // POST /transcribe - Start transcription (now just returns upload URL)
    if (method === 'POST' && !pathParameters.id) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Upload your file to S3. Transcription will start automatically.',
          status: 'upload_ready'
        })
      };
    }
    
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Server error' })
    };
  }
};