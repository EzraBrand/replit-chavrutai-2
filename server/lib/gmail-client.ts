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

interface ToolCallData {
  tool: string;
  arguments: Record<string, any>;
  result: any;
}

interface ChatbotAlertParams {
  userQuestion: string;
  aiResponse: string;
  fullPrompt: string;
  talmudRange: string;
  tractate: string;
  page: string;
  timestamp: Date;
  toolCalls?: ToolCallData[];
}

function extractLinks(text: string | undefined | null): string[] {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s)\]>]+/g;
  return Array.from(new Set(text.match(urlRegex) || []));
}

function formatToolCallsForEmail(toolCalls: ToolCallData[]): string {
  if (!toolCalls || toolCalls.length === 0) return '';

  let section = '\n🔧 Tool Calls:\n';
  for (const tc of toolCalls) {
    section += `\n  Tool: ${tc.tool}\n`;
    section += `  Arguments: ${JSON.stringify(tc.arguments)}\n`;

    const argLinks = extractLinks(JSON.stringify(tc.arguments));
    const resultLinks = extractLinks(JSON.stringify(tc.result));
    const allLinks = Array.from(new Set([...argLinks, ...resultLinks]));
    if (allLinks.length > 0) {
      section += `  Links:\n`;
      for (const link of allLinks) {
        section += `    - ${link}\n`;
      }
    }
  }
  return section;
}

export async function sendChatbotAlert(params: ChatbotAlertParams): Promise<void> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const recipientEmail = process.env.CHATBOT_ALERT_EMAIL;
    
    if (!recipientEmail) {
      console.log('CHATBOT_ALERT_EMAIL not set, skipping email notification');
      return;
    }

    const responseLinks = extractLinks(params.aiResponse);
    const toolCallSection = formatToolCallsForEmail(params.toolCalls || []);
    const linksSection = responseLinks.length > 0
      ? `\n🔗 Links in Response:\n${responseLinks.map(l => `  - ${l}`).join('\n')}\n`
      : '';
    
    const subject = `ChavrutAI Chatbot Query: ${params.talmudRange}`;
    const body = `
A user has queried the ChavrutAI chatbot!

📅 Time: ${params.timestamp.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET

📖 Talmud Passage: ${params.talmudRange}
   Tractate: ${params.tractate}
   Page: ${params.page}

💬 User's Question:
${params.userQuestion}

🤖 AI Response:
${params.aiResponse}
${linksSection}${toolCallSection}
📝 Full Prompt Sent to AI:
${params.fullPrompt}

---
This is an automated notification from ChavrutAI's Sugya Viewer.
    `.trim();

    // Create the email in RFC 2822 format with proper headers
    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      `To: ${recipientEmail}`,
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
