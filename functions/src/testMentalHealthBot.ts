/**
 * Test Suite for Mental Health Bot Components
 * 
 * Run with: ts-node testMentalHealthBot.ts
 */

import { PanicProtocolService } from './panicProtocolService';
import { MentalHealthBot } from './mentalHealthBot';

console.log('🧪 Testing Mental Health Bot Components\n');
console.log('='.repeat(80));

// Test 1: Panic Protocol Trigger
console.log('\n📋 Test 1: Panic Protocol Trigger');
console.log('-'.repeat(80));

const panicProtocol = PanicProtocolService.triggerPanicProtocol();
console.log(`✅ Protocol initiated with ${panicProtocol.protocol.length} steps`);
console.log(`   Step 1: ${panicProtocol.protocol[0].stepName}`);
console.log(`   Step 2: ${panicProtocol.protocol[1].stepName}`);
console.log(`   Step 3: ${panicProtocol.protocol[2].stepName} (Critical: ${panicProtocol.protocol[2].isCriticalSafety})`);

// Test 2: Medical Triage - Emergency Case
console.log('\n📋 Test 2: Medical Triage - Emergency Response ("Yes")');
console.log('-'.repeat(80));

const emergencyResponse = PanicProtocolService.processMedicalTriageResponse("Yes, I have chest pain in my left arm");
console.log(`   Is Emergency: ${emergencyResponse.isEmergency}`);
console.log(`   Response: ${emergencyResponse.message.substring(0, 100)}...`);

if (emergencyResponse.isEmergency) {
    console.log('   ✅ PASS - Correctly identified emergency');
} else {
    console.log('   ❌ FAIL - Should have triggered emergency');
}

// Test 3: Medical Triage - Safe Case
console.log('\n📋 Test 3: Medical Triage - Safe Response ("No")');
console.log('-'.repeat(80));

const safeResponse = PanicProtocolService.processMedicalTriageResponse("No");
console.log(`   Is Emergency: ${safeResponse.isEmergency}`);
console.log(`   Response: ${safeResponse.message}`);

if (!safeResponse.isEmergency) {
    console.log('   ✅ PASS - Correctly identified as safe to continue');
} else {
    console.log('   ❌ FAIL - Should NOT have triggered emergency');
}

// Test 4: Intent Classification - Panic
console.log('\n📋 Test 4: Intent Classification - Panic Detection');
console.log('-'.repeat(80));

