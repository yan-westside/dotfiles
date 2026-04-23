# Cursor Analytics Project Memory

## User Profile
- [Yan Jin Profile](yan_profile.md) — Role, org, key topics, BPO vendors, what matters for digests
- [Digest Quality Standards](digest_feedback.md) — What Yan criticized + required format for every digest item
- [Digest Rules & Operational Standards](digest_rules.md) — Auto-triggers, incident resolution rules, email checks, Slack links required, doc cross-check rule, #in-house-capacityplan-changes channel

## Finance <> WFM Working Group
- [Weekly Update Scope](finance_wfm_weekly_update_scope.md) — Merchant (Mx), MSS excluded; scope = Cx + Dx + BPO only
- [Finance <> WFM HC Comparison & Learnings](aop_comparison.md) — Partner File tables (CDMX/PHX H2 + BPO), approved format, WoW methodology, channel learnings (TTEC GCP gap lesson 4/14)
- [Richard Lam Preferences](richard_lam_preferences.md) — Weekly for current quarter, monthly for H2; flag thresholds: in-house ±5 HC per Site-LOB, BPO ±5 FTE per Px-Queue
- [BPO Billing Classification](bpo_billing_classification.md) — CPT/FTE/in-house by cluster (Consumer, Dasher, Integrity); tech cost vendor mapping; ⚠️ open items to remind user
- [BPO Cost Construction](bpo_cost_construction.md) — FTE billing (individual clusters, separate Cx/Dx/Integrity tables) + tech cost HC (FTE summary tab, all BPO clusters); table format, WoW method, H2 avg method, data gap ⚠️
- [FTE Summary Tab Structure](fte_summary_tab.md) — Canonical source for FTE + HC; row ranges, column mappings (AOP: Apr13=colS; Lock: Apr13=colAG), H2 cols, WoW method, scope rules
- [BPO Comparison Table WIP](bpo_comparison_wip.md) — ALL ✅ sent 2026-04-20; thread format: 4 parent msgs (Cx/Dx/Integrity/Drive) + FTE & HC as thread replies
- [CONSUMER HC Total Table](consumer_hc_table.md) — Full HC comparison (Apr 13 vs AOP vs Apr 6) + H2 monthly avgs, all 20 clusters incl. AOP-only
- [DASHER HC Total + FTE Tables](dasher_hc_table.md) — HC Total (all 19 clusters) + FTE-billed only (4 clusters); Apr 13 vs AOP vs Apr 6 + H2 monthly avgs
- [INTEGRITY BPO FTE Table](integrity_hc_table.md) — 30 clusters; FTE ✅ HC ✅ both sent 2026-04-20
- [DRIVE BPO Classification](drive_bpo_classification.md) — 6 CPT + 14 FTE clusters; 100% BPO; McDonalds Phone Alorica split (FTE=17 from row 1723, not total 105); FTE Summary rows 472–648

## Daily Digest System
- [Digest Structure](digest_structure.md) — 5 sub-digest architecture: Slack → Gmail → Docs/Sheets → Assembled → Final; each delivered as separate Slack DM
- [Slack Channel Registry](slack_channels.md) — All 15 command center channel IDs + tier classification (Tier 1 daily / Tier 2 skim / Tier 3 skip); updated after each run
- [Confirmed Digest Format](digest_format.md) — Exact format Yan approved: emoji headers, **bold**, bullets, [links](url), no --- dividers
- [Queue Operational Patterns](queue_operational_patterns.md) — IVR availability by LOB, cross-skill constraints, recurring CIQ patterns, incident→queue mappings, key people (learned from 57 threads, 4/14–4/17)

## In-House HC Notes
- [In-House HC Known Variances](inhouse_hc_notes.md) — Approved reasons for plan vs AOP gaps; Integrity cluster name mappings; ⚠️ CDMX Fraud=12 in lock (not 0); script bug pending fix
- [Weekly Lock Thread Format + Status](lock_thread_format.md) — 3-part format, cc tags per LOB, Apr 20 column mapping, Integrity ❌ still pending

