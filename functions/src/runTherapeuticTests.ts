
import { AWSBedrockMentalHealthAI, MentalHealthContext } from './awsBedrockAI';

// import * as fs from 'fs';
// import * as path from 'path';

// const tests = [ ... ]; // removed



async function runStressTest() {
    const ai = new AWSBedrockMentalHealthAI();
    console.log("🚀 Starting Stress Test: 10 Consecutive Requests...");

    const testInput = "I feel stuck.";
    const context: MentalHealthContext = {
        userId: `stress-test-user-v1`, // Consistent user ID for potentially hitting same cache?
        sessionId: `session-stress-1`,
        userProfile: {
            age: 22,
            gender: "unknown",
            location: "India",
            preferredLanguage: "English",
            culturalBackground: "Indian"
        },
        currentState: {
            mood: "neutral",
            emotionalTone: "neutral",
            crisisRisk: "none"
        },
        conversationHistory: []
    };

    for (let i = 1; i <= 10; i++) {
        console.log(`\n🔄 Request ${i}/10 ...`);
        try {
            await ai.generateEmpathicResponse_Full(testInput, context);
            console.log(`✅ Request ${i} completed.`);
        } catch (error: any) {
            console.error(`❌ Request ${i} failed: ${error.message}`);
        }
        // Small delay to ensure logs don't overlap too much and respects basic rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

runStressTest().catch(console.error);
