const { googleCloudAI } = require('./functions/lib/googleCloudAI');

const context = {
    userId: 'test_user',
    sessionId: 'session_1',
    userProfile: {
        preferredLanguage: 'en',
        gender: 'unknown',
        location: 'unknown',
        interests: [],
        comfortEnvironment: 'calm',
        previousSessions: 0
    },
    currentState: {
        mood: 'neutral',
        stressLevel: 'low',
        energyLevel: 'low',
        crisisRisk: 'none',
        emotionalTone: 'neutral'
    },
    assessmentScores: {
        phq9: 0,
        gad7: 0,
        overallWellness: 0
    },
    therapeuticGoals: [],
    conversationHistory: []
};

async function test() {
    console.log("Testing generation...");
    try {
        const res = await googleCloudAI.generateEmpathicResponse_Full("What tools inside this app should I use?", context);
        console.log("FINAL RESULT:");
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