## Behavioral Rules
- [LLM-Driven Report / Agent Standard Protocol](feedback_llm_agent_protocol.md) — 4-layer non-negotiable standard (validate inputs, inline quality flags, constrain arithmetic, programmatic analyst notes)
- [Hallucination Reduction Rules](feedback_hallucination_reduction.md) — Pre-response checklist: cite sources, admit uncertainty, verify before recommending, no invented stats
- [No Proactive Slack Sends + 10-Min Timeout](feedback_proactive_sends.md) — Wait for explicit request; if task >10 mins stop and ask
- [Sheet Read Performance](feedback_sheet_reads.md) — Read narrow column ranges only; never pull full row widths (A:FM)
- [Never Write to Google Doc — Always Slack](feedback_gdoc_slack.md) — BPO and in-house tables go to Slack; DM to Yan first for review
- [Always Clarify Before Saving Memory](feedback_clarify_before_memory.md) — Ask clarifying questions first, save memory after confirmed, then proceed with work
- [Slack Bold Formatting](feedback_slack_bold.md) — Use **text** (double asterisk) for bold; *text* is italic in Slack; applies to all table titles in Python scripts
- [BPO Table Rules](feedback_bpo_table_rules.md) — LOPO is in-house (NEVER in BPO tables); H2 must have 4 rows per cluster: Lock/AOP/vs AOP (int)/vs AOP% (pct)

- [Weekly HTML Generation Workflow](weekly_html_workflow.md) — After each lock update: run `generate_lob_html.py {lob}` (consumer/dasher/integrity) + `generate_drive_pdf.py`; copy to Downloads

## Device Resilience
- [Dotfiles & Device Resilience Plan](dotfiles_resilience.md) — ⏸️ Parked; private dotfiles repo plan to back up memories/CLAUDE.md/settings; resume when ready to scaffold

## Utilities & Patterns
- [Google Sheets → Snowflake Upload](gsheets_to_snowflake.md) — Auth via MCP token (not ADC), correct SnowflakeHook drop+create pattern, double-prefix gotcha

