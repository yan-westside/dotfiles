"""Snowflake data pull for DR experiment analysis."""

import json
import pandas as pd
import snowflake.connector


DEFAULT_CONFIG = "~/.snowflake/config.json"

QUERY_CHECK = """
SELECT COUNT(*) AS cnt
FROM proddb.public.dimension_experiment_analysis_results
WHERE analysis_id = %(analysis_id)s
  AND metric_value IS NOT NULL
LIMIT 1
"""

QUERY_PULL = """
SELECT
    analysis_id,
    analysis_name,
    metric_name,
    COALESCE(dimension_name, 'overall') AS dimension_name,
    variant_name,
    metric_value,
    metric_impact_absolute,
    metric_impact_absolute_global_lift,
    p_value
FROM proddb.public.dimension_experiment_analysis_results
WHERE analysis_id = %(analysis_id)s
  AND metric_value IS NOT NULL
  AND COALESCE(dimension_name, 'overall') = 'overall'
ORDER BY metric_name, variant_name
"""


def _connect(config_path: str = DEFAULT_CONFIG):
    import os

    # Prefer environment variables (most DD analysts have these in .zshrc)
    env_user = os.environ.get("SNOWFLAKE_USER")
    env_account = os.environ.get("SNOWFLAKE_ACCOUNT", "DOORDASH")
    env_warehouse = os.environ.get("SNOWFLAKE_WAREHOUSE", "TEAM_DATA_ANALYTICS")
    env_database = os.environ.get("SNOWFLAKE_DATABASE", "PRODDB")
    env_schema = os.environ.get("SNOWFLAKE_SCHEMA", "PUBLIC")

    if env_user:
        return snowflake.connector.connect(
            account=env_account,
            user=env_user,
            authenticator="externalbrowser",
            warehouse=env_warehouse,
            database=env_database,
            schema=env_schema,
        )

    # Fall back to config file
    path = os.path.expanduser(config_path)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"No SNOWFLAKE_USER env var and no config at {path}. "
            "Set SNOWFLAKE_USER in your shell, or create ~/.snowflake/config.json with: "
            '{"account": "DOORDASH", "user": "YOUR.NAME", "warehouse": "TEAM_DATA_ANALYTICS", '
            '"database": "PRODDB", "schema": "PUBLIC"}'
        )
    with open(path) as f:
        config = json.load(f)
    return snowflake.connector.connect(
        account=config["account"],
        user=config["user"],
        authenticator="externalbrowser",
        warehouse=config["warehouse"],
        database=config["database"],
        schema=config["schema"],
    )


def check_data_exists(analysis_id: str, config_path: str = DEFAULT_CONFIG) -> bool:
    """Check if Snowflake has data for this analysis_id."""
    conn = _connect(config_path)
    try:
        cur = conn.cursor()
        cur.execute(QUERY_CHECK, {"analysis_id": analysis_id})
        row = cur.fetchone()
        return row is not None and row[0] > 0
    finally:
        conn.close()


def pull_metrics(analysis_id: str, config_path: str = DEFAULT_CONFIG) -> pd.DataFrame:
    """Pull all overall-dimension metrics for an analysis."""
    conn = _connect(config_path)
    try:
        cur = conn.cursor()
        cur.execute(QUERY_PULL, {"analysis_id": analysis_id})
        columns = [d[0] for d in cur.description]
        rows = cur.fetchall()
        return pd.DataFrame(rows, columns=columns)
    finally:
        conn.close()


def list_variants(df: pd.DataFrame) -> list[str]:
    """Return non-control variant names.

    Control is detected by having >80% null p_value rows.
    """
    variants = df["VARIANT_NAME"].unique().tolist()
    non_control = []
    for v in variants:
        subset = df[df["VARIANT_NAME"] == v]
        null_pct = subset["P_VALUE"].isna().mean()
        if null_pct < 0.8:
            non_control.append(v)
    return sorted(non_control)


def infer_coverage(df: pd.DataFrame, variant: str) -> float | None:
    """Infer experiment coverage ratio from global_lift / absolute_impact.

    Returns median ratio across metrics where both values are non-null and
    absolute_impact != 0, or None if not enough data.
    """
    vdf = df[df["VARIANT_NAME"] == variant].copy()
    mask = (
        vdf["METRIC_IMPACT_ABSOLUTE"].notna()
        & vdf["METRIC_IMPACT_ABSOLUTE_GLOBAL_LIFT"].notna()
        & (vdf["METRIC_IMPACT_ABSOLUTE"].abs() > 1e-12)
    )
    valid = vdf[mask]
    if len(valid) < 3:
        return None
    ratios = (
        valid["METRIC_IMPACT_ABSOLUTE_GLOBAL_LIFT"] / valid["METRIC_IMPACT_ABSOLUTE"]
    )
    # Filter outliers: keep ratios in (0, 1]
    ratios = ratios[(ratios > 0) & (ratios <= 1.0)]
    if len(ratios) < 3:
        return None
    return round(float(ratios.median()), 4)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m dr_pipeline.pull <analysis_id>")
        sys.exit(1)

    aid = sys.argv[1]
    print(f"Checking data for {aid}...")
    if check_data_exists(aid):
        print("Data exists. Pulling...")
        df = pull_metrics(aid)
        variants = list_variants(df)
        print(f"Rows: {len(df)}")
        print(f"Variants (non-control): {variants}")
        print(f"Metrics: {df['METRIC_NAME'].nunique()}")
    else:
        print("No data found for this analysis_id.")
