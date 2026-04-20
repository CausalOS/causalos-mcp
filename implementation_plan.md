# Implementation Plan: CausalOS V2 Unification (MCP x Runtime)

This plan outlines the steps to refactor `causalos-mcp` from a standalone implementation into a unified gRPC bridge that leverages the `causalos-runtime` (Rust Kernel) as its "Source of Truth."

## User Review Required

> [!IMPORTANT]
> This change will remove the local `sql.js` (SQLite) and `natural` (semantic engine) logic from the MCP server. All memory will now be centralized in the Rust Sidecar's `causal_ledger.bin`. Ensure the Sidecar is always running on port `50051`.

> [!WARNING]
> This refactor will introduce a hard dependency on the Rust Kernel. The MCP server will no longer function in "standalone" mode without the Sidecar.

## Proposed Changes

### 1. Dependency & Protocol Layer
The first step is to enable gRPC communication within the Node.js project.

#### [MODIFY] [package.json](file:///E:/causalos-mcp/package.json)
- Add `@grpc/grpc-js` and `@grpc/proto-loader`.
- Remove `sql.js` and `natural` (post-refactor).

#### [NEW] [proto/kernel.proto](file:///E:/causalos-mcp/proto/kernel.proto)
- Sync the service definitions from the `causalos-runtime` repository to ensure typed communication.

### 2. Integration Layer (The Bridge)
We will replace the local logic engines with gRPC service calls.

#### [NEW] [src/client.ts](file:///E:/causalos-mcp/src/client.ts)
- Implement the `KernelClient` using `@grpc/grpc-js`.
- Provide helper methods for `evaluatePlan`, `prepareToolCall`, and `recordOutcome`.

#### [MODIFY] [src/index.ts](file:///E:/causalos-mcp/src/index.ts)
- Refactor `context_build` to call `EvaluatePlan`.
- Refactor `causal_check` to call `PrepareToolCall`.
- Refactor `causal_record` to call `RecordOutcome`.
- Refactor `causal_history` to call `GetCausalTrace`.

---

## Verification Plan

### Automated Tests
1.  **gRPC Connectivity Test**: Run `npm test` with a mock gRPC server to ensure the client-server handshake works.
2.  **Tool Mapping Test**: Verify that calling `context_build` on the MCP correctly triggers an `EvaluatePlan` call to the Sidecar.

### Manual Verification
1.  **Sidecar Launch**: Start the Rust kernel: `cargo run -p sidecar`.
2.  **MCP Launch**: Start the refactored MCP: `npx causalos-mcp`.
3.  **End-to-End Cycle**: Run a task in the agent (e.g., Cline) and verify that the "Causal Ledger" binary file increases in size, confirming the data is flowing through the bridge to the kernel.
