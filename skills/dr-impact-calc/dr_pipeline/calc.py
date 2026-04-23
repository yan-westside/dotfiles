"""L1/L2/L3 DR impact calculation engine.

Fetches metric level categorization dynamically from Google Sheet,
then applies booking rules to experiment data.
"""

import json
import subprocess
import sys
from dataclasses import dataclass, field

import pandas as pd

METRIC_LEVELS_SPREADSHEET = "1iuahqPU14BGfjpGJ0MVZoHAXTl7fgJLKXrfIa-i7iR0"
SIG_THRESHOLD = 0.05


@dataclass
class MetricResult:
    name: str
    abs_impact: float  # raw decimal from Snowflake
    bps: float  # converted: -abs_impact * 10000 (DR decrease = positive)
    p_value: float
    is_sig: bool


@dataclass
class DRResult:
    # L1
    l1: MetricResult | None = None

    # L2: all metrics + sig sum
    l2_metrics: list[MetricResult] = field(default_factory=list)
    l2_sig_sum_bps: float = 0.0

    # L3: all metrics + sig sum
    l3_metrics: list[MetricResult] = field(default_factory=list)
    l3_sig_sum_bps: float = 0.0

    # Missing metrics (expected but not in data)
    missing_metrics: list[str] = field(default_factory=list)

    # Analysis metadata
    analysis_id: str = ""
    variant: str = ""


def fetch_metric_levels() -> dict[str, list[str]]:
    """Read L1/L2/L3 categorization from Google Sheet via gws CLI.

    Returns: {"L1": [...], "L2": [...], "L3": [...]}
    """
    result = subprocess.run(
        [
            "gws", "sheets", "spreadsheets", "get",
            "--params", json.dumps({
                "spreadsheetId": METRIC_LEVELS_SPREADSHEET,
                "ranges": "A1:B100",
                "fields": "sheets.data.rowData.values.formattedValue",
            }),
            "--format", "json",
        ],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        print(f"ERROR reading metric levels: {result.stderr[:300]}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(result.stdout)
    rows = data["sheets"][0]["data"][0].get("rowData", [])

    levels = {"L1": [], "L2": [], "L3": []}
    for row in rows[1:]:  # skip header
        vals = row.get("values", [])
        if len(vals) < 2:
            continue
        metric = vals[0].get("formattedValue", "").strip()
        level = vals[1].get("formattedValue", "").strip()
        if metric and level in levels:
            levels[level].append(metric)

    return levels


def calculate_impact(
    df: pd.DataFrame,
    variant: str,
    levels: dict[str, list[str]],
) -> DRResult:
    """Calculate DR impact using L1/L2/L3 booking rules.

    Sign convention: DR decrease (abs_impact < 0) = improvement = positive bps.
    So bps = -abs_impact * 10000.
    """
    result = DRResult(analysis_id=df["ANALYSIS_ID"].iloc[0] if len(df) > 0 else "", variant=variant)

    # Filter to chosen variant
    vdf = df[df["VARIANT_NAME"] == variant].copy()
    if vdf.empty:
        print(f"WARNING: No data for variant '{variant}'", file=sys.stderr)
        return result

    # Build lookup: metric_name -> (abs_impact, p_value)
    metrics = {}
    for _, row in vdf.iterrows():
        mn = row["METRIC_NAME"]
        abs_imp = row["METRIC_IMPACT_ABSOLUTE"]
        p = row["P_VALUE"]
        if pd.notna(abs_imp) and pd.notna(p):
            metrics[mn] = (float(abs_imp), float(p))

    # All expected metrics from levels
    all_expected = set(levels.get("L1", []) + levels.get("L2", []) + levels.get("L3", []))

    # Check for missing
    for m in all_expected:
        if m not in metrics:
            result.missing_metrics.append(m)

    def make_result(name: str) -> MetricResult | None:
        if name not in metrics:
            return None
        abs_imp, p = metrics[name]
        bps = -abs_imp * 10000
        return MetricResult(
            name=name,
            abs_impact=abs_imp,
            bps=bps,
            p_value=p,
            is_sig=p < SIG_THRESHOLD,
        )

    # L1
    for m in levels.get("L1", []):
        mr = make_result(m)
        if mr:
            result.l1 = mr

    # L2
    for m in levels.get("L2", []):
        mr = make_result(m)
        if mr:
            result.l2_metrics.append(mr)
    result.l2_sig_sum_bps = sum(m.bps for m in result.l2_metrics if m.is_sig)

    # L3
    for m in levels.get("L3", []):
        mr = make_result(m)
        if mr:
            result.l3_metrics.append(mr)
    result.l3_sig_sum_bps = sum(m.bps for m in result.l3_metrics if m.is_sig)

    return result


def format_result(result: DRResult, scale_pct: float = 1.0) -> str:
    """Format DRResult as human-readable text."""
    lines = []
    lines.append("=" * 70)
    lines.append(f"Analysis: {result.analysis_id} | Variant: {result.variant}")
    lines.append("=" * 70)

    # L1
    lines.append("\nL1: defect_ratio_overall")
    if result.l1:
        sig = "**SIG**" if result.l1.is_sig else "not sig"
        lines.append(f"  {result.l1.name:<50} {result.l1.bps:+.2f} bps  p={result.l1.p_value:.4f}  {sig}")
    else:
        lines.append("  (not found in data)")

    # L2
    lines.append(f"\nL2: Owner-level metrics (sig sum: {result.l2_sig_sum_bps:+.2f} bps)")
    for m in sorted(result.l2_metrics, key=lambda x: x.p_value):
        sig = "**SIG**" if m.is_sig else ""
        lines.append(f"  {m.name:<50} {m.bps:+.2f} bps  p={m.p_value:.4f}  {sig}")

    # L3
    lines.append(f"\nL3: Individual defect metrics (sig sum: {result.l3_sig_sum_bps:+.2f} bps)")
    for m in sorted(result.l3_metrics, key=lambda x: x.p_value):
        sig = "**SIG**" if m.is_sig else ""
        lines.append(f"  {m.name:<50} {m.bps:+.2f} bps  p={m.p_value:.4f}  {sig}")

    # Missing
    if result.missing_metrics:
        lines.append(f"\nMISSING METRICS ({len(result.missing_metrics)}):")
        for m in sorted(result.missing_metrics):
            lines.append(f"  - {m}")

    # Scale
    lines.append(f"\nScale: {scale_pct*100:.1f}%")
    if result.l1:
        lines.append(f"L1 scaled: {result.l1.bps * scale_pct:+.2f} bps")
    lines.append(f"L2 sig scaled: {result.l2_sig_sum_bps * scale_pct:+.2f} bps")
    lines.append(f"L3 sig scaled: {result.l3_sig_sum_bps * scale_pct:+.2f} bps")

    return "\n".join(lines)


if __name__ == "__main__":
    # Standalone test: python -m dr_pipeline.calc <analysis_id> <variant> [scale_pct]
    if len(sys.argv) < 3:
        print("Usage: python -m dr_pipeline.calc <analysis_id> <variant> [scale_pct]")
        sys.exit(1)

    from dr_pipeline.pull import pull_metrics

    aid = sys.argv[1]
    variant = sys.argv[2]
    scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0

    print("Fetching metric levels from Google Sheet...")
    levels = fetch_metric_levels()
    print(f"  L1: {len(levels['L1'])} metrics, L2: {len(levels['L2'])}, L3: {len(levels['L3'])}")

    print(f"Pulling data for {aid}...")
    df = pull_metrics(aid)
    print(f"  {len(df)} rows")

    result = calculate_impact(df, variant, levels)
    print(format_result(result, scale))
