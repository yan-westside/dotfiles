# MCP Installation Assistant (Claude Code)

You are helping me set up MCP (Model Context Protocol) servers for Claude Code.

## Autonomy Guidelines

**Work as autonomously as possible.** Only ask for user input when strictly necessary:

- ✅ Execute commands directly without asking for confirmation
- ✅ Create files, folders, and configurations automatically
- ✅ Read credentials from `~/Projects/doordash-etl/development.yaml` without asking
- ✅ Fix errors and retry failed commands on your own
- ✅ Make reasonable decisions based on the README instructions
- ❌ Only ask the user when: credentials are missing, authentication requires browser interaction, or a critical decision needs explicit approval

## About This Repository

This repository contains setup guides and custom code for various MCP servers. Each top-level folder represents a distinct MCP server, with installation instructions provided in the corresponding `README.md`.

## Your Task

### Step 1 — Choose installation scope

Ask me whether to install MCPs **globally** or **locally**:

- **Global** (`-s user`) — available in all Claude Code sessions
  - MCP config: use `claude mcp add -s user` CLI commands (writes to `~/.claude.json`)
  - Safety rules: append to `~/.claude/CLAUDE.md`
- **Local** (`-s local`) — only available when Claude Code is run from a specific project directory
  - MCP config: use `claude mcp add -s local` CLI commands (writes to `.mcp.json` in the project root)
  - Safety rules: write to `CLAUDE.md` in the project root

### Step 2 — Install safety rules

Write the following safety rules to the appropriate `CLAUDE.md` based on the chosen scope.

```markdown
# Safety Rules

## No Public Uploads

BEFORE running any command or tool that creates, publishes, or uploads to an external service, STOP and check this rule.

### Actions that require explicit user confirmation

- Creating GitHub repos, gists, or releases (public OR private — always confirm visibility)
- Publishing to npm, PyPI, Docker Hub, or any package registry
- Deploying to any publicly accessible URL
- Posting to any external API that makes content publicly visible

### Default behavior

- NEVER default to `--public` for any resource. If the user does not specify visibility, ASK.
- NEVER create a public GitHub repo, public gist, or any publicly searchable resource without the user explicitly saying "public."
- A prior approval in the same conversation does NOT grant blanket permission for future uploads/publishes. Every single external creation requires its own confirmation.
- **Before every external create/publish/upload**, show the user a preview that includes:
  1. **Action** — what will be created/published/uploaded
  2. **Destination** — where it will go (GitHub, npm, Docker Hub, etc.)
  3. **Visibility** — public, private, or shared-link-only
  4. **Content summary** — what will be included
  Then ask the user to confirm.

## Google Workspace Safety

BEFORE calling any Google Workspace MCP tool that creates, modifies, deletes, or shares content, STOP and get explicit user approval.

### Actions that require explicit user confirmation

- **Google Docs**: creating, editing, formatting, commenting, adding/deleting tabs
- **Google Sheets**: creating, writing, appending, clearing data, formatting
- **Google Drive**: creating folders, moving/copying/renaming/deleting files, sharing or changing permissions
- **Google Calendar**: creating/updating/deleting events, adding/removing attendees

### Read-only actions that do NOT require confirmation

- Reading document content, listing/searching documents
- Reading sheet data, listing Drive files
- Listing or searching calendar events

### Default behavior

- NEVER create, edit, or delete Google Workspace content without the user explicitly approving it **each time**.
- A prior approval does NOT grant blanket permission. Every write/create/delete requires its own confirmation.
- **Before every write action**, show a preview with: Action, Target, and Content. Then ask the user to confirm.
- If an action is destructive (delete, overwrite, clear), state what will be affected and ask for confirmation.

## Slack Safety

BEFORE calling any Slack MCP tool that sends messages, modifies channels, or creates visible content, STOP and get explicit user approval.

### Actions that require explicit user confirmation

- Sending messages to any channel or user
- Sending drafts or scheduling messages
- Replying to threads (including broadcast replies)
- Creating or modifying channels
- Creating or editing canvases

### Read-only actions that do NOT require confirmation

- Reading channel messages, threads, user profiles, canvases
- Searching for messages, users, or channels

### Default behavior

- NEVER send a Slack message without the user explicitly approving it **each time**.
- A prior approval does NOT grant blanket permission. Every send requires its own confirmation.
- **Before every send**, show a preview with: Recipient, Thread context, and Full message text. Then ask the user to confirm.
- If a message mentions `@here`, `@channel`, or `@everyone`, always warn the user and confirm before sending.
```

If the target `CLAUDE.md` already exists, append the safety rules section — do not overwrite existing content.

### Step 3 — Choose MCPs

Ask me which MCPs I want to install. (This is the only other required question.)

**Note:** Some MCPs may already be available as Claude Code plugins. Check my `~/.claude/settings.json` for `enabledPlugins` and let me know which are already active so I can skip them if I want.

### Step 4 — Install each MCP

For each MCP I choose:
1. Read its `README.md` file in this repository
2. Execute all installation steps automatically
3. Add the MCP using the CLI based on the scope chosen in Step 1:
   - For **HTTP remote** MCPs: `claude mcp add -s <scope> -t http <name> <url>`
   - For **stdio** MCPs: `claude mcp add -s <scope> <name> -- <command> <args...>`
   - Add environment variables with `-e KEY=value`
   - Add HTTP headers with `-H "Header: value"`
4. Verify each setup works before moving to the next

### Step 5 — Wrap up

After all MCPs are configured:
1. Remind me to **start a new Claude Code session** (`/exit` and re-run `claude`) for the new MCPs to take effect
2. List the safety rules that were installed and where:
   - **no-public-uploads** — prevents uploading anything to publicly visible locations
   - **google-workspace-safety** — requires explicit user approval before creating, editing, deleting, or sharing Google Workspace content
   - **slack-safety** — requires explicit user approval before sending Slack messages, modifying channels, or creating visible content

## Important Notes

- **Global config**: `claude mcp add -s user ...` (writes to `~/.claude.json`)
- **Local config**: `claude mcp add -s local ...` (writes to `.mcp.json` in the project root)
- **List configured MCPs**: `claude mcp list`
- **Remove an MCP**: `claude mcp remove -s <scope> <name>`
- Most credentials are in `~/Projects/doordash-etl/development.yaml`
- DoorDash VPN is required for most MCPs
- Prefer CLI commands over UI instructions
- Start a new Claude Code session after modifying MCP config
- **Do not modify this git clone during installation.** If an MCP requires building/installing custom code, copy it to `~/.awesome-mcps/{tool}/` first and build/install there, then point the MCP config at that copied path.

## Let's Get Started

Where should I install the MCPs — globally or for a specific project?
