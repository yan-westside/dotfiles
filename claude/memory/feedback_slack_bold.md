---
name: Slack Bold Formatting — Use Double Asterisk
description: In Slack, **text** = bold and *text* = italic. Always use ** for table titles and section headers.
type: feedback
---

In Slack messages, use `**text**` (double asterisk) for bold — not `*text*` (single asterisk).

**Why:** `*text*` renders as italic in Slack, not bold. BPO table titles sent with single asterisk appeared in italic instead of bold (caught 2026-04-20).

**How to apply:**
- All table titles in BPO/in-house Slack messages: `**Title Here**`
- All section headers: `**Header**`
- In Python scripts generating Slack output, use `f"**{title}**"` not `f"*{title}*"`
- This matches the confirmed format in digest_format.md and lock_thread_format.md
