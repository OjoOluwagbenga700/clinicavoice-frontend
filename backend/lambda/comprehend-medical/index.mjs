import { ComprehendMedicalClient, DetectEntitiesV2Command, DetectPHICommand } from '@aws-sdk/client-comprehendmedical';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const comprehendClient = new ComprehendMedicalClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  console.log('Comprehend Medical event received:', JSON.stringify(event, null, 2));
  
  try {
    // This function can be invoked directly or via S3 event
    let transcriptionId, transcript, userId;
    
    if (event.transcriptionId && event.transcript && event.userId) {
      // Direct invocation from transcribe-completion Lambda (preferred)
      transcriptionId = event.transcriptionId;
      transcript = event.transcript;
      userId = event.userId;
      console.log(`Direct invocation: transcriptionId=${transcriptionId}, userId=${userId}`);
    } else if (event.Records && event.Records[0].s3) {
      // Triggered by S3 event (fallback - won't have userId)
      const bucket = event.Records[0].s3.bucket.name;
      const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Processing transcription file: ${key} from bucket: ${bucket}`);
      
      // Extract transcription ID from filename (transcripts/transcription-{timestamp}-{id}.json)
      const fileName = key.split('/').pop();
      const matches = fileName.match(/transcription-\d+-(.+)\.json$/);
      transcriptionId = matches ? matches[1] : null;
      
      if (!transcriptionId) {
        throw new Error(`Could not extract transcription ID from filename: ${fileName}`);
      }
      
      // Download and parse the transcription JSON from S3
      const s3Client = new S3Client({});
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      const s3Response = await s3Client.send(getObjectCommand);
      const transcriptionData = JSON.parse(await s3Response.Body.transformToString());
      
      // Extract transcript text from AWS Transcribe output format
      transcript = transcriptionData.results?.transcripts?.[0]?.transcript;
      
      if (!transcript) {
        throw new Error('No transcript text found in transcription file');
      }
      
      // Need to query DynamoDB to get userId
      userId = null; // Will query below
    } else {
      throw new Error('Invalid event format');
    }
    
    if (!transcript) {
      throw new Error('No transcript available for medical analysis');
    }
    
    console.log(`Analyzing transcript for ID: ${transcriptionId}`);
    
    // Detect medical entities
    const entitiesCommand = new DetectEntitiesV2Command({
      Text: transcript
    });
    
    const entitiesResult = await comprehendClient.send(entitiesCommand);
    
    // Detect PHI (Protected Health Information)
    const phiCommand = new DetectPHICommand({
      Text: transcript
    });
    
    const phiResult = await comprehendClient.send(phiCommand);
    
    // Process and categorize medical entities
    const medicalAnalysis = {
      entities: entitiesResult.Entities.map(entity => ({
        text: entity.Text,
        category: entity.Category,
        type: entity.Type,
        confidence: entity.Score,
        beginOffset: entity.BeginOffset,
        endOffset: entity.EndOffset
      })),
      phi: phiResult.Entities.map(phi => ({
        text: phi.Text,
        category: phi.Category,
        type: phi.Type,
        confidence: phi.Score,
        beginOffset: phi.BeginOffset,
        endOffset: phi.EndOffset
      })),
      summary: {
        totalEntities: entitiesResult.Entities.length,
        totalPHI: phiResult.Entities.length,
        categories: [...new Set(entitiesResult.Entities.map(e => e.Category))],
        analyzedAt: new Date().toISOString()
      }
    };
    
    // If userId not provided, query DynamoDB to find it
    if (!userId) {
      console.log(`Querying DynamoDB to find userId for transcriptionId: ${transcriptionId}`);
      const queryCommand = new QueryCommand({
        TableName: process.env.REPORTS_TABLE,
        IndexName: 'TypeIndex',
        KeyConditionExpression: '#type = :type',
        FilterExpression: 'id = :id',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: {
          ':type': 'transcription',
          ':id': transcriptionId
        },
        Limit: 1
      });
      
      const queryResult = await docClient.send(queryCommand);
      if (queryResult.Items && queryResult.Items.length > 0) {
        userId = queryResult.Items[0].userId;
        console.log(`Found userId: ${userId}`);
      } else {
        throw new Error(`Could not find transcription record for ID: ${transcriptionId}`);
      }
    }
    
    // Update transcription record with medical analysis
    await docClient.send(new UpdateCommand({
      TableName: process.env.REPORTS_TABLE,
      Key: { id: transcriptionId, userId: userId },
      UpdateExpression: 'SET medicalAnalysis = :analysis, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':analysis': medicalAnalysis,
        ':updatedAt': new Date().toISOString()
      }
    }));
    
    console.log(`✅ Medical analysis completed for transcription: ${transcriptionId}, userId: ${userId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        transcriptionId,
        medicalAnalysis: medicalAnalysis.summary
      })
    };
  } catch (error) {
    console.error('Error in medical analysis:', error);
    throw error;
  }
};