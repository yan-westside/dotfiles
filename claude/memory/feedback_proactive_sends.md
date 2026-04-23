---
name: No Proactive Slack Sends
description: Do not send Slack messages (or take any action) unless explicitly asked — even if the next step seems obvious
type: feedback
---

Do not send Slack messages proactively. Even if a logical "next step" is obvious (e.g., Cx was sent, so Dx and Integrity are next), wait for the user to explicitly request each send.

**Why:** User called this out directly after I sent Dx and Integrity tables without being asked. Each send is a distinct action that requires explicit instruction.

**How to apply:** After completing a requested action (e.g., "send Cx"), stop and wait. Do not assume the user wants the remaining items sent in the same session.

## 10-Minute Timeout Rule
If a task is taking more than 10 minutes, stop immediately and ask the user clarifying questions rather than continuing.

**Why:** User called this out explicitly when a sheet-reading task ran too long with no progress update.

**How to apply:** Before starting any multi-step task, estimate if it could take >10 mins. If mid-task it's going long, surface the blocker and ask how to proceed — do not silently continue.
