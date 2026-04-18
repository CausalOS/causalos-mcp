import type { FinalLabel, SignalsRecord } from "./db.js";

/**
 * Hybrid signal evaluator.
 *
 * Weighting hierarchy (from design spec):
 *   Human signal  → weight 1.0  (highest authority)
 *   System signal → weight 0.8
 *   Agent signal  → weight 0.5  (weakest — can hallucinate)
 */
export interface EvaluationResult {
  final_label: FinalLabel;
  confidence: number;
  reason: string;
}

export function evaluateSignals(signals: SignalsRecord): EvaluationResult {
  const { system, user, agent, logs } = signals;

  // Human override — absolute highest authority
  if (user === "negative") {
    return {
      final_label: "FAILURE",
      confidence: 1.0,
      reason: "User explicitly corrected or interrupted the action.",
    };
  }

  // Log analysis (Advanced Signal)
  const logPatterns = logs ? extractErrorPatterns(logs) : null;
  if (logPatterns) {
    return {
      final_label: "FAILURE",
      confidence: 0.9,
      reason: `Log analysis detected critical patterns: ${logPatterns}`,
    };
  }

  // System failure is strong and deterministic
  if (system === "FAILURE") {
    return {
      final_label: "FAILURE",
      confidence: 0.8,
      reason: "System reported failure (non-zero exit code or error response).",
    };
  }

  // System success + agent success = confident success
  if (system === "SUCCESS" && agent === "success") {
    return {
      final_label: "SUCCESS",
      confidence: 0.9,
      reason: "Both system and agent confirm task succeeded.",
    };
  }

  // System success only (agent absent)
  if (system === "SUCCESS") {
    return {
      final_label: "SUCCESS",
      confidence: 0.7,
      reason: "System reports success; no agent confirmation.",
    };
  }

  // Only agent signal available — low confidence
  if (agent === "success") {
    return {
      final_label: "SUCCESS",
      confidence: 0.5,
      reason: "Agent self-reported success only (unconfirmed by system).",
    };
  }

  if (agent === "failure") {
    return {
      final_label: "FAILURE",
      confidence: 0.5,
      reason: "Agent self-reported failure (unconfirmed by system).",
    };
  }

  // No usable signals
  return {
    final_label: "FAILURE",
    confidence: 0.2,
    reason: "No reliable signals available; defaulting to FAILURE for safety.",
  };
}

/**
 * Extracts error patterns from execution logs (stdout/stderr).
 * Implements a hybrid approach: specific regex heuristics for common language errors +
 * generic stack-trace detection for unknown failures.
 */
export function extractErrorPatterns(logs: string | null | undefined): string | null {
  if (!logs) return null;

  const patterns = [
    // Node.js / JavaScript
    /TypeError: .*/i,
    /SyntaxError: .*/i,
    /ReferenceError: .*/i,
    /\[ERR_[A-Z0-9_]+\]/i,
    /Cannot find module .*/i,
    /Uncaught .*/i,

    // Python
    /Traceback \(most recent call last\):/i,
    /.*Error: .*/i, // generic python error line (e.g. ValueError: ...)

    // Go
    /panic: .*/i,
    /fatal error: .*/i,

    // Java / C#
    /Exception in thread ".*" .*/i,
    /at .*\.java:\d+/i,
    /at .*\.cs:\d+/i,

    // Systems / CLI
    /Permission denied/i,
    /Command not found/i,
    /Segmentation fault/i,
    /Connection refused/i,
    /Operation timed out/i,
    /fatal: .*/i, // Git errors
    /Error: (?!.*success).*/i,
  ];

  const matches = patterns
    .map((re) => logs.match(re))
    .filter((m) => m !== null)
    .map((m) => m![0].trim());

  if (matches.length > 0) {
    // Return unique patterns, limited to top 3 for brevity
    return [...new Set(matches)].slice(0, 3).join("; ");
  }

  // Fallback: If logs contain "error" or "fail" and we're at the end of the log, 
  // grab a snippet of the last few lines as a heuristic pattern.
  if (logs.toLowerCase().includes("error") || logs.toLowerCase().includes("fail")) {
    const lines = logs.split("\n").filter(l => l.trim().length > 0);
    const lastLines = lines.slice(-2).join(" ").substring(0, 150);
    if (lastLines.length > 10) return `[Heuristic] ${lastLines}`;
  }

  return null;
}

