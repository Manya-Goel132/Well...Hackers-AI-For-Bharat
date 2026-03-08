/**
 * Quick script to enable Pro Mode for existing users
 * Run this to manually enable Pro mode access for your account
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Your Firebase config (from src/services/firebaseService.ts)
const firebaseConfig = {
    apiKey: "AIzaSyDSuscSzXuelES_LMdN3_VbKlxHXLmKNWo",
    authDomain: "mann-mitra-c1f1e.firebaseapp.com",
    projectId: "mann-mitra-c1f1e",
    storageBucket: "mann-mitra-c1f1e.firebasestorage.app",
    messagingSenderId: "66825998276",
    appId: "1:66825998276:web:d8e2c0e7a1a8e9f0a1a8e9",
    measurementId: "G-XXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function enableProMode() {
    const user = auth.currentUser;

    if (!user) {
        console.error('❌ No user is currently signed in. Please sign in first.');
        console.log('💡 Run: npm run dev, then sign in to your account in the browser');
        process.exit(1);
    }

    console.log(`🔍 Enabling Pro Mode for user: ${user.email}`);

    try {
        const userRef = doc(db, 'users', user.uid);

        await updateDoc(userRef, {
            'consents.proModeAccess': true,
            'consents.dataUsageForAI': true,
            'mentalHealthData.hasExistingConcerns': false,
            'mentalHealthData.symptoms': {
                depression: [],
                anxiety: [],
                sleep: [],
                trauma: []
            }
        });

        console.log('✅ Pro Mode enabled successfully!');
        console.log('🔄 Refresh your browser to see the changes');
        console.log('🛡️ You can now toggle to AI Companion Pro mode');

    } catch (error) {
        console.error('❌ Error enabling Pro Mode:', error);
        console.log('💡 Make sure you are signed in and have an active session');
    }

    process.exit(0);
}

// Run the script
enableProMode();
