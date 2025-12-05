import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { randomBytes } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

/**
 * Generate a secure activation token
 * 32 bytes = 256 bits of entropy
 */
function generateActivationToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate token expiration date (7 days from now)
 */
function getTokenExpiration() {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  return expirationDate.toISOString();
}

/**
 * Send invitation email via SNS
 */
async function sendInvitationEmail(patient, token, clinicianName) {
  const activationUrl = `${process.env.FRONTEND_URL}/activate?token=${token}`;
  
  // Create email message
  const emailMessage = `
Welcome to ClinicaVoice - Activate Your Patient Portal Account

Hi ${patient.firstName},

${clinicianName} has created a patient portal account for you in ClinicaVoice.

Your patient portal allows you to:
- View your upcoming appointments
- Access your medical records
- Review your appointment history

To activate your account and set your password, visit this link:
${activationUrl}

This activation link will expire in 7 days.

If you didn't expect this email or have questions, please contact your healthcare provider.

---
ClinicaVoice - Secure Medical Documentation
This is an automated message, please do not reply to this email.
  `.trim();
  
  const snsParams = {
    TopicArn: process.env.SNS_TOPIC_ARN,
    Subject: 'Welcome to ClinicaVoice - Activate Your Patient Portal Account',
    Message: emailMessage,
    MessageAttributes: {
      'email': {
        DataType: 'String',
        StringValue: patient.email
      },
      'patientName': {
        DataType: 'String',
        StringValue: `${patient.firstName} ${patient.lastName}`
      }
    }
  };
  
  try {
    const command = new PublishCommand(snsParams);
    const result = await snsClient.send(command);
    console.log('SNS message published successfully:', result.MessageId);
    
    // Subscribe the patient's email to the SNS topic
    // This will send them the invitation email
    await subscribeEmailToTopic(patient.email);
    
    return result.MessageId;
  } catch (error) {
    console.error('Error sending SNS notification:', error);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}

/**
 * Subscribe an email address to the SNS topic
 * This will trigger AWS to send a subscription confirmation email
 */
async function subscribeEmailToTopic(email) {
  try {
    const { SubscribeCommand } = await import('@aws-sdk/client-sns');
    
    const subscribeParams = {
      Protocol: 'email',
      TopicArn: process.env.SNS_TOPIC_ARN,
      Endpoint: email,
      ReturnSubscriptionArn: true
    };
    
    const command = new SubscribeCommand(subscribeParams);
    const result = await snsClient.send(command);
    console.log(`Email ${email} subscribed to SNS topic:`, result.SubscriptionArn);
    return result.SubscriptionArn;
  } catch (error) {
    console.error('Error subscribing email to SNS:', error);
    // Don't throw - subscription failure shouldn't block the invitation
    return null;
  }
}

/**
 * Patient Invitation Lambda Handler
 * Generates activation token and sends invitation email
 */
export const handler = async (event) => {
  console.log('Patient Invitation Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    // This Lambda is invoked internally, not via API Gateway
    // Event should contain: { patientId, userId, clinicianName }
    const { patientId, userId, clinicianName } = event;
    
    if (!patientId || !userId) {
      throw new Error('Missing required parameters: patientId and userId');
    }
    
    // Get patient record
    const getCommand = new GetCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId }
    });
    
    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      throw new Error('Patient not found');
    }
    
    const patient = result.Item;
    
    // Validate patient has email
    if (!patient.email) {
      throw new Error('Patient does not have an email address');
    }
    
    // Generate secure activation token
    const token = generateActivationToken();
    const expiresAt = getTokenExpiration();
    const sentAt = new Date().toISOString();
    
    // Update patient record with invitation token
    const updateCommand = new UpdateCommand({
      TableName: process.env.PATIENTS_TABLE,
      Key: { id: patientId, userId },
      UpdateExpression: `
        SET invitationToken = :token,
            invitationSentAt = :sentAt,
            invitationExpiresAt = :expiresAt,
            accountStatus = :accountStatus,
            updatedAt = :updatedAt
      `,
      ExpressionAttributeValues: {
        ':token': token,
        ':sentAt': sentAt,
        ':expiresAt': expiresAt,
        ':accountStatus': 'pending',
        ':updatedAt': sentAt
      },
      ReturnValues: 'ALL_NEW'
    });
    
    await docClient.send(updateCommand);
    
    console.log(`Invitation token generated for patient ${patientId}`);
    
    // Send invitation email
    const messageId = await sendInvitationEmail(
      patient, 
      token, 
      clinicianName || 'Your healthcare provider'
    );
    
    console.log(`Invitation email sent to ${patient.email}, MessageId: ${messageId}`);
    
    return {
      success: true,
      patientId,
      email: patient.email,
      sentAt,
      expiresAt,
      messageId
    };
    
  } catch (error) {
    console.error('Error in patient invitation:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};
