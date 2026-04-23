#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.ASSEMBLED_API_KEY;
const BASE_URL = "https://api.assembledhq.com/v0";
const API_VERSION = "2025-04-15";

if (!API_KEY) {
  console.error("Error: ASSEMBLED_API_KEY environment variable is required");
  process.exit(1);
}

const authHeader = "Basic " + Buffer.from(API_KEY + ":").toString("base64");

async function assembledFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "Assembled-Version": API_VERSION,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Assembled API error ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new Server(
  { name: "assembled", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_agents",
      description: "List all agents/people in Assembled with their profile, teams, queues, and channel assignments",
      inputSchema: {
        type: "object",
        properties: {
          email: { type: "string", description: "Filter by agent email" },
          team_id: { type: "string", description: "Filter by team ID" },
        },
      },
    },
    {
      name: "get_agent_states",
      description: "Get real-time agent states and current availability/status",
      inputSchema: {
        type: "object",
        properties: {
          agent_ids: {
            type: "array",
            items: { type: "string" },
            description: "List of agent IDs to get states for",
          },
        },
      },
    },
    {
      name: "get_schedules",
      description: "Get scheduled activities for agents within a time window",
      inputSchema: {
        type: "object",
        properties: {
          start_time: { type: "string", description: "ISO 8601 start datetime (e.g. 2026-04-08T00:00:00Z)" },
          end_time: { type: "string", description: "ISO 8601 end datetime" },
          agent_ids: {
            type: "array",
            items: { type: "string" },
            description: "Optional: filter by specific agent IDs",
          },
        },
        required: ["start_time", "end_time"],
      },
    },
    {
      name: "get_queues",
      description: "List all queues in Assembled",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_teams",
      description: "List all teams in Assembled",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_forecast",
      description: "Get volume forecasts for queues by channel and time range",
      inputSchema: {
        type: "object",
        properties: {
          queue_id: { type: "string", description: "Queue ID to get forecast for" },
          start_time: { type: "string", description: "ISO 8601 start datetime" },
          end_time: { type: "string", description: "ISO 8601 end datetime" },
          channel: {
            type: "string",
            enum: ["phone", "email", "chat", "sms", "social"],
            description: "Support channel",
          },
        },
        required: ["queue_id", "start_time", "end_time"],
      },
    },
    {
      name: "get_adherence",
      description: "Get agent schedule adherence and performance metrics",
      inputSchema: {
        type: "object",
        properties: {
          start_time: { type: "string", description: "ISO 8601 start datetime" },
          end_time: { type: "string", description: "ISO 8601 end datetime" },
          agent_ids: {
            type: "array",
            items: { type: "string" },
            description: "Optional: filter by specific agent IDs",
          },
        },
        required: ["start_time", "end_time"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case "get_agents": {
        const params = new URLSearchParams();
        if (args?.email) params.set("email", String(args.email));
        if (args?.team_id) params.set("team_id", String(args.team_id));
        result = await assembledFetch(`/agents?${params}`);
        break;
      }

      case "get_agent_states": {
        const params = new URLSearchParams();
        if (args?.agent_ids && Array.isArray(args.agent_ids)) {
          args.agent_ids.forEach((id: string) => params.append("agent_ids", id));
        }
        result = await assembledFetch(`/agent_states?${params}`);
        break;
      }

      case "get_schedules": {
        const params = new URLSearchParams({
          start_time: String(args?.start_time),
          end_time: String(args?.end_time),
        });
        if (args?.agent_ids && Array.isArray(args.agent_ids)) {
          args.agent_ids.forEach((id: string) => params.append("agent_ids", id));
        }
        result = await assembledFetch(`/activities?${params}`);
        break;
      }

      case "get_queues": {
        result = await assembledFetch("/queues");
        break;
      }

      case "get_teams": {
        result = await assembledFetch("/teams");
        break;
      }

      case "get_forecast": {
        const params = new URLSearchParams({
          queue_id: String(args?.queue_id),
          start_time: String(args?.start_time),
          end_time: String(args?.end_time),
        });
        if (args?.channel) params.set("channel", String(args.channel));
        result = await assembledFetch(`/forecast?${params}`);
        break;
      }

      case "get_adherence": {
        const params = new URLSearchParams({
          start_time: String(args?.start_time),
          end_time: String(args?.end_time),
        });
        if (args?.agent_ids && Array.isArray(args.agent_ids)) {
          args.agent_ids.forEach((id: string) => params.append("agent_ids", id));
        }
        result = await assembledFetch(`/adherence?${params}`);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Assembled MCP server running");
}

main().catch(console.error);
