#!/usr/bin/env node

/**
 * Training Data Preparation Script for AI Companion Pro
 * Simple version with no external dependencies
 */

const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    inputFiles: {
        mhqa: './mhqa.csv',
    },
    outputDir: './training_data',
    outputFile: './training_data/clinical_training_data.jsonl',
    validationSplit: 0.1,
};

// ========================================
// SIMPLE CSV PARSER
// ========================================

function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const record = {};
        headers.forEach((header, index) => {
            record[header] = values[index] || '';
        });
        records.push(record);
    }

    return records;
}

// ========================================
// MAIN FUNCTION
// ========================================

async function main() {
    console.log('🚀 ManoSathi Clinical AI - Training Data Preparation\n');
    console.log('='.repeat(60));

    // Step 1: Load MHQA data
    console.log('\n📂 Step 1: Loading MHQA dataset...');
    const mhqaExamples = loadMHQAData(CONFIG.inputFiles.mhqa);
    console.log(`✅ Loaded ${mhqaExamples.length} MHQA examples`);

    // Step 2: Enhance with clinical context
    console.log('\n🧠 Step 2: Enhancing examples with clinical context...');
    const enhancedExamples = enhanceClinicalExamples(mhqaExamples);
    console.log(`✅ Enhanced ${enhancedExamples.length} examples`);

    // Step 3: Add safety examples
    console.log('\n🛡️ Step 3: Adding safety & crisis examples...');
    const safetyExamples = generateSafetyExamples();
    console.log(`✅ Generated ${safetyExamples.length} safety examples`);

    // Step 4: Combine all examples
    const allExamples = [
        ...enhancedExamples,
        ...safetyExamples,
    ];

    console.log(`\n📊 Total training examples: ${allExamples.length}`);

    // Step 5: Split into training and validation
    const splitIndex = Math.floor(allExamples.length * (1 - CONFIG.validationSplit));
    const trainingExamples = allExamples.slice(0, splitIndex);
    const validationExamples = allExamples.slice(splitIndex);

    console.log(`   - Training: ${trainingExamples.length}`);
    console.log(`   - Validation: ${validationExamples.length}`);

    // Step 6: Save JSONL files
    console.log('\n💾 Step 6: Saving JSONL files...');

    // Create output directory
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // Save training data
    const trainingFile = CONFIG.outputFile;
    saveJSONL(trainingExamples, trainingFile);
    console.log(`✅ Saved training data: ${trainingFile}`);

    // Save validation data
    const validationFile = CONFIG.outputFile.replace('.jsonl', '_validation.jsonl');
    saveJSONL(validationExamples, validationFile);
    console.log(`✅ Saved validation data: ${validationFile}`);

    // Step 7: Generate statistics
    console.log('\n📈 Training Data Statistics:');
    console.log('='.repeat(60));
    generateStatistics(allExamples);

    console.log('\n✨ Data preparation complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the generated JSONL files in training_data/');
    console.log('2. Upload to Google Cloud Storage:');
    console.log(`   gsutil cp ${trainingFile} gs://your-bucket/training/`);
    console.log('3. Start fine-tuning job (see AI_COMPANION_PRO_QUICK_START.md)');
    console.log('\n💡 Sample data preview:');
    console.log(`   head -3 ${trainingFile}`);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Load MHQA CSV data
 */
function loadMHQAData(filePath) {
    const examples = [];

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        console.log('💡 Using sample training data for demonstration...\n');
        return getSampleMHQAData();
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parseCSV(fileContent);

        for (const row of records) {
            const question = row.question || row.Question || row.q || row.Q || '';
            const answer = row.answer || row.Answer || row.a || row.A || '';

            if (question && answer) {
                examples.push({
                    messages: [
                        { role: 'user', content: question.trim() },
                        { role: 'assistant', content: answer.trim() }
                    ]
                });
            }
        }

        return examples.length > 0 ? examples : getSampleMHQAData();
    } catch (error) {
        console.log(`⚠️  Error reading CSV: ${error.message}`);
        console.log('💡 Using sample training data for demonstration...\n');
        return getSampleMHQAData();
    }
}

/**
 * Get sample MHQA data
 */
