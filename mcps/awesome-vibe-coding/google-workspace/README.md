# Google Workspace MCP Server

Full-featured MCP server providing access to Google Workspace services — **Docs, Sheets, Drive, and Calendar** — directly from Cursor.

**Source:** Forked from [a-bonus/google-docs-mcp](https://github.com/a-bonus/google-docs-mcp) with Sheets, Drive, and Calendar support added.

## Features

- **Google Docs**: Read, write, append, insert, delete, format text (bold, italic, colors, headings), manage comments, work with multi-tab documents, insert images, create tables
- **Google Sheets**: Create spreadsheets, read/write data, manage sheets, use A1 notation, format cells
- **Google Drive**: List, search, create folders, upload files, manage permissions
- **Google Calendar**: List, create, update, search events, manage attendees
- **Image Support**: Insert images from URLs or upload local images into documents

## Quick Start

### 1. Install

```bash
cd google-workspace
npm install
npm run build
```

### 2. Authenticate (one-time, ~5 minutes)

The setup script requires the `gcloud` CLI. Install it first if you don't have it:

```bash
# macOS — install Google Cloud SDK
brew install --cask google-cloud-sdk

# Then log in
gcloud auth login
```

> **Verify it's working:** `gcloud auth list` should show your account as ACTIVE before continuing.

Now run the automated setup script:

```bash
./setup-gcloud.sh

# What it does:
# 1. Creates Google Cloud project via gcloud CLI
# 2. Enables required APIs (Docs, Sheets, Drive, Calendar)
# 3. Opens browser for OAuth consent screen setup (2 clicks)
# 4. Opens browser for OAuth credential creation (2 clicks)
# 5. Auto-installs credentials and completes OAuth flow
```

After this one-time setup, authentication is automatic.

### 3. Configure Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": [
        "<path-to-repo>/google-workspace/dist/index.js"
      ]
    }
  }
}
```

Replace `<path-to-repo>` with the actual path to this repository. Restart Cursor.

## Authentication

The server supports three authentication methods (in priority order):

1. **Application Default Credentials** — from `gcloud auth application-default login`
2. **Service Account** — set `SERVICE_ACCOUNT_PATH` env var pointing to a key file. Optionally set `GOOGLE_IMPERSONATE_USER` for domain-wide delegation.
3. **OAuth 2.0** — interactive browser flow using `credentials.json` / `token.json`

The automated `setup-gcloud.sh` script handles method 3 end-to-end.

## Usage Examples

### Google Docs

```
"List all my Google Docs"
"Read the document with ID 1abc..."
"Create a new document titled 'Meeting Notes'"
"Append 'New paragraph' to document 1abc..."
"Insert 'Important:' at index 100 in document 1abc..."
"Make the text from index 50 to 60 bold in document 1abc..."
"List all tabs in document 1abc..."
```

### Google Sheets

```
"Create a spreadsheet titled 'Q1 Budget'"
"Read range A1:C10 from spreadsheet 1abc..."
"Write [[Header1, Header2]] to range A1:B1 in spreadsheet 1abc..."
"Add a new sheet named 'Analysis' to spreadsheet 1abc..."
```

### Google Drive

```
"List all files in my Drive"
"Search for documents containing 'quarterly report'"
"Create a folder named 'Project Files'"
"Upload image.png to my Drive"
```

### Google Calendar

```
"List my calendar events for today"
"List events from tomorrow to next week"
"Create a meeting tomorrow at 2pm titled 'Team Sync'"
"Create an event on 2026-02-20 at 3pm titled 'Project Review' with attendees alice@example.com and bob@example.com"
"Search for events with 'interview' in them"
"Get details for event abc123xyz"
"Update event abc123xyz to change the time to 3pm tomorrow"
"Update event abc123xyz to add location 'Conference Room A'"
```

## Troubleshooting

### setup-gcloud.sh exits immediately / "command not found: gcloud"

The script requires the `gcloud` CLI. Install it and authenticate before running the script:

```bash
# macOS (Homebrew)
brew install --cask google-cloud-sdk

# Other platforms: https://cloud.google.com/sdk/docs/install

gcloud auth login
./setup-gcloud.sh
```

### "Google client initialization failed"

Re-run the authentication script:
```bash
./setup-gcloud.sh
```

### "Invalid authentication credentials"

Refresh your credentials by re-authenticating:
```bash
./setup-gcloud.sh
```

### Need to add Calendar scope to existing setup

If you previously used google-docs-mcp and need to add Calendar permissions:
```bash
# Delete the old token to force re-authentication with new scopes
rm token.json
# Restart Cursor — it will prompt for auth on first Calendar tool use
```

## Security Notes

- Never commit `credentials.json` or `token.json` to git (already in `.gitignore`)
- The MCP makes uploaded images publicly readable so they display in documents
- Service account keys should be stored securely outside the repo

## Known Limitations

- Comments created via API are not visually anchored in the Google Docs UI (API limitation)
- Resolved status may not persist on comments (API limitation)
- Some converted documents (e.g., from Word) may have limited API support

## Resources

- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [A1 Notation Guide](https://developers.google.com/sheets/api/guides/concepts#cell)
