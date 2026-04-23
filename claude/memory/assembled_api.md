---
name: Assembled API Reference
description: Key endpoints, object schemas, and auth for the Assembled WFM API at api.assembledhq.com
type: reference
---

## Auth
- Base URL: `https://api.assembledhq.com/v0/`
- HTTP Basic Auth: API key as username, no password (`-u sk_live_XXX:`)
- Rate limit: 300 req/min, bursts up to 20

## Key Endpoints

### People (Agents)
**`GET /v0/people`** — lists agents with full profile
- Query params: `site` (uuid), `team` (uuid), `queue` (uuid), `skill` (uuid), `search` (string), `limit` (max 500), `offset`
- Response includes: `people` dict, `teams` dict, `sites` dict
- Person object fields: `id`, `agent_id`, `first_name`, `last_name`, `email`, `site` (uuid), `teams` (list[uuid]), `queues` (list[uuid]), `skills` (list[uuid]), `channels` (list[string]), `staffable`, `deleted`
- ⚠️ MCP `get_agents` tool calls wrong endpoint (returns 404). Use `curl` or `Bash` to call `/v0/people` directly.

### Activities (Schedules)
**`GET /v0/activities`** — scheduled events on the staffing timeline
- Required: `start_time` (unix), `end_time` (unix)
- Optional: `include_agents=true`, `include_activity_types=true`, `team`, `channel`, `agents` (list), `types` (list)
- Response: `activities` dict (keyed by id_with_timestamps), plus optional `agents` and `queues` dicts
- Activity fields: `id`, `agent_id`, `type_id`, `start_time`, `end_time`, `description`
- ⚠️ MCP `get_schedules` returns only activities (no agent names/skills/queues). Use `/v0/activities?include_agents=true` instead.

### Filters
- **`GET /v0/sites`** — all sites (id, name). Use to find TaskUs site UUID.
- **`GET /v0/queues`** — all queues (id, name, parent_id)
- **`GET /v0/skills`** — all skills (id, name, parent_id)
- **`GET /v0/teams`** — all teams (id, name, parent_id)

### Activity Types
**`GET /v0/activity_types`** — shift types with name, channels, productive flag

## Staffing Timeline Export — Correct Approach
To replicate what Assembled's UI shows (Agent, Email, Skill, Queue, Schedule):
1. `GET /v0/sites` → find TaskUs site UUIDs
2. `GET /v0/people?site=<uuid>&limit=500` → get all TaskUs agents with their skill/queue UUIDs
3. `GET /v0/skills` + `GET /v0/queues` → build ID→name lookup maps
4. `GET /v0/activities?start_time=X&end_time=Y&include_agents=true` + filter by TaskUs agent IDs
5. Join everything into a CSV: Agent Name, Email, Skill (name), Queue (name), Shift Start, Shift End

## Notes
- The "Skill" column in the UI = agent's assigned `skills` list from `/v0/people`
- The "Queue" column in the UI = agent's assigned `queues` list from `/v0/people`
- These are agent-level assignments, not per-activity
- Site filter on `/v0/people` is the right way to scope to TaskUs
