import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Reports Lambda invoked:', JSON.stringify(event, null, 2));
  
  const userId = event.requestContext.authorizer.claims.sub;
  const userType = event.requestContext.authorizer.claims['custom:user_type'];
  const method = event.httpMethod; // REST API uses httpMethod, not requestContext.http.method
  const pathParameters = event.pathParameters || {};
  
  console.log(`Method: ${method}, User: ${userId}, Type: ${userType}, Path params:`, pathParameters);
  
  try {
    // GET /reports - List all reports
    if (method === 'GET' && !pathParameters.id) {
      const command = new QueryCommand({
        TableName: process.env.REPORTS_TABLE,
        IndexName: userType === 'patient' ? 'PatientIdIndex' : 'UserIdIndex',
        KeyConditionExpression: userType === 'patient' ? 'patientId = :id' : 'userId = :id',
        ExpressionAttributeValues: { ':id': userId }
      });
      
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Items || [])
      };
    }
    
    // GET /reports/{id} - Get specific report
    if (method === 'GET' && pathParameters.id) {
      const command = new GetCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { id: pathParameters.id, userId }
      });
      
      const result = await docClient.send(command);
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Report not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Item)
      };
    }
    
    // POST /reports - Create new report
    if (method === 'POST') {
      if (userType !== 'clinician') {
        return {
          statusCode: 403,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Only clinicians can create reports' })
        };
      }
      
      const body = JSON.parse(event.body);
      const report = {
        id: randomUUID(),
        userId,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const command = new PutCommand({
        TableName: process.env.REPORTS_TABLE,
        Item: report
      });
      
      await docClient.send(command);
      return {
        statusCode: 201,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      };
    }
    
    // PUT /reports/{id} - Update report
    if (method === 'PUT' && pathParameters.id) {
      if (userType !== 'clinician') {
        return {
          statusCode: 403,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Only clinicians can update reports' })
        };
      }
      
      const body = JSON.parse(event.body);
      
      // Build dynamic update expression to only update provided fields
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {
        ':updatedAt': new Date().toISOString()
      };
      
      if (body.summary !== undefined) {
        updateExpressions.push('#summary = :summary');
        expressionAttributeNames['#summary'] = 'summary';
        expressionAttributeValues[':summary'] = body.summary;
      }
      
      if (body.content !== undefined) {
        updateExpressions.push('#content = :content');
        expressionAttributeNames['#content'] = 'content';
        expressionAttributeValues[':content'] = body.content;
      }
      
      if (body.transcript !== undefined) {
        updateExpressions.push('transcript = :transcript');
        expressionAttributeValues[':transcript'] = body.transcript;
      }
      
      if (body.status !== undefined) {
        updateExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = body.status;
      }
      
      if (body.patientName !== undefined) {
        updateExpressions.push('patientName = :patientName');
        expressionAttributeValues[':patientName'] = body.patientName;
      }
      
      updateExpressions.push('updatedAt = :updatedAt');
      
      const command = new UpdateCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { id: pathParameters.id, userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });
      
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Attributes)
      };
    }
    
    // DELETE /reports/{id} - Delete report
    if (method === 'DELETE' && pathParameters.id) {
      if (userType !== 'clinician') {
        return {
          statusCode: 403,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Only clinicians can delete reports' })
        };
      }
      
      const command = new DeleteCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { id: pathParameters.id, userId }
      });
      
      await docClient.send(command);
      return {
        statusCode: 204,
        headers: { 'Access-Control-Allow-Origin': '*' }
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
      body: JSON.stringify({ error: 'Internal server error' })
    };
      }
};

