# Release Changes
<!-- markdownlint-disable MD033 MD034 -->

## 2026-03-02 deploy

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/500px-Slack_icon_2019.svg.png" alt="Slack logo" width="20" height="20" /> Slack

**Slack MCP — search, message, and read Slack from Cursor:**

- **search messages & files** — find content across public/private channels, DMs, and group DMs with date, user, and content filters
- **search users & channels** — look up colleagues by name/email/ID, find channels by name/description
- **send messages** — post to any Slack conversation directly from Cursor
- **read channels & threads** — retrieve full message history and thread conversations
- **manage canvases** — create, update, and read rich formatted Slack documents
- **user profiles** — access complete profile info including custom fields and statuses
- **OAuth authentication** — Cursor handles the OAuth flow automatically, no manual tokens needed
- hosted MCP at `https://mcp.slack.com/mcp` — no local server setup required
- safety rule (`slack-safety.mdc`) pre-installed to require explicit user approval before sending messages

### <img src="https://cdn.prod.website-files.com/5f15081919fdf673994ab5fd/6897dbf6b132866f782ee97b_granola-icon.svg" alt="Granola logo" width="20" height="20" /> Granola

**Granola MCP — access meeting notes and transcripts from Cursor:**

- **search meetings** — find past meetings by title, participants, date, or content
- **read transcripts** — access full meeting transcripts and AI-generated summaries
- **meeting context** — pull notes, action items, and decisions into your coding workflow
- hosted MCP at `https://mcp.granola.ai/mcp` — no local server setup required
- browser-based OAuth authentication via Granola account

## 2026-02-23 deploy

### <img src="https://hiviewsolutions.com/wp-content/uploads/2024/08/HiView-Solutions-Google-Workspace-Reseller.-Super-G-Icon.png" alt="Google Workspace logo" width="20" height="20" /> Google Workspace

**Full Google Workspace MCP — Docs, Sheets, Drive, and Calendar from Cursor:**

