---
name: AI-Assisted WFM Projects — Roadmap
description: Three agentic WFM projects inspired by LinkedIn post; uses Assembled MCP + Snowflake + ASA study findings
type: project
---

## Project 1: Real-Time Queue Health Monitor

**Goal**: Morning (or on-demand) script that flags queues at risk before the day deteriorates.

**Tools**: Assembled MCP (`get_queues`, `get_agent_states`, `get_adherence`, `get_forecast`)

**Logic**:
1. Pull all queues + current agent states
2. Compare actual staffing vs Assembled forecast for next 2 hours
3. Flag queues where adherence is low AND a volume spike is projected
4. Apply ASA study thresholds as tripwires (e.g., projected gap → >90s wait → alert)
5. Output: Slack DM with prioritized queue triage list

**Why:** Gives operational teams a 2-hr early warning before SLA degrades; connects directly to ASA friction study findings on abandon rate inflections at 30s and 90s.

**How to apply:** Build as standalone Python script; run via cron or on-demand from Claude Code.

---

## Project 2: Forecast vs Assembled Accuracy Comparison

**Goal**: Identify queues where Assembled's built-in forecast consistently over/under-predicts volume.

**Tools**: Assembled MCP (`get_forecast`), Snowflake (`edw.opex.fact_support_sla_by_queue_cluster`)

**Logic**:
1. Pull Assembled forecast for each queue/channel over trailing 30 days
2. Pull actuals from Snowflake using `case_in_sla=TRUE` formula (Walter's validated approach)
3. Run Prophet + ARIMA on actuals; compare MAPE vs Assembled's numbers
4. Flag queues with consistent forecast bias
5. Extension: Monte Carlo simulations on FTE inputs using ASA elasticity findings for outcome ranges

**Why:** Assembled's forecast is a black box; knowing where it drifts helps justify staffing overrides to Ops/Finance.

**How to apply:** Run weekly; pair findings with Finance <> WFM working group updates.

---

## Project 3: Adherence + Occupancy Auto-Report

**Goal**: Replace manual HC pull for weekly Finance <> WFM comparison with auto-generated actual vs plan rows.

**Tools**: Assembled MCP (`get_adherence`, `get_schedules`), Snowflake

**Logic**:
1. Pull scheduled HC from `get_schedules` for the week
2. Pull actual worked hours from `get_adherence`
3. Compute adherence gap by queue/team
4. Format output matching Richard Lam's preferred format (±5 HC flags)
5. Feed into existing weekly lock thread

**Why:** Currently pulling this manually from Snowflake; Assembled is the authoritative source for scheduled vs actual.

**How to apply:** Run every Monday morning; append to weekly update doc.

---

## Sequencing

| Order | Project | Why First |
|---|---|---|
| 1 | Queue Health Monitor | Pure Assembled API, no Snowflake dependency, fastest to ship |
| 2 | Adherence Auto-Report | Directly unblocks weekly Finance <> WFM work |
| 3 | Forecast Comparison | Most complex; needs Projects 1+2 as reference baselines |
