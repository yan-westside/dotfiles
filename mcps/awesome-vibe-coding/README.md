# 🚀 DoorDash Cursor MCP Configuration

Welcome to the DoorDash MCP (Model Context Protocol) configuration guide! This repository helps you set up and configure various MCP servers to supercharge your Cursor IDE experience.

## What are MCPs?

MCPs (Model Context Protocol servers) extend Cursor's AI capabilities by providing direct access to external tools and data sources. With MCPs configured, you can query databases, search company documentation, interact with GitHub, and more—all from within Cursor.

## Available MCP Servers

| MCP | Description | Status |
|-----|-------------|--------|
| [DD-ETL](./dd-etl/) | Test DoorDash ETL DAGs with real-time progress and Databricks monitoring | ✅ Available |
| [Snowflake](./snowflake/) | Query Snowflake data warehouses directly from Cursor | ✅ Available |
| [Databricks](./databricks/) | Run SQL queries on Databricks SQL Warehouses | ✅ Available |
| [Trino](./trino/) | Execute queries on Trino distributed SQL engine | ✅ Available |
| [Glean](./glean/) | Search company documents and chat with Glean Assistant | ✅ Available |
| [GitHub](./github/) | Full GitHub integration for repos, PRs, issues, and more | ✅ Available |
| [Grafana](./grafana/) | Query logs, Prometheus metrics, and dashboards | ✅ Available |
| [Chronosphere](./chronosphere/) | Observability platform: metrics, logs, traces, SLOs | ✅ Available |
| [AskDataAI](./AskDataAI/) | AI-powered data analysis and insights | ✅ Available |
| [Atlassian (Remote)](./atlassian/) | Jira/Confluence + Rovo via Atlassian MCP Remote | ✅ Available |
| [Experimentation](./experimentation/) | Query DVs, feature flags, and Curie experiment results | ✅ Available |
| [Google Workspace](./google-workspace/) | Google Docs, Sheets, Drive, and Calendar integration | ✅ Available |
| [Slack](./slack/) | Search messages, send messages, read channels, manage canvases | ✅ Available |
| [Granola](./granola/) | Access meeting notes, transcripts, and AI summaries | ✅ Available |
| [ThoughtSpot](./thoughtspot/) | Custom integration: credentials + skills & code (no MCP); ThoughtSpot analytics and TML | ✅ Available |
| [Sigma](./sigma/) | Browse workbooks, inspect SQL/schemas, manage exports and permissions across all 4 DoorDash Sigma instances | ✅ Available |
| [Looker](./looker/) | Query Looker semantic layer; search dashboards and Looks | ✅ Available |
| [Android Dev](./android-dev/) | Interact with Android devices via ADB: screenshots, UI inspection, automated testing | ✅ Available |
| [Sentry](./sentry/) | Error tracking, issue investigation, and AI-powered debugging | ✅ Available |
| [Linear](./linear/) | Issue tracking, project management, and team workflows | ✅ Available |

## Safety Rules

This repository includes safety rules that are automatically installed when you use the AI-assisted installation flow. These rules prevent the AI from taking destructive or externally-visible actions without your explicit approval.

| Rule | Description |
|------|-------------|
| [no-public-uploads](./rules/no-public-uploads.mdc) | Prevents uploading code or documents to publicly visible locations |
| [google-workspace-safety](./rules/google-workspace-safety.mdc) | Requires explicit user approval before creating, editing, deleting, or sharing Google Workspace content |
| [slack-safety](./rules/slack-safety.mdc) | Requires explicit user approval before sending Slack messages, modifying channels, or creating visible content |

**Cursor**: Rules are installed as `.mdc` files to `~/.cursor/rules/` and take effect for all projects immediately.

**Claude Code**: Rules are written to `CLAUDE.md` — either globally (`~/.claude/CLAUDE.md`) or locally in your project root, depending on your choice during installation.

## Quick Start

### 🤖 Option A: AI-Assisted Installation (Recommended)

The easiest way to set up MCPs is to let your AI assistant guide you through the process. Pick the guide that matches your tool:

| Tool | Prompt File | Config Location |
|------|-------------|-----------------|
| **Cursor** | [`prompt.md`](./prompt.md) | `~/.cursor/mcp.json` |
| **Claude Code** | [`prompt-claude-code.md`](./prompt-claude-code.md) | `~/.claude/settings.json` (global) or `.mcp.json` (local) |
| **Codex CLI** | See individual MCP READMEs | `~/.codex/config.toml` |

**For Cursor:** Open `prompt.md` and copy the contents into Cursor Chat.

**For Claude Code:** Copy the contents of `prompt-claude-code.md` into a Claude Code session, or reference it directly. It will ask whether to install globally or into a specific project.

The AI will:
- Install safety rules for your tool
- Check your prerequisites (conda, node, etc.)
- Create the necessary environments
- Help you find your credentials
- Build your MCP configuration

## Keeping the Repo Git-Clean (Recommended)

When installing MCPs, **avoid generating configs/build artifacts inside this cloned repository**. Doing so can:

- Modify tracked files like lockfiles
- Create untracked files that may block future `git pull`/checkouts
- Make it harder to update to the latest repo instructions

**Rule of thumb:** treat this repo as *read-only documentation + source*. Put any user-specific code/config/state here instead:

```
~/.awesome-mcps/{tool}/
```

### Example workflow

1. Keep your clone clean and up-to-date:

```bash
cd /path/to/awesome-vibe-coding
git pull
```

