# Global Claude Code Rules

## LLM-Driven Report / Agent Standard Protocol

When building any agent or report that feeds data into an LLM to generate narrative, analysis, or recommendations, always implement all four of the following layers. These are non-negotiable defaults — do not skip them for "quick" or "prototype" agents.

### Layer 1 — Validate inputs before the prompt

After computing metrics and before building the LLM context string, run a validation pass that checks for implausible values. Flag anything that would mislead the model.

**Common triggers to always check:**
- WoW or period-over-period change > 30% for staffing, volume, or rate metrics — almost always a data artifact (unequal day coverage, missing dates, unpopulated table)
- Any metric derived from a sum where the two periods have different numbers of underlying days/rows — normalize to a daily/unit average first, never compare raw sums across unequal windows
- Any metric where one period has zero or near-zero denominator
- Any percentage computed from a table that may not be fully populated for recent dates

**Implementation pattern:**
```python
def validate_metrics(metrics: dict) -> list[dict]:
    warnings = []
    for row in metrics.get("network_cluster_wow", []):
        staff = row.get("staffing_wow_pct")
        if staff is not None and abs(staff) > 30:
            warnings.append({
                "metric": f"staffing_wow_pct [{row['cluster']}]",
                "value": f"{staff:+.1f}%",
                "flag": "Changes >30% WoW are almost always unequal day coverage, not real movement.",
            })
    return warnings
```
Prepend all warnings to the context string with a `[DATA QUALITY FLAG]` label so the model sees them before any data.

### Layer 2 — Embed quality metadata inline with every metric

Metrics must carry their own reliability context. Do not put quality caveats in footnotes or separate sections — put them on the same line as the number.

**Rules:**
- If a metric was computed from incomplete data (e.g., prior period missing days), annotate inline: `Staff%: +61.6% ⚠ (8/12 days in prior — unreliable, do not cite)`
- If a table is not yet populated for recent dates, label the metric `[PROVISIONAL]`
- If a metric has high variance due to small sample size, label it `[SMALL SAMPLE — n=X]`
- Always include `day_count` or row count alongside any SUM-based metric used in a WoW comparison

**SQL pattern:** Always select `COUNT(DISTINCT report_date) AS day_count` (or equivalent) alongside any `SUM(metric)` used in period comparisons. Normalize before comparing.

### Layer 3 — Constrain LLM arithmetic in the system prompt

Every LLM-driven report system prompt must include:

```
IMPORTANT: Only cite numbers that appear explicitly in the data context above.
Do not compute derived percentages, ratios, or averages from raw numbers in the context.
If a metric is labeled [DATA QUALITY FLAG] or ⚠, either omit it entirely or explicitly
acknowledge the data quality issue — never present a flagged number as a confirmed fact.
```

### Layer 4 — Programmatic post-generation analyst notes

Every report must include a programmatically generated section (not LLM-generated) that:
- Flags any implausible metric values found in the computed data (same checks as Layer 1)
- Calls out analytical weaknesses structurally present in this report (small samples, proxy metrics, unverified causal chains)
- Is clearly labeled as machine-generated, not LLM output

This section should render even when there are no flags — show "No data quality flags for this period" so readers know the check ran.

**Implementation:** Add an `_analyst_notes_html(metrics, bundle)` function (or equivalent) that generates this section from the metrics dict, called after the LLM narrative is rendered.

**The key principle:** The LLM is not the problem — bad context is the problem. Layers 1 and 2 stop bad numbers from entering the prompt. Layer 3 stops the model from inventing its own math. Layer 4 gives a machine-generated safety net that runs regardless of what the model wrote.

---

## Safety Rules

### No Public Uploads

BEFORE running any command or tool that creates, publishes, or uploads to an external service, STOP and check this rule.

**Actions that require explicit user confirmation:**
- Creating GitHub repos, gists, or releases (public OR private — always confirm visibility)
- Publishing to npm, PyPI, Docker Hub, or any package registry
- Deploying to any publicly accessible URL
- Posting to any external API that makes content publicly visible

**Default behavior:**
- NEVER default to `--public` for any resource. If the user does not specify visibility, ASK.
- NEVER create a public GitHub repo, public gist, or any publicly searchable resource without the user explicitly saying "public."
- A prior approval in the same conversation does NOT grant blanket permission for future uploads/publishes. Every single external creation requires its own confirmation.
- **Before every external create/publish/upload**, show the user a preview that includes: Action, Destination, Visibility, Content summary. Then ask the user to confirm.

### Google Workspace Safety

BEFORE calling any Google Workspace MCP tool that creates, modifies, deletes, or shares content, STOP and get explicit user approval.

**Actions that require explicit user confirmation:**
- **Google Docs**: creating, editing, formatting, commenting, adding/deleting tabs
- **Google Sheets**: creating, writing, appending, clearing data, formatting
- **Google Drive**: creating folders, moving/copying/renaming/deleting files, sharing or changing permissions
- **Google Calendar**: creating/updating/deleting events, adding/removing attendees

**Read-only actions that do NOT require confirmation:**
- Reading document content, listing/searching documents
- Reading sheet data, listing Drive files
- Listing or searching calendar events

**Default behavior:**
- NEVER create, edit, or delete Google Workspace content without the user explicitly approving it **each time**.
- A prior approval does NOT grant blanket permission. Every write/create/delete requires its own confirmation.
- **Before every write action**, show a preview with: Action, Target, and Content. Then ask the user to confirm.

### Slack Safety

BEFORE calling any Slack MCP tool that sends messages, modifies channels, or creates visible content, STOP and get explicit user approval.

**Actions that require explicit user confirmation:**
- Sending messages to any channel or user
- Sending drafts or scheduling messages
- Replying to threads (including broadcast replies)
- Creating or modifying channels
- Creating or editing canvases

**Read-only actions that do NOT require confirmation:**
- Reading channel messages, threads, user profiles, canvases
- Searching for messages, users, or channels

**Default behavior:**
- NEVER send a Slack message without the user explicitly approving it **each time**.
- A prior approval does NOT grant blanket permission. Every send requires its own confirmation.
- **Before every send**, show a preview with: Recipient, Thread context, and Full message text. Then ask the user to confirm.
- If a message mentions `@here`, `@channel`, or `@everyone`, always warn the user and confirm before sending.
