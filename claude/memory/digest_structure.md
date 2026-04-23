---
name: Daily Digest Structure
description: 5 sub-digest architecture — order, delivery method, and scope rules for Yan's daily WFM digest
type: project
---

## Delivery Model
5 separate Slack DMs per day, each sub-digest sent independently to Yan.
Run sequentially: Slack → Gmail → Google Docs+Sheets → Assembled → Final Readout.

## Sub-Digest 1: Slack
See `slack_channels.md` for full channel list, IDs, and tier classification.

**Scope rules:**
- Personal audit: `from:@yan.jin` + `@U0225FX0EG4` mentions — past 10 days on first run, then daily thereafter
- Command center channels: today + yesterday, full read
- Tier 1 other channels: today only
- Tier 2 channels: today only, keyword-filtered
- Tier 3 channels: skip unless Yan is directly tagged

**Learning rule:** After each run, update `slack_channels.md` with any new channel encountered. Adjust tier if signal/noise pattern changes.

## Sub-Digest 2: Gmail
- OT Opening / Overtime threads (always check before finalizing)
- Vendor emails (TaskUs, Alorica, Telus) with operational flags
- Any threads where Yan sent an email needing follow-up
- **Cross-reference Slack digest:** Check if any Slack action items have email threads. Flag if OT email confirms/contradicts Slack data.

## Sub-Digest 3: Google Docs + Sheets
- Auto-trigger: any doc recently modified by yan.jin@doordash.com → read + summarize
- Key standing docs: Integrity WBR, Staffing Outlook H1 '26, Network Report, H2 Planning Readiness
- Cross-check: flag conflicts between docs on same topic

## Sub-Digest 4: Assembled
- Schedule adherence by vendor/team
- Forecast vs actuals (volume + headcount)
- Staffing gaps or overstaffing alerts

## Sub-Digest 5: Final Readout
- Synthesize all 4 sub-digests
- Deduplicate: if item already appeared in sub-digest, just reference it
- Rank by urgency
- Generate action items with owner + deadline
- Flag anything that changed since yesterday's readout
