import axios from 'axios';

const CLOUD_URL = 'https://cloud-runtime-production.up.railway.app';
const API_KEY = 'sk-jmhmkd6pa8eyf6ohbjmwm';

async function test() {
    console.log(`Testing Cloud Runtime at ${CLOUD_URL}`);
    console.log(`Using API Key: ${API_KEY}`);

    try {
        const resp = await axios.post(`${CLOUD_URL}/v1/evaluate`, {
            agent_id: "test-agent",
            project_id: "test-project",
            plan_text: "Verifying cloud connection with configured key"
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('SUCCESS:', resp.data);
    } catch (e) {
        console.error('FAILED:', e.response?.status, e.response?.data || e.message);
    }
}

test();
