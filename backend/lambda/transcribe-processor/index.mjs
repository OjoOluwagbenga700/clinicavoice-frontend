import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  console.log('S3 Event received:', JSON.stringify(event, null, 2));
  
  try {
    // Process each S3 record
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Processing file: ${key} from bucket: ${bucket}`);
      
      // Extract userId and fileId from S3 key
      // Format: audio/{userId}/{timestamp}_{fileId}.{extension}
      const pathParts = key.split('/');
      if (pathParts.length < 3) {
        console.error('Invalid S3 key format:', key);
        continue;
      }
      
      const userId = pathParts[1]; // Extract userId from path
      const fileName = pathParts[2];
      const fileNameParts = fileName.split('_');
      
      // Extract fileId (format: timestamp_fileId.extension)
      if (fileNameParts.length < 2) {
        console.error('Invalid file name format:', fileName);
        continue;
      }
      
      const fileIdWithExt = fileNameParts[1]; // Get fileId.extension
      const fileId = fileIdWithExt.split('.')[0]; // Remove extension
      
      console.log(`Extracted userId: ${userId}, fileId: ${fileId}`);
      
      // Create job name
      const jobName = `transcription-${Date.now()}-${fileId}`;
      
      // Determine media format from file extension
      const extension = key.split('.').pop().toLowerCase();
      const formatMap = {
        'webm': 'webm',
        'mp3': 'mp3',
        'mp4': 'mp4',
        'm4a': 'mp4',
        'wav': 'wav',
        'mpeg': 'mp3'
      };
      const mediaFormat = formatMap[extension] || 'mp3';
      
      console.log(`Using media format: ${mediaFormat} for extension: ${extension}`);
      
      // Update existing record in reports table (created by upload function)
      await docClient.send(new UpdateCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { id: fileId, userId: userId },
        UpdateExpression: 'SET jobName = :jobName, #status = :status, updatedAt = :updatedAt, fileId = :fileId',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':jobName': jobName,
          ':status': 'processing',
          ':updatedAt': new Date().toISOString(),
          ':fileId': fileId
        }
      }));
      
      console.log(`Updated DynamoDB record for fileId: ${fileId}`);
      
      // Start AWS Transcribe job
      const startCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: 'en-US',
        MediaFormat: mediaFormat,
        Media: {
          MediaFileUri: `s3://${bucket}/${key}`
        },
        OutputBucketName: bucket,
        OutputKey: `transcripts/${jobName}.json`,
        Settings: {
          ShowSpeakerLabels: true,
          MaxSpeakerLabels: 4
        }
      });
      
      await transcribeClient.send(startCommand);
      
      console.log(`Started transcription job: ${jobName} for file: ${key}`);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Transcription jobs started successfully' })
    };
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};