---
name: Google Sheets → Snowflake Upload Pattern
description: Correct auth method and SnowflakeHook call pattern for uploading a Google Sheet to Snowflake
type: reference
---

## Auth (Google Sheets)

Use the MCP OAuth token — **not** ADC (`~/.config/gcloud/application_default_credentials.json`), which lacks Sheets scope.

```python
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

TOKEN_PATH = Path.home() / ".awesome-mcps/google-workspace/token.json"

def load_credentials():
    import json
    with open(TOKEN_PATH) as f:
        tok = json.load(f)
    # Do NOT pass scopes= — the token was granted fixed scopes at auth time
    creds = Credentials(
        token=None,
        refresh_token=tok["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=tok["client_id"],
        client_secret=tok["client_secret"],
    )
    creds.refresh(Request())
    return creds
```

Then:
```python
import gspread
gc = gspread.authorize(creds)
ws = gc.open_by_key(SHEET_ID).worksheet(TAB_NAME)
data = ws.get_all_values()   # list of lists; row 0 = header
```

## SnowflakeHook Upload Pattern

`write_to_snowflake(mode="overwrite")` requires the table to already exist.
`create_and_populate_table` creates it but has no mode param — always appends after create.

**Correct pattern (create-or-replace)**:

```python
TARGET_DB     = "proddb"
TARGET_SCHEMA = "yanjin"   # user's personal schema
TARGET_TABLE  = "my_table_name"
TARGET        = f"{TARGET_DB}.{TARGET_SCHEMA}.{TARGET_TABLE}"

with SnowflakeHook(database=TARGET_DB, schema=TARGET_SCHEMA) as sf:
    sf.query_without_result(f"DROP TABLE IF EXISTS {TARGET}")
    sf.create_and_populate_table(df, TARGET_TABLE, schema=TARGET_SCHEMA, database=TARGET_DB)
```

**Important**: Pass `database=` and `schema=` both to the `SnowflakeHook` constructor AND to `create_and_populate_table`. Pass only the bare table name (not `db.schema.table`) to `create_and_populate_table` and `write_to_snowflake` — the hook prepends db/schema automatically, so passing the full path causes double-prefixing (`PRODDB.YANJIN.PRODDB.YANJIN.TABLE`).

`grant_access` (called automatically by `write_to_snowflake`) grants:
- `SELECT` → `read_only_users` role
- `ALL` → `sysadmin` role

## Reference Script

`team_analytics/personal/yan.jin@doordash.com/aop_vff_staffing/upload_bpo_staffing.py`
