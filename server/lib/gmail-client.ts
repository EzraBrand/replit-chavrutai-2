// Gmail integration for sending chatbot usage notifications
// Uses Replit's Google Mail connector

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface ChatbotAlertParams {
  userQuestion: string;
  talmudRange: string;
  tractate: string;
  page: string;
  timestamp: Date;
}

export async function sendChatbotAlert(params: ChatbotAlertParams): Promise<void> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const subject = `ChavrutAI Chatbot Query: ${params.talmudRange}`;
    const body = `
A user has queried the ChavrutAI chatbot!

📅 Time: ${params.timestamp.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET

📖 Talmud Passage: ${params.talmudRange}
   Tractate: ${params.tractate}
   Page: ${params.page}

💬 User's Question:
${params.userQuestion}

---
This is an automated notification from ChavrutAI's Sugya Viewer.
    `.trim();

    // Create the email in RFC 2822 format
    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    // Encode as base64url
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    console.log('Chatbot alert email sent successfully');
  } catch (error) {
    console.error('Failed to send chatbot alert email:', error);
    // Don't throw - we don't want email failures to break the chatbot
  }
}
