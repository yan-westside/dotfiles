# MCP Installation Assistant

You are helping me set up MCP (Model Context Protocol) servers for Cursor.

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

1. **Install shared Cursor rules** from the `rules/` directory in this repository into `~/.cursor/rules/`. Copy every `.mdc` file:
   ```bash
   mkdir -p ~/.cursor/rules
   cp rules/*.mdc ~/.cursor/rules/
   ```
   This ensures important safety rules (e.g., preventing accidental public uploads) are active for all projects.
2. Ask me which MCPs I want to install (this is the only required question)
3. For each MCP I choose, read its README.md file
4. Execute all installation steps automatically
5. Configure `~/.cursor/mcp.json` with the correct settings
6. Verify each setup works before moving to the next
7. After all MCPs are configured, remind me to restart Cursor and mention the safety rules that were installed to `~/.cursor/rules/`:
   - **no-public-uploads** — prevents Cursor AI from uploading anything to publicly visible locations
   - **google-workspace-safety** — requires explicit user approval before creating, editing, deleting, or sharing Google Workspace content (Docs, Sheets, Drive, Calendar)
   - **slack-safety** — requires explicit user approval before sending Slack messages, modifying channels, or creating visible content

## Important Notes

- MCP configuration lives in `~/.cursor/mcp.json`
- Most credentials are in `~/Projects/doordash-etl/development.yaml`
- DoorDash VPN is required for most MCPs
- Prefer CLI commands over UI instructions
- Always restart Cursor after modifying `mcp.json`
- **Do not modify this git clone during installation.** If an MCP requires building/installing custom code, copy it to `~/.awesome-mcps/{tool}/` first and build/install there (e.g., run `npm ci`, `npm run build`, `pip install ...` in `~/.awesome-mcps/...`), then point `~/.cursor/mcp.json` at that copied path.

## Let's Get Started

Which MCPs would you like to install?