function getSampleMHQAData() {
    return [
        {
            messages: [
                { role: 'user', content: 'What are the symptoms of depression?' },
                { role: 'assistant', content: 'Depression symptoms include persistent sadness, loss of interest in activities, changes in sleep and appetite, fatigue, difficulty concentrating, and feelings of worthlessness. If you\'re experiencing several of these symptoms for more than two weeks, it\'s important to speak with a mental health professional.\n\n*Note: This information is educational. Please consult a healthcare provider for personalized medical advice.*' }
            ]
        },
        {
            messages: [
                { role: 'user', content: 'How can I manage anxiety?' },
                { role: 'assistant', content: 'Here are evidence-based techniques for managing anxiety:\n\n1. Deep breathing exercises (4-7-8 technique)\n2. Progressive muscle relaxation\n3. Mindfulness meditation\n4. Regular physical exercise\n5. Limiting caffeine and alcohol\n6. Maintaining a regular sleep schedule\n7. Challenging anxious thoughts (CBT techniques)\n\nFor persistent or severe anxiety, please consult a mental health professional.\n\n*Note: This information is educational. Please consult a healthcare provider for personalized medical advice.*' }
            ]
        },
        {
            messages: [
                { role: 'user', content: 'What is the difference between anxiety and panic attacks?' },
                { role: 'assistant', content: 'Anxiety is a sustained feeling of worry, while panic attacks are sudden, intense episodes of fear with physical symptoms like rapid heartbeat and shortness of breath.\n\nBoth are treatable. Please consult a mental health professional if you\'re experiencing either.\n\n*Note: This information is educational.*' }
            ]
        },
        {
            messages: [
                { role: 'user', content: 'I have trouble sleeping every night' },
                { role: 'assistant', content: 'Sleep difficulties can be caused by stress, anxiety, or depression. Try these sleep hygiene tips:\n\n1. Maintain a consistent sleep schedule\n2. Avoid screens 1 hour before bed\n3. Keep your bedroom cool and dark\n4. Avoid caffeine after 2 PM\n5. Try relaxation exercises before bed\n\nIf insomnia persists for more than a few weeks, please consult a healthcare provider.\n\n*Note: This is educational information, not medical advice.*' }
            ]
        },
        {
            messages: [
                { role: 'user', content: 'What is cognitive behavioral therapy?' },
                { role: 'assistant', content: 'Cognitive Behavioral Therapy (CBT) is an evidence-based psychotherapy that helps you identify and change negative thought patterns and behaviors.\n\nKey components:\n- Identifying automatic negative thoughts\n- Challenging cognitive distortions\n- Behavioral activation\n- Problem-solving skills\n\nCBT is effective for depression, anxiety, and other mental health conditions. A trained therapist can guide you through this process.\n\n*Note: This information is educational. Please consult a mental health professional for treatment.*' }
            ]
        }
    ];
}

/**
 * Enhance examples with clinical context
 */
function enhanceClinicalExamples(examples) {
    return examples.map(example => {
        const userMessage = example.messages[0].content;
        const assistantMessage = example.messages[1].content;

        const isClinical =
            userMessage.toLowerCase().includes('symptom') ||
            userMessage.toLowerCase().includes('diagnosis') ||
            userMessage.toLowerCase().includes('depression') ||
            userMessage.toLowerCase().includes('anxiety') ||
            userMessage.toLowerCase().includes('therapy') ||
            userMessage.toLowerCase().includes('treatment');

        if (isClinical && !assistantMessage.includes('*Note:')) {
            const enhancedResponse = assistantMessage +
                '\n\n*Note: This information is educational. Please consult a healthcare provider for personalized medical advice.*';

            return {
                messages: [
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: enhancedResponse }
                ]
            };
        }

        return example;
    });
}

/**
 * Generate safety examples
 */
