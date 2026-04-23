---
name: Google Sheets Read Performance
description: Read only narrow specific column ranges; never read full row widths from Finance Tab
type: feedback
---

Read only the exact columns needed — never pull wide row ranges.

**Why:** Reading `Finance Tab!A27:FM53` (168 columns × 27 rows) to get 3 columns caused severe slowness and timeout. The user called this out explicitly.

**How to apply:**
- To get cluster name + H2 monthly + current/prior week: read 3 separate narrow ranges (e.g., `A27:A53`, `EQ27:EV53`, `FL27:FM53`) — NOT one wide range spanning A to FM.
- To get a single cell or small range: always target it directly (e.g., `FL32:FM32`), never a full row.
- 6 parallel sheet reads at once is acceptable; reading massive column spans is not.
