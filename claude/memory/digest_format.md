---
name: Confirmed Digest Format
description: Exact format Yan approved for the Slack sub-digest — headers, emoji, bold, bullets, markdown links
type: feedback
---

Yan confirmed: "this is perfect! memorize this format!" on Apr 10, 2026.

## Format Template

```
**📋 SLACK SUB-DIGEST | [Month] [Date], [Year]**

**🔴 YOUR [N] ACTION ITEM(S)**
1. **Item name** — description. [Link text](url) [Link text 2](url2)

**🚨 OPERATIONAL ALERTS**
• **Alert name — STATUS.** Description. [Thread](url)

**📦 QUEUE & CAPACITY**
• **Item.** Description. [Link](url)

**👥 VENDOR/BPO**
• **Item.** Description. [Link](url)

**🔧 TOOLS**
• **Item.** Description. [Link](url)
```

## Key Rules
- `**text**` (double asterisk) = bold in Slack messages ✅ — confirmed by live test 2026-04-18
- `*text*` (single asterisk) = italic in Slack messages (NOT bold)
- `_text_` = also italic in Slack messages
- Emojis in section headers ✅
- `[text](url)` markdown links ✅
- Bullet points `•` ✅
- NO `---` horizontal rule dividers → causes `invalid_blocks` error
- NO `assembled-hq.slack.com` URLs → causes `invalid_blocks` error; use `doordash.enterprise.slack.com` permalinks or channel name references instead
- One message per sub-digest (do NOT split into multiple messages unless absolutely forced by character limit)
- **Date format in header: `[Month] [Date], [Year]` — NO weekday** (e.g., "April 16, 2026" not "Wednesday, April 16, 2026"). Weekday is unreliable to determine correctly.

## Section Emoji Reference
- 🔴 = Action items
- 🚨 = Operational alerts
- 📦 = Queue & capacity
- 👥 = Vendor/BPO
- 🔧 = Tools & infra

**Why:** Discovered through iterative testing during first live digest (Apr 10, 2026). All emojis, `**bold**`, `[links](url)`, and bullets render correctly in Slack.
