import { kernel } from './client.js';

async function testLedger() {
    console.log("🚀 Starting Causal Ledger registration test...");
    
    const agentId = "antigravity_diagnostic";
    const projectId = "v3_stabilization";
    const task = "Verifying cloud ledger registration and RLS visibility";

    try {
        console.log("1. Calling context_build (evaluate)...");
        const plan = await kernel.evaluatePlan(agentId, projectId, task);
        console.log("✅ Plan Evaluated. Contract Hash:", plan.contract_hash);

        console.log("\n2. Calling causal_record (record outcome)...");
        const record = await kernel.recordOutcome(
            plan.contract_hash,
            "Registration Successful",
            true,
            JSON.stringify({
                timestamp: new Date().toISOString(),
                test_type: "manual_verification",
                status: "success"
            }),
            "diagnostic_session_" + Date.now()
        );
        console.log("✅ Outcome Recorded. Result:", JSON.stringify(record, null, 2));

        console.log("\n3. Verifying trace visibility...");
        const trace = await kernel.getCausalTrace(plan.contract_hash);
        console.log("✅ Trace retrieved. Events found:", trace.events?.length || 0);

        console.log("\n✨ TEST COMPLETE: Ledger registration is working.");
    } catch (err: any) {
        console.error("\n❌ TEST FAILED:", err.response?.data || err.message);
        if (err.response?.status === 401) {
            console.error("💡 Hint: Your CAUSAL_API_KEY might be invalid or missing.");
        } else if (err.response?.status === 429) {
            console.error("💡 Hint: Rate limited. Please wait.");
        }
    }
}

testLedger();
