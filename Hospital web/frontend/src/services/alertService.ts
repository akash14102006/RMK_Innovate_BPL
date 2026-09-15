import { API_CONFIG } from './apiConfig';
import { PredictionOutput } from './predictionService';

export interface AlertConfig {
  smsEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  recipients: string[];
}

export interface AlertMessage {
  type: 'sms' | 'email' | 'whatsapp';
  recipient: string;
  subject?: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
}

/**
 * Send SMS alert using Twilio
 */
export async function sendSMSAlert(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    // In a real implementation, this would call Twilio API
    // For demo purposes, we'll simulate the call
    
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + 
      API_CONFIG.TWILIO_ACCOUNT_SID + '/Messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(API_CONFIG.TWILIO_ACCOUNT_SID + ':' + API_CONFIG.TWILIO_AUTH_TOKEN),
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: API_CONFIG.TWILIO_PHONE_NUMBER,
        Body: message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending SMS:', error);
    // For demo, log to console
    console.log('📱 SMS Alert (Demo Mode):', { phoneNumber, message });
    return false;
  }
}

/**
 * Send email alert
 */
export async function sendEmailAlert(
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    // In a real implementation, this would call your email service
    // (SendGrid, AWS SES, or Firebase Functions with Nodemailer)
    
    // For demo purposes, we'll log to console
    console.log('📧 Email Alert (Demo Mode):', { email, subject, message });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send WhatsApp alert (using Twilio WhatsApp API or Meta Business API)
 */
export async function sendWhatsAppAlert(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    // In a real implementation, this would call WhatsApp Business API
    console.log('💬 WhatsApp Alert (Demo Mode):', { phoneNumber, message });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Format alert message from prediction output
 */
export function formatAlertMessage(prediction: PredictionOutput, city: string): string {
  const { predictedPatients, staffNeeded, surgePrediction, alertLevel } = prediction;
  
  let emoji = '⚠️';
  switch (alertLevel) {
    case 'critical': emoji = '🚨'; break;
    case 'high': emoji = '⚠️'; break;
    case 'moderate': emoji = '⚡'; break;
    case 'low': emoji = 'ℹ️'; break;
  }
  
  return `${emoji} BHARAT PULSELINK ALERT

${alertLevel.toUpperCase()} - ${city}

Predicted Patient Load: ${predictedPatients}
Expected Surge: +${surgePrediction}%
Additional Staff Needed: ${staffNeeded}

${prediction.advisory.substring(0, 200)}...

Action Required: Review full advisory in dashboard.

Time: ${new Date(prediction.timestamp).toLocaleString()}`;
}

/**
 * Check if alert should be sent based on thresholds
 */
export function shouldSendAlert(prediction: PredictionOutput): boolean {
  return (
    prediction.alertLevel === 'high' ||
    prediction.alertLevel === 'critical' ||
    prediction.predictedPatients > API_CONFIG.THRESHOLDS.PATIENT_LOAD
  );
}

/**
 * Send alerts to all configured channels
 */
export async function sendMultiChannelAlert(
  prediction: PredictionOutput,
  city: string,
  config: AlertConfig
): Promise<AlertMessage[]> {
  const messages: AlertMessage[] = [];
  const messageText = formatAlertMessage(prediction, city);
  const subject = `BHARAT PULSELINK ALERT: ${prediction.alertLevel.toUpperCase()} - ${city}`;

  // Check if alert should be sent
  if (!shouldSendAlert(prediction)) {
    console.log('Alert threshold not met, skipping notification');
    return messages;
  }

  // Send SMS alerts
  if (config.smsEnabled) {
    for (const recipient of config.recipients) {
      if (recipient.includes('@')) continue; // Skip emails for SMS
      
      const message: AlertMessage = {
        type: 'sms',
        recipient,
        message: messageText,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      const sent = await sendSMSAlert(recipient, messageText);
      message.status = sent ? 'sent' : 'failed';
      messages.push(message);
    }
  }

  // Send email alerts
  if (config.emailEnabled) {
    for (const recipient of config.recipients) {
      if (!recipient.includes('@')) continue; // Skip phone numbers for email
      
      const message: AlertMessage = {
        type: 'email',
        recipient,
        subject,
        message: prediction.advisory,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      const sent = await sendEmailAlert(recipient, subject, prediction.advisory);
      message.status = sent ? 'sent' : 'failed';
      messages.push(message);
    }
  }

  // Send WhatsApp alerts
  if (config.whatsappEnabled) {
    for (const recipient of config.recipients) {
      if (recipient.includes('@')) continue; // Skip emails for WhatsApp
      
      const message: AlertMessage = {
        type: 'whatsapp',
        recipient,
        message: messageText,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      const sent = await sendWhatsAppAlert(recipient, messageText);
      message.status = sent ? 'sent' : 'failed';
      messages.push(message);
    }
  }

  return messages;
}

/**
 * Log alert to Firebase Firestore
 */
export async function logAlertToFirebase(
  prediction: PredictionOutput,
  city: string,
  alertMessages: AlertMessage[]
): Promise<void> {
  try {
    // In a real implementation, this would write to Firestore
    console.log('📝 Logging to Firebase (Demo Mode):', {
      prediction,
      city,
      alertMessages,
      timestamp: new Date().toISOString(),
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch (error) {
    console.error('Error logging to Firebase:', error);
  }
}

/**
 * Complete alert workflow
 */
export async function triggerAlertWorkflow(
  prediction: PredictionOutput,
  city: string,
  config: AlertConfig
): Promise<void> {
  console.log('🚀 Triggering Alert Workflow...');

  // Send alerts
  const alertMessages = await sendMultiChannelAlert(prediction, city, config);
  
  console.log(`✅ Sent ${alertMessages.filter(m => m.status === 'sent').length} alerts`);
  console.log(`❌ Failed ${alertMessages.filter(m => m.status === 'failed').length} alerts`);

  // Log to Firebase
  await logAlertToFirebase(prediction, city, alertMessages);

  console.log('✅ Alert workflow completed');
}

/**
 * Demo function to simulate alert sending
 */
export function demoAlertSystem(prediction: PredictionOutput, city: string): void {
  console.log('\n=== DEMO ALERT SYSTEM ===\n');
  
  const message = formatAlertMessage(prediction, city);
  
  console.log('📱 SMS Alert Preview:');
  console.log(message);
  console.log('\n📧 Email Alert Preview:');
  console.log('Subject:', `BHARAT PULSELINK ALERT: ${prediction.alertLevel.toUpperCase()} - ${city}`);
  console.log('Body:', prediction.advisory);
  console.log('\n=========================\n');
}

/* updated */