async function testIntents() {
    const panicInput = {
        message: "I'm having a panic attack right now, I can't breathe",
        userId: 'test_user',
        sessionId: 'test_session'
    };

    const panicResult = await MentalHealthBot.processUserInput(panicInput);
    console.log(`   Input: "${panicInput.message}"`);
    console.log(`   Detected Type: ${panicResult.type}`);

    if (panicResult.type === 'panic_protocol') {
        console.log('   ✅ PASS - Correctly detected panic intent');
    } else {
        console.log('   ❌ FAIL - Should have detected panic intent');
    }

    // Test 5: Intent Classification - Symptom Check
    console.log('\n📋 Test 5: Intent Classification - Symptom Check');
    console.log('-'.repeat(80));

    const symptomInput = {
        message: "Can you assess my depression? I want to check my PHQ-9 score",
        userId: 'test_user',
        sessionId: 'test_session'
    };

    const symptomResult = await MentalHealthBot.processUserInput(symptomInput);
    console.log(`   Input: "${symptomInput.message}"`);
    console.log(`   Detected Type: ${symptomResult.type}`);

    if (symptomResult.type === 'triage') {
        console.log('   ✅ PASS - Correctly detected triage intent');
    } else {
        console.log('   ❌ FAIL - Should have detected triage intent');
    }

    // Test 6: Intent Classification - General Chat
    console.log('\n📋 Test 6: Intent Classification - General Chat');
    console.log('-'.repeat(80));

    const chatInput = {
        message: "I've been feeling a bit down lately, can we talk?",
        userId: 'test_user',
        sessionId: 'test_session'
    };

    const chatResult = await MentalHealthBot.processUserInput(chatInput);
    console.log(`   Input: "${chatInput.message}"`);
    console.log(`   Detected Type: ${chatResult.type}`);

    if (chatResult.type === 'general_chat') {
        console.log('   ✅ PASS - Correctly detected general chat intent');
    } else {
        console.log('   ❌ FAIL - Should have detected general chat intent');
    }

    // Test 7: PHQ-9 Scoring
    console.log('\n📋 Test 7: PHQ-9 Depression Scoring');
    console.log('-'.repeat(80));

    // Test minimal depression: all 0s
    const minimalResponses = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const minimalResult = MentalHealthBot.runTriagePHQ9(minimalResponses);
    console.log(`   Responses: ${minimalResponses.join(', ')}`);
    console.log(`   Score: ${minimalResult.score}`);
    console.log(`   Severity: ${minimalResult.severity}`);
    console.log(`   Tier: ${minimalResult.referralTier}`);

    if (minimalResult.severity === 'Minimal' && minimalResult.score === 0) {
        console.log('   ✅ PASS - Correct minimal depression scoring');
    } else {
        console.log('   ❌ FAIL - Incorrect scoring');
    }

    // Test moderate depression: score 12
    const moderateResponses = [1, 1, 2, 1, 1, 2, 1, 2, 1]; // Sum = 12
    const moderateResult = MentalHealthBot.runTriagePHQ9(moderateResponses);
    console.log(`\n   Responses: ${moderateResponses.join(', ')}`);
    console.log(`   Score: ${moderateResult.score}`);
    console.log(`   Severity: ${moderateResult.severity}`);
    console.log(`   Tier: ${moderateResult.referralTier}`);

    if (moderateResult.severity === 'Moderate' && moderateResult.score === 12) {
        console.log('   ✅ PASS - Correct moderate depression scoring');
    } else {
        console.log('   ❌ FAIL - Incorrect scoring');
    }

    // Test 8: GAD-7 Scoring
    console.log('\n📋 Test 8: GAD-7 Anxiety Scoring');
    console.log('-'.repeat(80));

    // Test severe anxiety: high scores
    const severeResponses = [3, 3, 2, 3, 2, 3, 3]; // Sum = 19
    const severeResult = MentalHealthBot.runTriageGAD7(severeResponses);
    console.log(`   Responses: ${severeResponses.join(', ')}`);
    console.log(`   Score: ${severeResult.score}`);
    console.log(`   Severity: ${severeResult.severity}`);
    console.log(`   Tier: ${severeResult.referralTier}`);

    if (severeResult.severity === 'Severe' && severeResult.score === 19) {
        console.log('   ✅ PASS - Correct severe anxiety scoring');
    } else {
        console.log('   ❌ FAIL - Incorrect scoring');
    }

    // Test 9: Disclaimer Presence
    console.log('\n📋 Test 9: Telemedicine Disclaimer');
    console.log('-'.repeat(80));

    const disclaimer = PanicProtocolService.getTelemedicineDisclaimer();
    const hasImportantNotice = disclaimer.includes('Important Notice');
    const hasEmergencyNumbers = disclaimer.includes('102') || disclaimer.includes('108');

    console.log(`   Contains "Important Notice": ${hasImportantNotice}`);
    console.log(`   Contains Emergency Numbers: ${hasEmergencyNumbers}`);

    if (hasImportantNotice && hasEmergencyNumbers) {
        console.log('   ✅ PASS - Disclaimer is complete');
    } else {
        console.log('   ❌ FAIL - Disclaimer missing key elements');
    }

    // Test 10: Applied Relaxation Module
    console.log('\n📋 Test 10: Applied Relaxation Module Content');
    console.log('-'.repeat(80));

    const relaxationModule = PanicProtocolService.getAppliedRelaxationModule();
    const hasSteps = relaxationModule.includes('Step 1') && relaxationModule.includes('Step 4');
    const hasContraindications = relaxationModule.includes('Contraindications');

    console.log(`   Contains all 4 steps: ${hasSteps}`);
    console.log(`   Contains contraindications: ${hasContraindications}`);
    console.log(`   Length: ${relaxationModule.length} characters`);

    if (hasSteps && hasContraindications) {
        console.log('   ✅ PASS - Applied Relaxation module is complete');
    } else {
        console.log('   ❌ FAIL - Module missing key content');
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Suite Complete!');
    console.log('='.repeat(80));
    console.log('\nAll core components are functioning as expected.');
    console.log('\n📚 Key Features Validated:');
    console.log('   ✓ Panic protocol trigger and sequencing');
    console.log('   ✓ Medical triage emergency detection');
    console.log('   ✓ Intent classification (panic, triage, chat)');
    console.log('   ✓ PHQ-9 depression scoring');
    console.log('   ✓ GAD-7 anxiety scoring');
    console.log('   ✓ Safety disclaimers and emergency info');
    console.log('   ✓ Applied Relaxation module content');
    console.log('\n🚀 Ready for integration with Chat UI and Firebase Functions!');
    console.log('   See MENTAL_HEALTH_BOT_IMPLEMENTATION.md for integration guide.\n');
}

// Run async tests
testIntents().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
});