2. Copy any “custom server code” to your user directory and install/build there:

```bash
mkdir -p ~/.awesome-mcps
# Example for Databricks MCP code:
rsync -a --delete "/path/to/awesome-vibe-coding/databricks/databricks-mcp/" \
  "$HOME/.awesome-mcps/databricks/databricks-mcp/"
```

3. Point `~/.cursor/mcp.json` at the **copied** code under `~/.awesome-mcps/...`, not the git clone.

### 📖 Option B: Manual Installation

Navigate to the specific MCP folder and follow the instructions in its README:

- [DD-ETL Setup](./dd-etl/README.md) - Test ETL DAGs with real-time progress, requires conda + Playwright
- [Snowflake Setup](./snowflake/README.md) - Requires conda, custom config file
- [Databricks Setup](./databricks/README.md) - Requires Databricks extension + custom MCP code
- [Trino Setup](./trino/README.md) - Requires conda, custom MCP code with OAuth
- [Glean Setup](./glean/README.md) - Runs via npx, needs API token
- [GitHub Setup](./github/README.md) - Runs via npx, needs PAT
- [Grafana Setup](./grafana/README.md) - Logs, Prometheus, dashboards with browser auth
- [AskDataAI Setup](./AskDataAI/README.md) - Requires API credentials
- [Atlassian MCP Remote](./atlassian/README.md) - Hosted MCP via npx, browser auth
- [Chronosphere Setup](./chronosphere/README.md) - Hosted MCP, needs API token
- [Experimentation Setup](./experimentation/README.md) - Hosted MCP, VPN only
- [Slack Setup](./slack/README.md) - Hosted MCP, OAuth authentication
- [Granola Setup](./granola/README.md) - Hosted MCP, meeting notes and transcripts
- [ThoughtSpot Setup](./thoughtspot/README.md) - Credentials + custom skills/code for ThoughtSpot
- [Sigma Setup](./sigma/README.md) - Browse workbooks, SQL, exports, and permissions across DoorDash Sigma instances
- [Looker Setup](./looker/README.md) - Requires conda + Looker API3 credentials
- [Android Dev Setup](./android-dev/README.md) - Requires Python 3.13+, uv, and ADB for Android device interaction
- [Sentry Setup](./sentry/README.md) - Hosted MCP, OAuth authentication

## Prerequisites

| Requirement | Used By |
|-------------|---------|
| [Cursor IDE](https://cursor.com), [Claude Code](https://docs.anthropic.com/en/docs/claude-code), or [Codex CLI](https://developers.openai.com/codex/cli) | All MCPs |
| [Conda](https://docs.conda.io/en/latest/miniconda.html) | Snowflake, Databricks, Trino, DD-ETL, Looker |
| [Node.js 18+](https://nodejs.org/) | Databricks, Glean, GitHub, Sigma |
| [Node.js 20.18.1+](https://nodejs.org/) | Atlassian MCP Remote |
| [Playwright](https://playwright.dev/) | DD-ETL (for Databricks monitoring) |
| [Python 3.13+](https://www.python.org/) | Android Dev |
| [uv](https://docs.astral.sh/uv/) | Android Dev (Python package manager) |
| [Android Platform Tools (ADB)](https://developer.android.com/tools/releases/platform-tools) | Android Dev |
| DoorDash VPN | All MCPs |

## Configuration Location

Cursor MCP configurations are stored in:

```
~/.cursor/mcp.json
```

Basic structure:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```


## Verifying available MCPs

To check which MCPs are already available in your cursor environment:

1. Hit <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>P</kbd>
2. Open the `View: Open MCP Settings`

## Where to Find Your Credentials

Most credentials are in `~/Projects/doordash-etl/development.yaml`:

```yaml
snowflake-prod:
  username: FIRSTNAME.LASTNAME
  password: eyJraWQiOi...  # PAT token
  account: DOORDASH
  snowflake_role: FIRSTNAMELASTNAME
  warehouse: adhoc

trino-etl-service:
  username: firstname.lastname@doordash.com
  hostname: trino.doordash.team
  port: 443
```

**ThoughtSpot** (custom integration; no MCP): request a token in Slack **#dd-ts-beta-users** (a member will send it via DM). Store credentials in **`~/.config/thoughtspot/secrets.json`**; see [thoughtspot/README.md](./thoughtspot/README.md).

## Troubleshooting

### MCP Not Loading

1. **Check Cursor logs**: Output panel → "Cursor MCP"
2. **Verify JSON syntax**: Ensure your `mcp.json` is valid
3. **Restart Cursor**: Always restart after modifying `mcp.json`

### Connection Issues

1. **VPN**: Ensure you're connected to DoorDash VPN
2. **Credentials**: Verify your credentials haven't expired
3. **Firewall**: Check that required ports are not blocked

### Common Errors

| Error | Solution |
|-------|----------|
| `command not found` | Install the required runtime (conda, node, etc.) |
| `authentication failed` | Refresh your credentials/tokens |
| `connection timeout` | Check VPN connection |

## Contributing

Want to add a new MCP or improve existing documentation?

1. Fork this repository
2. Create a new branch for your changes
3. Add your MCP folder with a comprehensive README
4. Update this main README to include your MCP
5. Submit a pull request

## Support

- **Slack**: `#ask-awesome-cursor-mcp`
- **Issues**: Open an issue in this repository

---

Made with ❤️ by a DoorDash AE who wants everybody to have a good experience
