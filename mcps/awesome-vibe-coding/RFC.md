# RFC: Centralized MCP Repository with AI-Assisted Installation

**Status:** Draft  
**Author:** Data Engineering Team  
**Created:** December 2025  
**Last Updated:** December 2025

---

## Summary

This RFC proposes two initiatives:

1. **A centralized repository** listing all available MCP (Model Context Protocol) servers for DoorDash engineers
2. **An AI-assisted installation approach** where Cursor configures itself by following structured documentation

---

## Motivation

### Problem Statement

**Most DoorDash engineers don't have MCPs configured.** This represents a significant missed opportunity:

1. **Lack of awareness** - Engineers don't know MCPs exist or what value they provide
2. **Unknown availability** - Teams are unaware which internal tools can be accessed directly from Cursor
3. **No centralized guidance** - The few engineers who have configured MCPs did so independently, resulting in inconsistent setups
4. **Configuration complexity** - Without guidance, setting up authentication for internal tools is non-trivial
5. **Missed productivity gains** - AI-assisted data exploration, query writing, and debugging remain untapped

### The Opportunity

MCPs transform Cursor from a code editor into an integrated development environment:

- **Query data directly** - Access databases without leaving the editor
- **AI-powered analysis** - Let the AI analyze results, suggest optimizations, and debug issues
- **Context-aware assistance** - AI understands your schema, tables, and data models
- **Seamless workflows** - Move from exploration to implementation without context switching

---

## Proposal

### 1. Centralized MCP Listing Repository

Create a single repository (`awesome-vibe-coding`) that serves as the source of truth for MCP availability at DoorDash.

**Structure:**
```
awesome-vibe-coding/
├── README.md           # Overview and quick start
├── prompt.md           # AI installation prompt
├── RFC.md              # This document
├── snowflake/          # Snowflake MCP setup
│   └── README.md
├── databricks/         # Databricks MCP setup
│   ├── README.md
│   └── databricks-mcp/ # Custom server code (if needed)
├── trino/              # Trino MCP setup
│   ├── README.md
│   └── src/            # Custom server code (if needed)
├── github/             # GitHub MCP setup
│   └── README.md
├── glean/              # Glean MCP setup
│   └── README.md
└── askdataai/          # AskDataAI MCP setup
    └── README.md
```

**Each MCP folder contains:**

- Setup instructions optimized for both human and AI consumption
- Custom server code when official MCPs don't meet DoorDash requirements
- Authentication guidance specific to DoorDash's security policies

### 2. AI-Assisted Installation

Instead of traditional setup scripts, this project introduces a novel approach: **using the AI (Cursor) to configure itself**.

#### How It Works

1. User opens `prompt.md` in Cursor
2. User copies the prompt into Cursor Chat
3. The AI reads individual MCP READMEs
4. The AI executes installation steps autonomously
5. User only intervenes when strictly necessary (browser auth, missing credentials)

#### Traditional vs AI-Assisted Setup

| Aspect | Traditional | AI-Assisted |
|--------|-------------|-------------|
| Instructions | Static documentation | Interactive conversation |
| Execution | Manual copy-paste | AI executes commands |
| Error handling | User troubleshoots alone | AI diagnoses and fixes |
| Customization | User interprets docs | AI adapts to user's system |
| Credential handling | Manual lookup | AI reads from known locations |

#### Design Principles

- **Documentation as code** - READMEs are structured for AI consumption
- **Autonomy by default** - AI proceeds without asking unless blocked
- **CLI-first** - All instructions use command-line tools, not UI interactions
- **Self-documenting** - The same docs work for humans and AI

#### Why This Matters

This approach demonstrates that **AI can bootstrap its own tooling**. As MCP adoption grows, this pattern can extend to:

- Setting up development environments
- Configuring CI/CD pipelines
- Onboarding to new projects
- Managing infrastructure

---

## Available MCPs

| MCP | Purpose | Priority |
|-----|---------|----------|
| **Snowflake** | Data warehouse queries, Cortex AI | P0 - Essential |
| **Databricks** | Lakehouse queries, ML workloads | P0 - Essential |
| **Trino** | Federated queries, ETL | P1 - Important |
| **GitHub** | Code search, PR management | P1 - Important |
| **Looker** | BI semantic layer queries, dashboards, LookML | P1 - Important |
| **Glean** | Internal documentation search | P2 - Nice to have |
| **AskDataAI** | AI-powered data insights | P2 - Nice to have |

*Additional MCPs can be added as they become available or are developed internally.*

---

## Goals

- **Raise awareness** - Help engineers discover MCP capabilities
- **Provide a single source of truth** - Centralized listing of available MCPs
- **Enable AI-assisted setup** - Reduce manual configuration effort
- **Ensure consistency** - Same setup approach across the organization
- **Minimize friction** - Automated installation with minimal user intervention

---

## Support

For questions, support, or to report issues:

**Slack:** `#ask-awesome-cursor-mcp`

---

## Rollout Plan

### Phase 1: Documentation (Current)

- [x] Create repository structure
- [x] Write setup guides for each MCP
- [x] Create AI-assisted installation prompt
- [x] Write this RFC
- [x] Create support Slack channel

### Phase 2: Validation

- [ ] Test with 5-10 engineers from different teams
- [ ] Gather feedback on AI-assisted setup experience
- [ ] Iterate on documentation and prompt

### Phase 3: Adoption

- [ ] Announce in engineering channels
- [ ] Demo at team meetings
- [ ] Add to engineering onboarding checklist

### Phase 4: Expansion

- [ ] Add new MCPs as they become available 
  - [ ] Jira
  - [ ] Slack
  - [ ] PagerDuty
  - Others
- [ ] Explore additional AI-assisted configuration patterns
- [ ] Consider building DoorDash-specific MCPs for internal tools

---

## Open Questions

1. **How do we measure adoption?**
   - Track MCP usage via telemetry?
   - Survey engineers periodically?

2. **Should we build custom MCPs for internal tools?**
   - Pro: Better integration with DoorDash-specific systems
   - Con: Maintenance burden

3. **How do we keep the repository up to date?**
   - Assign ownership to a team?
   - Community-driven contributions?

---

## References

- [Cursor MCP Documentation](https://docs.cursor.com/context/model-context-protocol)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