- **Google Docs** — read, create, append, insert, delete, format (bold/italic/colors/headings), multi-tab support, image insertion, table creation, comments
- **Google Sheets** — create spreadsheets, read/write ranges (A1 notation), manage sheets/tabs, format cells, append data, clear ranges
- **Google Drive** — list files, search, create folders, upload files, manage sharing permissions
- **Google Calendar** — list/create/update/search events, manage attendees, recurring events
- **3 auth methods** — Application Default Credentials, service account (with domain-wide delegation), or OAuth 2.0 browser flow
- **automated setup** — one-command `setup-gcloud.sh` creates GCP project, enables APIs, and completes OAuth in ~3 minutes
- **rich formatting** — text styling (font, size, color, links), paragraph styling (alignment, indentation, spacing, heading levels), image insertion from URL or local file
- built on [fastmcp](https://github.com/jlowin/fastmcp) framework with structured Zod parameter validation

> Supersedes PR #15 (google-docs-mcp) which covered Docs only. This version adds Sheets, Drive, Calendar, multi-auth, formatting, and automated setup.

## 2026-02-03 deploy

### <img src="https://freelogopng.com/images/all_img/1656222855doordash%20logo.png" alt="DoorDash logo" width="20" height="20" /> DD-ETL

**Critical fixes for UETL MCP response handling and error reporting:**

- **fix MCP response not returning** - tool was hanging indefinitely waiting for Databricks URL
- **use logging instead of print** - print statements were corrupting MCP JSON protocol on stdout
- **detect errors early and return immediately** - stop waiting for Airflow retries when task fails
- **return Databricks URL promptly** - return success response as soon as job URL is found
- **comprehensive error reporting** - capture full exception tracebacks with context
  - Case-insensitive error keyword matching (exception, error, traceback, failed)
  - Read 30 additional lines after task failure to capture complete stack traces
  - Separate "Errors detected" and "Last output" sections for clarity
- **fix asyncio race conditions** - use flag-based approach instead of calling `_stream_output()` twice
- **silence FastMCP internal debug logging** - prevent DEBUG messages from showing as errors in Cursor
- **status message flow** - yield info status updates through MCP protocol for better tracking

## 2026-01-29 deploy

### <img src="https://freelogopng.com/images/all_img/1656222855doordash%20logo.png" alt="DoorDash logo" width="20" height="20" /> DD-ETL

**Major enhancements to UETL and ETL 2.0 testing:**

#### UETL (Databricks) improvements:
- **migrate from Playwright to Databricks CLI** for authentication and monitoring
- **auto-discover CLI** from environment, Cursor extensions, or system PATH
- **auto-detect workspace profile** (doordash-dev/doordash-dataeng) from job URL
- **capture complete error traces** including ParseException, AnalysisException, and Tracebacks
- **improved substep tracking** with correct status (failed/successfully/executed)
- **enhanced log retrieval** for multi-task jobs with proper error field extraction
- **added final log fetch** after job completion to capture late-arriving errors

#### ETL 2.0 (Snowflake) improvements:
- **added task-level tracking and reporting** (previously only showed overall status)
- **capture detailed logs per task** with execution order
- **detect errors in real-time** (ERROR, Exception, Traceback, AirflowFailException)
- **mark tasks with correct status** based on outcome
- **populate error_logs array** with failure details

#### Shared improvements:
- **consistent structured JSON output** for both ETL versions
- **task/substep deduplication** using dictionary-based tracking
- **status prioritization** (failed > successfully > executed > started)
- **comprehensive error reporting** with full tracebacks
- updated documentation with CLI migration guide

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/960px-Google_Chrome_icon_%28February_2022%29.svg.png" alt="Chrome logo" width="20" height="20" /> Browser (BETA)

**Control Chrome from Cursor with tab management and page interaction:**

- **tab management** - list all open tabs, open new tabs, work across multiple tabs
- **page inspection** - snapshot (interactive elements), content_trimmed (page structure), html (raw content)
- **page interaction** - click elements, type text, scroll pages, wait for elements
- **clean API** - no "browser_" prefix, simple tool names (list_tabs, inspect, click, type)
- **queue-based architecture** - always-running queue server with Chrome extension polling

## 2026-01-20 deploy

### <img src="https://freelogopng.com/images/all_img/1656222855doordash%20logo.png" alt="DoorDash logo" width="20" height="20" /> DD-ETL

- test DoorDash ETL DAGs directly from Cursor (both ETL 2.0 and UETL)
- real-time progress notifications with step tracking (1/6, 2/6, ..., 6/6)
- live log streaming via FastMCP debug logs
- automatic Databricks job monitoring with Playwright browser
- substep tracking from Databricks output (5.01, 5.02, etc.)
- auto-detects ETL version (Snowflake vs Databricks)
- seamless terminal → Databricks log transition

## 2026-01-19 deploy

### <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5mvtHc4t68DHAp2iZJlR8iYP7gv0YeUUWQA&s" alt="Chronosphere logo" width="20" height="20" /> Chronosphere

- add Chronosphere MCP for observability platform access (PR #6)
- query Prometheus metrics with PromQL
- search and analyze logs
- view distributed traces
- access dashboards, monitors, and SLOs

## 2026-01-16 deploy

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Grafana_icon.svg/500px-Grafana_icon.svg.png" alt="Grafana logo" width="20" height="20" /> Grafana

- add Grafana MCP for logs, Prometheus, and dashboards (PR #5)

## 2026-01-15 deploy

### <img src="https://companieslogo.com/img/orig/TEAM-ddb0dd07.png?t=1720244494" alt="Atlassian logo" width="20" height="20" /> Atlassian

- search Jira issues from Cursor
- update Jira tickets
- read Confluence pages

### Setup improvements (Atlassian)

- add Atlassian MCP Remote setup guide and link from root README
- clarify Node 20.18.1+ requirement and auth flow details for Atlassian

## 2026-01-07 deploy

- add git-clean install guidance via `~/.awesome-mcps` (PR #1)
- document Databricks OAuth host mismatch workaround (PR #2)

## 2025-12-23 deploy

### <img src="https://companieslogo.com/img/orig/SNOW-35164165.png" alt="Snowflake logo" width="20" height="20" /> Snowflake

- query Snowflake data warehouses from Cursor
- run SQL and explore schemas

### <img src="https://1000logos.net/wp-content/uploads/2025/01/Databricks-Emblem.png" alt="Databricks logo" height="20" /> Databricks

- run SQL on Databricks warehouses from Cursor
- inspect query results inline

### <img src="https://cdn.simpleicons.org/trino" alt="Trino logo" width="20" height="20" /> Trino

- execute federated SQL queries across Trino catalogs
- analyze results from Cursor

### <img src="https://logosandtypes.com/wp-content/uploads/2024/11/Glean.png" alt="Glean logo" width="20" height="20" /> Glean

- search internal docs from Cursor
- ask questions across company knowledge

### <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub logo" width="20" height="20" /> GitHub

- browse repos and files from Cursor
- open and update PRs/issues

### <img src="https://freelogopng.com/images/all_img/1656222855doordash%20logo.png" alt="DoorDash logo" width="20" height="20" /> AskDataAI

- run AI-assisted data analysis
- get data insights directly in Cursor

### Setup improvements (general)

- add AI-assisted installation prompt to speed up MCP setup
- improve Databricks MCP setup instructions (CLI setup, auth, serverless guidance)
- add support Slack channel info
