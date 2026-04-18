# Core Concepts

CausalOS is built on a few key architectural pillars that ensure it learns reliably without human intervention.

## 1. The Learning Loop

Traditional agents are stateless. CausalOS introduces a 4-step loop that persists across sessions:

1.  **Build**: At the start of a task, `context_build` creates a **Temporal Anchor**.
2.  **Act**: The agent performs its task, consulting `causal_check` for risky actions.
3.  **Record**: `causal_record` captures the outcome once the action is done.
4.  **Learn**: On the next run, `context_build` surfaces the lessons from step 3.

## 2. Soft-State Temporal Anchors

To solve the problem of "missing signals" (when an agent crashes or the user stops it), CausalOS uses **Temporal Anchors**.

- Every task start generates an `anchor_id`.
- This anchor has a **Time-To-Live (TTL)**.
- If a new task starts *before* the previous anchor is resolved via `causal_record`, CausalOS infers that the previous task was interrupted or failed.
- This allows the system to learn from "silent failures" that other memory systems miss.

## 3. Signal Weighting

CausalOS doesn't just take the agent's word for success. it uses a weighted signal hierarchy:

| Signal Source | Type | Weight | Reliability |
| :--- | :--- | :--- | :--- |
| **Human** | Interruption / Correction | **1.0** | Absolute |
| **System** | Exit Code / API Error | **0.8** | High |
| **Agent** | Self-Assessment | **0.5** | Moderate |

The final "Success" or "Failure" label in the database is a derivation of these filtered signals.

## 5. Semantic Intelligence (Stemming)

CausalOS doesn't rely on exact text matches. It uses a **Porter Stemming** algorithm and **Dice Coefficient** to understand the intent behind a task.

- **Normalization**: "deleting logs" and "deleted log" are both reduced to their root forms ("delet log").
- **Fuzzy Matching**: This allows the system to surface relevant failures even if the agent describes the task slightly differently each time.
- **Performance**: The entire matching process is local and executes in <10ms, ensuring no cognitive lag for the agent.

## 6. Global Memory & Origin Tagging

Patterns learned in one project can prevent failures in another. CausalOS implements **Cross-Project Global Memory**:

- **Search**: When you start a task, CausalOS searches across *all* project entries in your local database.
- **Prioritization**: Local project results are always prioritized, but relevant "Global" patterns are injected if they have high confidence.
- **Tagging**: Global patterns are clearly tagged in the instruction patch (e.g., `[GLOBAL (repo: user-auth-service)]`). This gives the agent context on where the lesson was learned.
- **Privacy**: Only the high-level pattern/action/repo-name is shared globally within your machine; deep execution logs remain private to the project they occurred in.

---

[← Getting Started](getting-started.md) | [Tool Reference →](tool-reference.md)
