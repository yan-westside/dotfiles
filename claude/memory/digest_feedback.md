---
name: Daily Digest Quality Standards
description: How Yan wants his daily digest formatted — what he criticized and what he wants instead
type: feedback
---

## Never Use "You" or "I" — Always Use Names or Handles
Never write "you" or "I" in digest content. Always refer to people by name or Slack handle.
- "you are WFP DRI" → "<@U0225FX0EG4> is WFP DRI" or "Yan Jin is WFP DRI"
- "I checked" → omit or rephrase

**Why:** Yan explicitly corrected this — digest content should be objective and named, not addressed in second person.

---

Don't just list document titles or Slack thread titles. Every item in the digest must include:
1. **A 2-3 sentence summary** of what the document/thread actually says
2. **Key metrics or decisions** (numbers, targets, blockers, deadlines)
3. **"What this means for you (WFM)"** — explicit so on how it impacts Yan's work or team

**Why:** Yan explicitly called out the first digest as "really bad" — it listed docs with no summaries, no key details, and no "what does this mean for me?" framing. His expectation is to act as a PM who deeply understands his context.

**How to apply:**
- Always read actual document/thread content before summarizing — never list a title without reading it
- Filter ruthlessly: only include items relevant to WFM, Integrity ops, vendor management, SLA/ASA, C&R, DWR, headcount, AQA, or Yan's named stakeholders
- Organize by category (Strategic Updates / Operational Alerts / Vendor/BPO / Tools & Infra)
- If something is a duplicate or status-quo update with no new information, skip it
- Surface deadlines prominently — Yan has hard planning deadlines (e.g., PHX April 24)

## Resolved Items Format
Do NOT say "removed" for items that were resolved or completed. Instead, include a **✅ RESOLVED TODAY** section at the bottom of the digest showing what closed during the day, with resolution time and brief note.

Example:
```
✅ RESOLVED TODAY
• ASA Study — Delivered asa_report.html to Rae at 4:22pm. [Rae DM](url)
• TaskUs OT — Autumn confirmed IDV Core only needed, OT opened. Resolved 7:37pm. [DM](url)
• THQ Search Rate Limit — 181 Alorica agents blocked all day; Logan Rothenberger increased limit, all green by 9:56pm EDT. [Thread](url)
```

Items with no confirmed 2026 evidence simply don't appear — no explanation needed.

**Why:** Yan said "don't say removed" and asked to show resolved items with timestamps so he can see what closed during the day.

## Proposed Action Items Must Include Follow-Up
When an item is flagged as an action item (e.g., "Verify Assembled routing before Saturday"), always include:
1. The specific actions needed (a, b, c)
2. The owner or DRI to check with
3. The deadline

**Why:** Yan asked "what's your proposal on following there?" — a flag without a follow-up plan is not useful.

## Tool Issues Scope
For the TOOLS section: don't only include items where Yan was directly tagged. Also scan for tool incidents that affected BPO agent capacity (e.g., THQ search rate limit blocking 181 agents). These have direct WFM staffing impact and belong in the digest even if Yan wasn't in the thread.

**Why:** Yan asked "is that the only thing happened yesterday?" when only the Assembled heatmap was listed — the THQ search rate limit blocking 181 Alorica agents was a bigger tools event that was missed.

---

## SLACK DIGEST: Every item MUST have a direct thread permalink

Every single digest item must include the exact Slack thread permalink — NOT a channel-level link. Channel links (e.g. `/archives/C07K4B60S8N`) are useless; Yan needs the `p{timestamp}` link that takes him directly to the thread.

**Why:** Yan explicitly said "ALWAYS INCLUDE SLACK LINKS, OTHERWISE, HOW CAN I KNOW WHERE THAT IS!!!!" (Apr 20, 2026). This was a recurring failure.

**How to apply:**
- For each item, find the thread permalink via embedded URLs in thread replies, or via slack_search results that contain archive URLs.
- Format: `https://doordash.enterprise.slack.com/archives/{channel_id}/p{ts_no_dot}`
- If exact permalink is truly unavailable (private channel, no URL found), note the channel name AND exact time of the post — never silently drop it.
- Do NOT use channel-level links as substitutes for thread permalinks.

---

## GMAIL DIGEST: Every item MUST include the email subject line

Every Gmail digest item must include the original email subject line so Yan can find the email in his inbox.

**Why:** Yan said "can you copy the EMAIL SUBJECT!!! or anything helps me to the original context?" (Apr 20, 2026).

**How to apply:** Lead each Gmail item with the exact email subject in bold. Include sender and date.

---

## Slack digest window: default to last 3 days

**Why:** Yan asked to expand from April 19 only → April 17–19 (Apr 20, 2026).

**How to apply:** Default digest window = today minus 3 days unless user specifies otherwise.
