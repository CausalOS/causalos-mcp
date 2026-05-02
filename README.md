# CausalOS v1: Cloud-Native Deterministic Governance

> **"Govern the future from the edge."**

CausalOS v1 is the production-grade **Deterministic Governance Layer** for AI agents. It transitions the project to a **Cloud-First Architecture**, providing high-integrity safety guardrails and institutional causal memory without the overhead of local Rust kernels.

---

## 🚀 Cloud-Native Architecture

v1 centralizes governance in the **Causal Cloud**, while keeping the data plane local:

1.  **Control Plane (Causal Cloud)**: A high-performance Rust runtime hosted at `mcp.causalos.xyz` that manages the **Global Causal Ledger** and enforces **Plan Contracts**.
2.  **Data Plane (The Bridge)**: A lightweight Node.js client installed via `npm` that redacts secrets and interfaces with the Cloud Runtime via secure HTTPS.

---

## ✨ Key Features in v1

- **Cloud-First Governance**: Instant setup with `npm install causalos`. No local sidecars or compilation required.
- **Privacy Sanitizer**: Mandatory local redaction of secrets, PII, and API keys before any data leaves your environment.
- **Plan Contracts**: Deterministic safety requirements and instruction patches injected into agent context via `context_build`.
- **Hard Safety Gates**: Real-time blocking of high-risk tool calls based on global failure densities.
- **Institutional Memory**: Share failure patterns across your entire team to prevent redundant errors.

---

## ⚡ Quickstart

### 1. Configure the MCP Bridge
Add the following to your `claude_desktop_config.json` (or equivalent):

```json
{
  "mcpServers": {
    "causalos": {
      "command": "npx",
      "args": ["-y", "causalos"],
      "env": {
        "CAUSAL_RUNTIME_URL": "https://cloud-runtime-production.up.railway.app",
        "CAUSAL_API_KEY": "sk-your-api-key-from-causalos-xyz"
      }
    }
  }
}
```

### 2. Get an API Key
Visit the dashboard at [mcp.causalos.xyz](https://mcp.causalos.xyz) to generate your `CAUSAL_API_KEY`.

---

## 🧠 The v1 System Prompt

To enable the governance loop, add this to your agent's system prompt:

```markdown
### Deterministic Governance Protocol (CausalOS)

You are equipped with a CausalOS Governance Layer. You MUST follow this high-integrity protocol:

1. **Contract Signing (`context_build`)**: Call this before ANY task to receive your `contract_hash` and `instruction_patch`.
2. **Execution Broker (`causalos_execute`)**: Use this tool for ALL actions with side effects (Shell, Write, Delete).
3. **Loop Closure (`causal_record`)**: Call this after significant events to update the Causal Ledger in the cloud.
```

---

## 🛡️ Privacy & Performance

- ✅ **Privacy First**: The local bridge redacts all sensitive data before it hits the network.
- ✅ **Ultra Low Latency**: <12ms total overhead via edge-optimized routing.
- ✅ **Institutional Safety**: One agent's failure becomes every agent's protection.
- ✅ **Zero Hallucination**: Outcome hashes ensure total memory integrity.

---

[Full Documentation](https://docs.causalos.com) | [Core Concepts](https://docs.causalos.com/essentials/core-concepts) | [Architecture](https://docs.causalos.com/essentials/architecture)
