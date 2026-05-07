import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const CLOUD_URL = process.env.CAUSALOS_API_URL || 'https://mcp.causalos.xyz';

export class CloudKernelClient {
    private client;
    private deviceId: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: CLOUD_URL,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }

    async getDeviceId(): Promise<string> {
        if (this.deviceId) return this.deviceId;

        // Try environment variable first
        if (process.env.CAUSALOS_DEVICE_ID) {
            this.deviceId = process.env.CAUSALOS_DEVICE_ID;
            return this.deviceId;
        }

        // Try local config file
        const configPath = path.join(os.homedir(), '.causalos', 'config.json');
        try {
            const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
            if (config.device_id) {
                this.deviceId = config.device_id as string;
                return this.deviceId;
            }
        } catch (e) {
            // Config doesn't exist
        }

        throw new Error("CAUSALOS_DEVICE_ID not found. Run 'npx causalos init' first.");
    }

    async prepareToolCall(session_id: string, tool_name: string, payload: any) {
        const deviceId = await this.getDeviceId();
        const resp = await this.client.post('/v1/governance/prepare', {
            session_id,
            tool_name,
            payload_json: payload,
        }, {
            headers: { 'x-causalos-device-id': deviceId as string }
        });
        return resp.data;
    }

    async commitToolCall(tool_call_id: string, outcome: any, success: boolean, exitCode?: number) {
        const deviceId = await this.getDeviceId();
        const resp = await this.client.post('/v1/governance/commit', {
            tool_call_id,
            outcome_json: outcome,
            success,
            exit_code: exitCode
        }, {
            headers: { 'x-causalos-device-id': deviceId as string }
        });
        return resp.data;
    }

    async getMetrics() {
        const resp = await this.client.get('/metrics');
        return resp.data;
    }
}
