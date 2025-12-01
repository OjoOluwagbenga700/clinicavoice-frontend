import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler = async (event) => {
  console.log('S3 Event received:', JSON.stringify(event, null, 2));
  
  try {
    // Process each S3 record (transcript JSON file created)
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Processing transcript file: ${key} from bucket: ${bucket}`);
      
      // Extract job name from key (transcripts/{jobName}.json)
      const fileName = key.split('/').pop();
      const jobName = fileName.replace('.json', '');
      
      console.log(`Job name: ${jobName}`);
      
      // Get transcript from S3
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      const response = await s3Client.send(getCommand);
      const transcriptData = JSON.parse(await response.Body.transformToString());
      
      // Check if transcription was successful
      if (transcriptData.status === 'FAILED') {
        console.error(`Transcription failed for job: ${jobName}`);
        
        // Find and update the DynamoDB record
        const queryCommand = new QueryCommand({
          TableName: process.env.REPORTS_TABLE,
          IndexName: 'TypeIndex',
          KeyConditionExpression: '#type = :type',
          FilterExpression: 'jobName = :jobName',
          ExpressionAttributeNames: { '#type': 'type' },
          ExpressionAttributeValues: {
            ':type': 'transcription',
            ':jobName': jobName
          }
        });
        
        const queryResult = await docClient.send(queryCommand);
        
        if (queryResult.Items && queryResult.Items.length > 0) {
          const item = queryResult.Items[0];
          
          await docClient.send(new UpdateCommand({
            TableName: process.env.REPORTS_TABLE,
            Key: { 
              id: item.id, 
              userId: item.userId 
            },
            UpdateExpression: 'SET #status = :status, errorMessage = :errorMessage, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'failed',
              ':errorMessage': 'Transcription failed',
              ':updatedAt': new Date().toISOString()
            }
          }));
        }
        
        continue;
      }
      
      // Extract transcript text
      const transcript = transcriptData.results.transcripts[0].transcript;
      
      console.log(`Retrieved transcript for job: ${jobName}`);
      
      // Find the DynamoDB record by jobName
      console.log(`Querying DynamoDB for jobName: ${jobName}`);
      
      const queryCommand = new QueryCommand({
        TableName: process.env.REPORTS_TABLE,
        IndexName: 'TypeIndex',
        KeyConditionExpression: '#type = :type',
        FilterExpression: 'jobName = :jobName',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: {
          ':type': 'transcription',
          ':jobName': jobName
        }
      });
      
      const queryResult = await docClient.send(queryCommand);
      
      console.log(`Query returned ${queryResult.Items?.length || 0} items`);
      
      if (queryResult.Items && queryResult.Items.length > 0) {
        const item = queryResult.Items[0];
        
        console.log(`Found record - id: ${item.id}, userId: ${item.userId}, current status: ${item.status}`);
        
        // Update the record with completed status and transcript
        await docClient.send(new UpdateCommand({
          TableName: process.env.REPORTS_TABLE,
          Key: { 
            id: item.id, 
            userId: item.userId 
          },
          UpdateExpression: 'SET #status = :status, transcript = :transcript, transcriptKey = :transcriptKey, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'completed',
            ':transcript': transcript,
            ':transcriptKey': key,
            ':updatedAt': new Date().toISOString()
          }
        }));
        
        console.log(`✅ Successfully updated DynamoDB record for job: ${jobName} to completed status`);
        console.log(`   - id: ${item.id}`);
        console.log(`   - userId: ${item.userId}`);
        console.log(`   - transcript length: ${transcript.length} characters`);
        
        // Invoke comprehend-medical Lambda for medical entity extraction
        try {
          console.log(`🏥 Invoking comprehend-medical Lambda for medical analysis...`);
          
          const invokeCommand = new InvokeCommand({
            FunctionName: process.env.COMPREHEND_MEDICAL_FUNCTION,
            InvocationType: 'Event', // Async invocation
            Payload: JSON.stringify({
              transcriptionId: item.id,
              userId: item.userId,
              transcript: transcript,
              s3Key: key
            })
          });
          
          await lambdaClient.send(invokeCommand);
          console.log(`✅ Comprehend-medical Lambda invoked successfully with userId: ${item.userId}`);
        } catch (comprehendError) {
          console.error(`⚠️  Failed to invoke comprehend-medical Lambda:`, comprehendError);
          // Don't fail the whole process if comprehend fails
        }
      } else {
        console.error(`❌ No DynamoDB record found for job: ${jobName}`);
        console.error(`   This means the transcribe-processor didn't create/update the record properly`);
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Transcription completion processed successfully' })
    };
  } catch (error) {
    console.error('Error processing transcription completion:', error);
    throw error;
  }
};
