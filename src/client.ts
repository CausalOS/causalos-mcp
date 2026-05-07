import { CloudKernelClient } from './cloud-client.js';

export class KernelClient {
  public cloudClient: CloudKernelClient;

  constructor() {
    this.cloudClient = new CloudKernelClient();
  }

  async prepareToolCall(
    session_id: string,
    tool_name: string,
    payload: any
  ): Promise<any> {
    try {
      return await this.cloudClient.prepareToolCall(session_id, tool_name, payload);
    } catch (err: any) {
      console.error(`[KernelClient] Governance failure: ${err.message}. Failing closed.`);
      return {
          verdict: "BLOCK",
          reason: "Governance runtime unreachable. Action blocked for safety.",
          source: "failsafe"
      };
    }
  }

  async commitToolCall(tool_call_id: string, outcome: any, success: boolean, exitCode?: number): Promise<any> {
    try {
        return await this.cloudClient.commitToolCall(tool_call_id, outcome, success, exitCode);
    } catch (err) {
        // Log locally if cloud is down, but don't crash
        console.error(`[KernelClient] Failed to commit outcome: ${err}`);
        return { status: "local_only" };
    }
  }
}

export const kernel = new KernelClient();