function generateSafetyExamples() {
    const prescriptionExamples = [
        {
            user: 'Can you prescribe me antidepressants?',
            assistant: 'I cannot prescribe medications. Only licensed psychiatrists can prescribe after proper evaluation.\n\n**For medication consultation in India:**\n- NIMHANS: +91-80-26995000\n- Your local psychiatrist or primary care doctor\n\nI can help with therapy techniques and coping strategies. Would you like to explore those?'
        },
        {
            user: 'What medicine should I take for depression?',
            assistant: 'I cannot recommend medications. Medication for depression must be prescribed by a qualified psychiatrist after thorough evaluation.\n\nPlease consult:\n- A psychiatrist for medication assessment\n- NIMHANS: +91-80-26995000\n\nI can guide you through evidence-based therapy techniques like CBT. Would that be helpful?'
        },
        {
            user: 'Should I take SSRI or SNRI?',
            assistant: 'This is a medical decision only a psychiatrist can make. I cannot advise on medication types.\n\nPlease consult a psychiatrist for medication evaluation.\n\nI\'m here to support you with therapy techniques and coping strategies.'
        }
    ];

    const crisisExamples = [
        {
            user: 'I want to end my life',
            assistant: '🚨 I\'m very concerned about your safety. Please reach out for immediate help:\n\n**📞 Tele-MANAS (24/7):** 14416\n**📞 AASRA (24/7):** 9820466726\n**📞 Vandrevala Foundation:** 1860 266 2345\n**📞 Emergency:** 102 / 108\n\nYou don\'t have to face this alone. These counselors can provide immediate support.\n\nAre you somewhere safe right now?'
        },
        {
            user: 'I can\'t take this anymore, I want to die',
            assistant: 'I\'m deeply concerned about your safety. Please reach out for immediate help:\n\n📞 **Tele-MANAS (24/7):** 14416\n📞 **AASRA (24/7):** 9820466726\n📞 **Emergency:** 102 / 108\n\nYour safety matters. Please call right now.'
        },
        {
            user: 'I\'m thinking of hurting myself',
            assistant: '🚨 This is very serious. Please reach out for help right away:\n\n**Crisis Support (24/7):**\n📞 Tele-MANAS: 14416\n📞 AASRA: 9820466726\n📞 Emergency: 102 / 108\n\nAre you in a safe place? Can someone be with you?'
        }
    ];

    const assessmentExamples = [
        {
            user: 'I\'ve been feeling very sad for the past 3 weeks',
            assistant: 'I hear you. Persistent sadness can be a sign of depression. I\'d like to conduct a brief PHQ-9 assessment to better understand what you\'re experiencing.\n\nOver the last 2 weeks, how often have you been bothered by:\n\n1. Little interest or pleasure in doing things?\n   - Not at all (0)\n   - Several days (1)\n   - More than half the days (2)\n   - Nearly every day (3)\n\nPlease respond with 0-3.'
        },
        {
            user: 'I think I have anxiety disorder',
            assistant: 'Let\'s use the GAD-7 assessment to understand your anxiety better.\n\nOver the last 2 weeks, how often have you been bothered by:\n\n1. Feeling nervous, anxious, or on edge?\n   - Not at all (0)\n   - Several days (1)\n   - More than half the days (2)\n   - Nearly every day (3)\n\nPlease share 0-3.'
        }
    ];

    const allExamples = [
        ...prescriptionExamples,
        ...crisisExamples,
        ...assessmentExamples
    ];

    return allExamples.map(ex => ({
        messages: [
            { role: 'user', content: ex.user },
            { role: 'assistant', content: ex.assistant }
        ]
    }));
}

/**
 * Save as JSONL in Vertex AI Gemini format
 */
function saveJSONL(examples, filePath) {
    const jsonlContent = examples.map(ex => {
        // Convert from messages format to Vertex AI Gemini format
        const contents = [];

        for (const msg of ex.messages) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }

        return JSON.stringify({ contents });
    }).join('\n');

    fs.writeFileSync(filePath, jsonlContent, 'utf-8');
}

/**
 * Generate statistics
 */
function generateStatistics(examples) {
    const totalExamples = examples.length;

    let totalUserLength = 0;
    let totalAssistantLength = 0;

    for (const ex of examples) {
        totalUserLength += ex.messages[0].content.length;
        totalAssistantLength += ex.messages[1].content.length;
    }

    const avgUserLength = Math.round(totalUserLength / totalExamples);
    const avgAssistantLength = Math.round(totalAssistantLength / totalExamples);

    console.log(`Total Examples: ${totalExamples}`);
    console.log(`Avg User Message Length: ${avgUserLength} characters`);
    console.log(`Avg Assistant Message Length: ${avgAssistantLength} characters`);
    console.log(`Estimated Training Tokens: ~${Math.round((totalUserLength + totalAssistantLength) / 4)}`);

    // Category breakdown
    let safetyCount = 0;
    let clinicalCount = 0;
    let generalCount = 0;

    for (const ex of examples) {
        const content = ex.messages[0].content.toLowerCase() + ex.messages[1].content.toLowerCase();
        if (content.includes('prescribe') || content.includes('crisis') || content.includes('emergency')) {
            safetyCount++;
        } else if (content.includes('symptom') || content.includes('assessment') || content.includes('phq') || content.includes('gad')) {
            clinicalCount++;
        } else {
            generalCount++;
        }
    }

    console.log(`\nCategory Breakdown:`);
    console.log(`- Safety & Crisis: ${safetyCount}`);
    console.log(`- Clinical/Assessment: ${clinicalCount}`);
    console.log(`- General Mental Health: ${generalCount}`);
}

// Run
main().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});
