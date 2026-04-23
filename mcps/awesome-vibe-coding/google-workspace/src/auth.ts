// src/auth.ts
import { google } from 'googleapis';
import { OAuth2Client, GoogleAuth } from 'google-auth-library';
import { JWT } from 'google-auth-library';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline/promises';
import * as http from 'http';
import { fileURLToPath } from 'url';
import open from 'open';

// --- Calculate paths relative to this script file (ESM way) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRootDir = path.resolve(__dirname, '..');

const TOKEN_PATH = path.join(projectRootDir, 'token.json');
const CREDENTIALS_PATH = path.join(projectRootDir, 'credentials.json');
// --- End of path calculation ---

const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive', // Full Drive access for listing, searching, and document discovery
  'https://www.googleapis.com/auth/spreadsheets', // Google Sheets API access
  'https://www.googleapis.com/auth/calendar', // Google Calendar API access
  'https://www.googleapis.com/auth/gmail.modify' // Gmail API access (read, send, trash, modify labels)
];

// --- NEW FUNCTION: Try Application Default Credentials (ADC) ---
// This uses credentials from `gcloud auth application-default login`
async function tryApplicationDefaultCredentials(): Promise<OAuth2Client | JWT | null> {
  try {
    const auth = new GoogleAuth({
      scopes: SCOPES,
    });
    
    const client = await auth.getClient();
    
    // Test the credentials by getting access token
    await client.getAccessToken();
    
    console.error('✅ Using Application Default Credentials (from gcloud)');
    return client as OAuth2Client | JWT;
  } catch (error) {
    // ADC not available, will fall back to other methods
    return null;
  }
}
// --- END OF NEW FUNCTION ---

// --- NEW FUNCTION: Handles Service Account Authentication ---
// This entire function is new. It is called only when the
// SERVICE_ACCOUNT_PATH environment variable is set.
// Supports domain-wide delegation via GOOGLE_IMPERSONATE_USER env var.
async function authorizeWithServiceAccount(): Promise<JWT> {
  const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH!; // We know this is set if we are in this function
  const impersonateUser = process.env.GOOGLE_IMPERSONATE_USER; // Optional: email of user to impersonate
  try {
    const keyFileContent = await fs.readFile(serviceAccountPath, 'utf8');
    const serviceAccountKey = JSON.parse(keyFileContent);

    const auth = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: SCOPES,
      subject: impersonateUser, // Enables domain-wide delegation when set
    });
    await auth.authorize();
    if (impersonateUser) {
      console.error(`Service Account authentication successful, impersonating: ${impersonateUser}`);
    } else {
      console.error('Service Account authentication successful!');
    }
    return auth;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`FATAL: Service account key file not found at path: ${serviceAccountPath}`);
      throw new Error(`Service account key file not found. Please check the path in SERVICE_ACCOUNT_PATH.`);
    }
    console.error('FATAL: Error loading or authorizing the service account key:', error.message);
    throw new Error('Failed to authorize using the service account. Ensure the key file is valid and the path is correct.');
  }
}
// --- END OF NEW FUNCTION---

async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content.toString());
    const { client_secret, client_id, redirect_uris } = await loadClientSecrets();
    const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
    client.setCredentials(credentials);
    return client;
  } catch (err) {
    return null;
  }
}

async function loadClientSecrets() {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content.toString());
  const key = keys.installed || keys.web;
   if (!key) throw new Error("Could not find client secrets in credentials.json.");
  return {
      client_id: key.client_id,
      client_secret: key.client_secret,
      redirect_uris: key.redirect_uris || ['http://localhost:3000/'], // Default for web clients
      client_type: keys.web ? 'web' : 'installed'
  };
}

async function saveCredentials(client: OAuth2Client): Promise<void> {
  const { client_secret, client_id } = await loadClientSecrets();
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: client_id,
    client_secret: client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
  console.error('Token stored to', TOKEN_PATH);
}

async function authenticate(): Promise<OAuth2Client> {
  const { client_secret, client_id } = await loadClientSecrets();
  
  // Use loopback redirect flow (modern replacement for deprecated OOB flow)
  // Start a local HTTP server on a random port to receive the OAuth redirect
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to start local redirect server'));
        return;
      }
      
      const port = address.port;
      const redirectUri = `http://localhost:${port}`;
      
      console.error(`Using loopback redirect on port ${port}...`);
      
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);
      
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        redirect_uri: redirectUri,
        prompt: 'consent', // Force consent to ensure we get a refresh_token
      });
      
      console.error('\n🌐 Opening browser for authorization...');
      console.error('If browser does not open, visit this URL:\n');
      console.error(authorizeUrl);
      console.error('');
      
      // Handle the OAuth redirect
      server.on('request', async (req, res) => {
        try {
          const url = new URL(req.url || '/', `http://localhost:${port}`);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          
          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h1>Authorization failed</h1><p>Error: ${error}</p><p>You can close this tab.</p>`);
            server.close();
            reject(new Error(`Authorization failed: ${error}`));
            return;
          }
          
          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>No authorization code received</h1><p>Please try again.</p>');
            return;
          }
          
          // Exchange code for tokens
          const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: redirectUri });
          oAuth2Client.setCredentials(tokens);
          await saveCredentials(oAuth2Client);
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>✅ Authentication successful!</h1><p>You can close this tab and return to Cursor.</p>');
          server.close();
          
          console.error('\n✅ Authentication successful! Token saved.');
          resolve(oAuth2Client);
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authentication failed</h1><p>${err.message}</p>`);
          server.close();
          reject(err);
        }
      });
      
      // Open browser for authorization
      open(authorizeUrl).catch(() => {
        console.error('Could not open browser automatically. Please visit the URL above.');
      });
      
      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('Authentication timed out after 5 minutes.'));
      }, 5 * 60 * 1000);
    });
  });
}

// --- MODIFIED: The Main Exported Function ---
// Authentication priority:
// 1. OAuth 2.0 with credentials.json/token.json
// 2. Service Account (if SERVICE_ACCOUNT_PATH env var is set)
// 3. Application Default Credentials (gcloud auth application-default login)
export async function authorize(): Promise<OAuth2Client | JWT> {
  // 1. Try OAuth 2.0 flow with credentials.json/token.json first
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    console.error('Using saved OAuth credentials.');
    return client;
  }

  // 2. If no token exists, try interactive OAuth using credentials.json
  try {
    await fs.access(CREDENTIALS_PATH);
    console.error('No saved OAuth credentials found. Starting OAuth authentication flow...');
    client = await authenticate();
    return client;
  } catch {
    // credentials.json missing; try non-interactive auth methods below
  }

  // 3. Check if Service Account environment variable is set
  if (process.env.SERVICE_ACCOUNT_PATH) {
    console.error('Service account path detected. Attempting service account authentication...');
    return authorizeWithServiceAccount();
  }

  // 4. Fall back to Application Default Credentials (from gcloud)
  console.error('Checking for Application Default Credentials...');
  const adcClient = await tryApplicationDefaultCredentials();
  if (adcClient) {
    return adcClient;
  }

  throw new Error('No valid Google authentication method found.');
}
// --- END OF MODIFIED: The Main Exported Function ---
