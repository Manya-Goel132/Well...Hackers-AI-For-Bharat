// Script to initialize betaAnalytics collection in Firestore
// Run with: node scripts/initBetaAnalytics.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeBetaAnalytics() {
    try {
        console.log('🚀 Initializing betaAnalytics collection...');

        // Create a test document to initialize the collection
        const testData = {
            uid: 'test_user_initial',
            signupDate: admin.firestore.FieldValue.serverTimestamp(),
            ageRange: '18-24',
            studentOrWorking: 'student',
            primaryStressor: 'academic',
            preferredLanguage: 'en',
            acquisitionSource: 'organic',

            // Activation
            onboardingCompleted: false,
            firstSessionMessageCount: 0,
            firstSessionDurationSeconds: 0,
            activatedUser: false,

            // Retention
            day1Active: false,
            day2Active: false,
            day7Active: false,
            daysActiveFirst7: 0,
            sessionsPerActiveDay: 0,

            // Engagement
            averageUserMessageLength: 0,
            emotionalMessageRatio: 0,
            journalsCreatedCount: 0,
            checkinsCompletedCount: 0,
            returnedAfterNegativeMood: false,

            // Features
            usedChat: false,
            usedJournal: false,
            viewedDashboard: false,
            usedBreathingExercise: false,

            // Drop-off
            lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
            crisisFlagTriggered: false,
            continuedAfterCrisis: false,
            fallbackResponsesCount: 0,

            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('betaAnalytics').doc('test_user_initial').set(testData);

        console.log('✅ betaAnalytics collection created successfully!');
        console.log('✅ Test document created with ID: test_user_initial');
        console.log('\n📊 You can now view the dashboard at: /internal/beta-dashboard');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing betaAnalytics:', error);
        process.exit(1);
    }
}

initializeBetaAnalytics();