## WFM Knowledge Base
- [Diane's WFM Capacity Planning Knowledge](diane_knowledge.md) — Data dictionary (30 cols), FTE/HC formulas, Erlang vs Workload sizing frameworks, Q1/Q2 analysis templates

## Dasher Pay Study
- [Dasher Pay Study](dasher_pay_study.md) — Data source, pay metric (incl. tips), key findings, hypothesis test results, file structure, how to re-run

## AI-Assisted WFM Projects
- [AI WFM Projects Roadmap](ai_wfm_projects.md) — 3 projects: Queue Health Monitor, Forecast Comparison, Adherence Auto-Report; sequencing + tool mapping

## ASA Study Files
- [Project Context](asa_study/project_context.md) — Objectives, scope, 15 clusters, data sources, Zoe's SQL logic, key findings
- [Feedback & Corrections](asa_study/feedback.md) — What to avoid, what to do, validated approaches
- [SQL Review: 13_tail_raw_data.sql](asa_study/sql_review.md) — Bugs fixed, remaining issues, overclaimed issues, 43-cluster list
- [Correct SLA Formula](asa_study/sla_formula.md) — Use `case_in_sla=TRUE`, no audience filters; `cluster_missed=0` is wrong; validated vs Walter's dashboard 2026-04-16

## ASA Friction Study: CORRECTED APPROACH (2026-04-01)

### Critical Issues Found in First Pass
❌ **Wrong data source**: Used raw SLA tables instead of pre-aggregated fact table
❌ **Wrong unit**: Analyzed by queue cluster instead of **wait time bins**
❌ **Missing elasticity metrics**: Didn't calculate outcome changes by wait time
❌ **Integrity filter broken**: Fraud queues included (should exclude)
❌ **Issue type ignored**: Didn't analyze time-sensitive vs general separately
❌ **Generic recommendations**: No real trade-off analysis with DWR guardrail

### Correct Approach (from GSIO Doc)
**Primary Metric**: C&R delivery cost/ratio (NOT FTE savings, NOT wait reduction)
**Guardrail**: DWR % (maintain ≥70% or pick segment-specific floor)
**Unit**: **Wait time bins** (0-10s, 10-30s, 30-60s, 60-90s, 90-120s, 120-210s, 210-600s)
**Scope**: Single-contact cases only (87% of all volume)

### Pre-Aggregated Data (Ready to Use)
**Table**: `proddb.zoehe.gsio_asa_wait_time_onecasecontact_group_260101_260128` (Zoe's aggregation)
- Already has: DWR, C&R cost/ratio, abandonment %, defect %, 28D frequency by wait_time_bin
- Dimensions: customer_type, issue_type, live_flag, is_peak, case_origin
- SQL ready: Lines 370-452 in GSIO doc

### Real Elasticity Findings (from Mar 6 Analysis)
| Metric | <10s | 10-90s | 90-120s | >210s | Finding |
|---|---|---|---|---|---|
| **DWR** | 74% | ~69% | -- | <65% | Downward trend; -5pp drop at 10-90s is weak |
| **Abandon %** | 0.1% | 0.3% | 1.0% | -- | Inflections at ~30s and ~90s |
| **C&R Ratio** | Low | Flat | Flat | Flat | Favorable at <10s, then NO inflation |
| **28D Orders** | -- | Flat | Flat | Flat | No impact observed |

**Dx → Cx Cascading**: Dasher demand is 1-hr leading indicator of Consumer demand (0.907 r)

### 5 Core Queue Clusters (Operational Examples)
- Dx Mainline Phone, Dx VIP Phone, Dx Non-Live Phone
- Customer Mainline, Customer Specialized Pod
(Analyze WITHIN these, not GROUP BY them)

### WFM Insights Framework
Target: "If we set ASA=Xs for segment Y, what happens?"
- DWR: 74% → ?% (guardrail check)
- C&R cost: $X → $Y (financial impact)
- Abandon rate: A% → B% (experience impact)
- FTE savings: Z (secondary, not primary)

---

## ASA Friction Study: COMPLETE ✅ (2026-04-01)

### Project Completion Summary
- **Status**: ✅ ALL 3 PHASES DELIVERED AND SAVED
- **User**: yan.jin@doordash.com
- **Team**: Zoe He, Coki Metcalfe, Rae Pulliam
- **Location**: `team_analytics/personal/yan.jin@doordash.com/asa_friction_study/`

### Phase Delivery Summary
| Phase | Component | Status | Key Output |
|---|---|---|---|
| **Phase 1** | Data Loading | ✅ | 26,794 rows from Snowflake |
| **Phase 2** | Analysis Engine | ✅ | 194 queue clusters analyzed |
| **Phase 3** | Reporting | ✅ | Professional markdown report |

### Key Findings (Ready for StakeShareholders)
- **194 queue clusters** analyzed (Consumer + Dasher)
- **Friction points identified**: Low P90/median ratios = capacity limits
- **Recommended ASA targets**:
  - Dasher non-live: **150-180s** (from 120s)
  - Customer chat: **60-90s** (from 120s)
  - Customer phone: **90-120s** (conservative)
  - **Live orders: 60s** (prevents cascading defects)
- **DWR guardrail**: >70% (acceptable range)
- **Potential savings**: 2-7% FTE optimization

### Files Created This Session
```
asa_friction_study/
├── SESSION_SUMMARY.md ......................... Full session context & next steps
├── load_data.py ............................. Snowflake data loading pipeline
├── analysis.py .............................. Multi-faceted analysis engine
├── report.py ................................ Report generation engine
├── sql/01_queue_sla_metrics.sql ............. Core queue cluster metrics query
├── outputs/01_queue_sla_metrics.csv ......... 26,794 rows of SLA data
├── outputs/01_queue_friction_analysis.png .. 4-panel visualization
├── outputs/00_friction_summary.txt ......... Executive findings
└── outputs/ASA_Friction_Study_Report.md ... Professional markdown report
```

### How to Run (1 minute end-to-end)
```bash
cd /home/yanjin/Projects/cursor-analytics
source venv/bin/activate
cd team_analytics/personal/yan.jin@doordash.com/asa_friction_study
python load_data.py && python analysis.py && python report.py
```

### Next Steps for Users
1. **Validate** assumptions with Zoe/Coki (queue definitions, live order logic)
2. **Pilot** with 3 queue clusters (Week 2-3)
3. **Rollout** in phases (Week 4+)
4. **Enhance** with C&R and defect data when available

### Technical Details
- **Dependencies**: Python 3.11, pandas, numpy, matplotlib, seaborn, snowflake-connector
- **Data source**: `edw.opex.fact_support_sla_by_queue_cluster`
- **Time period**: Jan 1 - Mar 31, 2026 (90 days, captures seasonality)
- **Sample size**: 26,794+ contacts across 194 clusters
- **Execution time**: ~1 minute total

---

## ASA Friction Study: Original Analysis (2026-04-01)

### Project Details
- **Metric**: ASA (Average Speed of Answer) - wait time by queue cluster
- **Scope**: Queue cluster level (not individual queue level)
- **Key Insight**: P90/P99 compressed because staffing is healthy

### Framework & Hypothesis (GSIO Analysis Docs)
**Core Finding**: Short waits can't improve satisfaction, but long waits degrade it
- Current 120s SLA lacks research backing
- Weak correlation: Wait time → DWR within 0-90s range
- **Strong correlation**: Wait time → abandonment (0.2% baseline)
- **Goal**: Prevent deterioration, not improve baseline

### Session Parameters (Confirmed)
✅ Live Order Definition: order_status NOT IN ('completed', 'cancelled', 'released')
✅ DWR Guardrail: > 70%
✅ Channels: Chat + Phone
✅ Customer Types: Consumer + Dasher
✅ Time Period: 12 months
✅ Queue Clusters: All 194 clusters
