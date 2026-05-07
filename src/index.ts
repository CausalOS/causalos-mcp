#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { kernel } from "./client.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const CONFIG_DIR = path.join(os.homedir(), ".causalos");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

// ─── CLI Command Dispatcher ───────────────────────────────────────────────────
const arg = process.argv[2];

if (arg === "init") {
    await init();
} else if (arg === "log" || arg === "logs") {
    await showLogs();
} else if (arg === "--version" || arg === "-v") {
    console.log("Termyte (CausalOS) v0.2.0");
    process.exit(0);
} else if (arg === "--help" || arg === "-h") {
    showHelp();
} else {
    // Default: Start MCP Server
    startMcpServer();
}

async function init() {
    console.log("🚀 Initializing Termyte Governance...");
    
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
        
        let config: any = {};
        try {
            config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf-8"));
        } catch (e) {}

        if (!config.device_id) {
            config.device_id = uuidv4();
            await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
            console.log(`✅ Generated Device ID: ${config.device_id}`);
        } else {
            console.log(`ℹ️ Existing Device ID found: ${config.device_id}`);
        }

        console.log("\nNext Steps:");
        console.log("1. Add Termyte to your coding agent (Claude Code, Cursor, etc.)");
        console.log("2. Set CAUSALOS_API_URL if using a custom runtime.");
        console.log("3. Run 'npx causalos log' to see governance events in real-time.");
        
        process.exit(0);
    } catch (err: any) {
        console.error(`❌ Init failed: ${err.message}`);
        process.exit(1);
    }
}

async function showLogs() {
    try {
        const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf-8"));
        const deviceId = config.device_id;
        const apiUrl = process.env.CAUSALOS_API_URL || "https://mcp.causalos.xyz";

        console.log(`\n📋 Termyte Governance Logs [${deviceId}]\n`);

        const resp = await axios.get(`${apiUrl}/v1/governance/logs`, {
            headers: { "x-causalos-device-id": deviceId }
        });

        const logs = resp.data;
        if (logs.length === 0) {
            console.log("No events recorded yet.");
        } else {
            logs.forEach((l: any) => {
                const icon = l.verdict === "ALLOW" ? "✅" : l.verdict === "BLOCK" ? "🚫" : "❓";
                console.log(`${icon} [${l.timestamp}] ${l.tool_name} -> ${l.verdict}`);
                if (l.reason) console.log(`   Reason: ${l.reason}`);
                if (l.success !== null) console.log(`   Outcome: ${l.success ? "Success" : "Failed"}`);
                console.log("");
            });
        }
    } catch (err: any) {
        console.error(`❌ Failed to fetch logs: ${err.message}`);
    }
    process.exit(0);
}

function showHelp() {
    console.log(`
Termyte — Terminal Governance for Coding Agents

Usage:
  npx causalos init        Setup local device-id and config
  npx causalos log         Show recent governance events
  npx causalos             Start MCP Server (Standard IO)

Governance:
  Termyte intercepts agent actions, evaluates them against a deterministic 
  sandbox and LLM judge, and records everything in a secure ledger.
`);
    process.exit(0);
}

// ─── MCP Server ──────────────────────────────────────────────────────────────
async function startMcpServer() {
    const server = new McpServer({
        name: "causalos",
        version: "0.2.0",
    });

    server.registerTool(
        "causal_guard",
        {
            description: "Safety wrapper for sensitive operations. Call this before running commands or writing files.",
            inputSchema: z.object({
                tool_name: z.string(),
                payload: z.any(),
                session_id: z.string().optional(),
            }),
        },
        async ({ tool_name, payload, session_id }: any) => {
            const sessionId = session_id || "adhoc";
            const verdict = await kernel.prepareToolCall(sessionId, tool_name, payload);

            if (verdict.verdict === "BLOCK") {
                return {
                    content: [{ type: "text", text: `🚫 Termyte BLOCK: ${verdict.reason}` }],
                    isError: true
                };
            }

            return {
                content: [{ 
                    type: "text", 
                    text: JSON.stringify({
                        status: "ALLOW",
                        tool_call_id: verdict.tool_call_id,
                        reason: verdict.reason
                    }, null, 2)
                }]
            };
        }
    );

    server.registerTool(
        "causalos_execute",
        {
            description: "Safety wrapper for sensitive operations. Call this before running commands or writing files.",
            inputSchema: z.object({
                tool_name: z.string(),
                payload: z.any(),
                session_id: z.string().optional(),
            }),
        },
        async ({ tool_name, payload, session_id }: any) => {
            const sessionId = session_id || "adhoc";
            const verdict = await kernel.prepareToolCall(sessionId, tool_name, payload);

            if (verdict.verdict === "BLOCK") {
                return {
                    content: [{ type: "text", text: `🚫 Termyte BLOCK: ${verdict.reason}` }],
                    isError: true
                };
            }

            return {
                content: [{ 
                    type: "text", 
                    text: JSON.stringify({
                        status: "ALLOW",
                        tool_call_id: verdict.tool_call_id,
                        reason: verdict.reason
                    }, null, 2)
                }]
            };
        }
    );

    server.registerTool(
        "record_outcome",
        {
            description: "Closes the loop on a tool execution. Call this after completing an action.",
            inputSchema: z.object({
                tool_call_id: z.string(),
                success: z.boolean(),
                outcome: z.any().optional(),
                exit_code: z.number().optional(),
            }),
        },
        async ({ tool_call_id, success, outcome, exit_code }: any) => {
            await kernel.commitToolCall(tool_call_id, outcome, success, exit_code);
            return {
                content: [{ type: "text", text: "Outcome recorded." }]
            };
        }
    );

    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
    } catch (err) {
        console.error("MCP Server Error:", err);
    }
}
