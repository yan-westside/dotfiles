"""Methodology comparison: Pak Tao (CXI) vs DxLx booking rules."""

from dataclasses import dataclass
from dr_pipeline.calc import DRResult


@dataclass
class MethodologyComparison:
    # Pak Tao (CXI): L1 if sig → else min(abs(L1), abs(L3 sig sum))
    paktao_level: str  # "L1", "L3", or "none"
    paktao_bps_raw: float
    paktao_bps_scaled: float

    # DxLx: L1 if sig → else max(abs(L1), abs(L3 sig sum))
    proposed_level: str  # "L1", "L3", or "none"
    proposed_bps_raw: float
    proposed_bps_scaled: float

    # Discrepancy
    agree: bool
    reason: str  # empty if agree, explanation if not


def compare(result: DRResult, scale_pct: float = 1.0) -> MethodologyComparison:
    """Compare Pak Tao vs DxLx methodology for a single experiment.

    Both methods: if L1 is stat sig → book L1. L2 is skipped entirely.
    When L1 is NOT sig:
      - Pak Tao: book min(abs(L1), abs(L3_sig_sum))
      - DxLx:    book max(abs(L1), abs(L3_sig_sum))
    """

    l1_sig = result.l1 is not None and result.l1.is_sig
    l1_bps = result.l1.bps if result.l1 else 0.0
    l3_bps = result.l3_sig_sum_bps

    # Both methods agree when L1 is sig: book L1
    if l1_sig:
        pt_level, pt_bps = "L1", l1_bps
        prop_level, prop_bps = "L1", l1_bps
    elif l3_bps == 0:
        # No sig L3 metrics — L1 is the only option for both
        pt_level, pt_bps = "L1", l1_bps
        prop_level, prop_bps = "L1", l1_bps
    else:
        # L1 not sig, L3 has sig metrics — methods diverge
        # Pak Tao: smaller of the two
        if abs(l1_bps) <= abs(l3_bps):
            pt_level, pt_bps = "L1", l1_bps
        else:
            pt_level, pt_bps = "L3", l3_bps

        # DxLx: larger of the two
        if abs(l1_bps) >= abs(l3_bps):
            prop_level, prop_bps = "L1", l1_bps
        else:
            prop_level, prop_bps = "L3", l3_bps

    agree = abs(pt_bps - prop_bps) < 0.01
    reason = ""
    if not agree:
        reason = (
            f"DxLx books {prop_level} = {prop_bps:+.2f} bps (larger abs), "
            f"Pak Tao books {pt_level} = {pt_bps:+.2f} bps (smaller abs)"
        )

    return MethodologyComparison(
        paktao_level=pt_level,
        paktao_bps_raw=pt_bps,
        paktao_bps_scaled=pt_bps * scale_pct,
        proposed_level=prop_level,
        proposed_bps_raw=prop_bps,
        proposed_bps_scaled=prop_bps * scale_pct,
        agree=agree,
        reason=reason,
    )


def format_comparison(comp: MethodologyComparison) -> str:
    """Format comparison as human-readable text."""
    lines = []
    lines.append("\nMETHODOLOGY COMPARISON")
    lines.append("-" * 50)
    lines.append(f"Pak Tao:  {comp.paktao_level:>4} → {comp.paktao_bps_raw:+.2f} bps raw, {comp.paktao_bps_scaled:+.2f} bps scaled")
    lines.append(f"DxLx:     {comp.proposed_level:>4} → {comp.proposed_bps_raw:+.2f} bps raw, {comp.proposed_bps_scaled:+.2f} bps scaled")
    if comp.agree:
        lines.append("Match: YES")
    else:
        lines.append(f"Match: NO — {comp.reason}")
    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python -m dr_pipeline.compare <analysis_id> <variant> [scale_pct]")
        sys.exit(1)

    from dr_pipeline.pull import pull_metrics
    from dr_pipeline.calc import fetch_metric_levels, calculate_impact, format_result

    aid = sys.argv[1]
    variant = sys.argv[2]
    scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0

    levels = fetch_metric_levels()
    df = pull_metrics(aid)
    result = calculate_impact(df, variant, levels)
    print(format_result(result, scale))

    comp = compare(result, scale)
    print(format_comparison(comp))
