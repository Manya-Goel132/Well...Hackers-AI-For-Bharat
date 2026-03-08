#!/usr/bin/env ts-node

/**
 * Training Data Preparation Script for AI Companion Pro
 * 
 * This script converts mhqa.csv and other data sources into
 * the JSONL format required for Gemini 2.0 Flash fine-tuning
 */

import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

interface MHQARow {
    question: string;
    answer: string;
    topic?: string;
    severity?: string;
    keywords?: string;
}

interface TrainingExample {
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
}

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    inputFiles: {
        mhqa: './mhqa.csv',
        // Add more data sources here as you process the PDFs
    },
    outputFile: './training_data/clinical_training_data.jsonl',
    validationSplit: 0.1, // 10% for validation
};

// ========================================
// MAIN FUNCTION
// ========================================

async function main() {
    console.log('🚀 ManoSathi Clinical AI - Training Data Preparation\n');
    console.log('='.repeat(60));

    // Step 1: Load MHQA data
    console.log('\n📂 Step 1: Loading MHQA dataset...');
    const mhqaExamples = await loadMHQAData(CONFIG.inputFiles.mhqa);
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
    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
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
    console.log('1. Review the generated JSONL files');
    console.log('2. Upload to Google Cloud Storage:');
    console.log(`   gsutil cp ${trainingFile} gs://your-bucket/training/`);
    console.log('3. Start fine-tuning job (see AI_COMPANION_PRO_QUICK_START.md)');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Load MHQA CSV data
 */
function loadMHQAData(filePath: string): Promise<TrainingExample[]> {
    return new Promise((resolve, reject) => {
        const examples: TrainingExample[] = [];
        const rows: MHQARow[] = [];

        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            console.log('💡 Make sure mhqa.csv is in the project root directory');
            reject(new Error('MHQA file not found'));
            return;
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row: MHQARow) => {
                rows.push(row);
            })
            .on('end', () => {
                // Convert rows to training examples
                for (const row of rows) {
                    if (row.question && row.answer) {
                        examples.push({
                            messages: [
                                { role: 'user', content: row.question.trim() },
                                { role: 'assistant', content: row.answer.trim() }
                            ]
                        });
                    }
                }
                resolve(examples);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

/**
 * Enhance examples with clinical context
 */
function enhanceClinicalExamples(examples: TrainingExample[]): TrainingExample[] {
    // Add system context to responses
    return examples.map(example => {
        const userMessage = example.messages[0].content;
        const assistantMessage = example.messages[1].content;

        // Check if this is a clinical question
        const isClinical =
            userMessage.toLowerCase().includes('symptom') ||
            userMessage.toLowerCase().includes('diagnosis') ||
            userMessage.toLowerCase().includes('depression') ||
            userMessage.toLowerCase().includes('anxiety') ||
            userMessage.toLowerCase().includes('therapy');

        if (isClinical) {
            // Enhance response with professional framing
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
 * Generate safety and crisis management examples
 */
function generateSafetyExamples(): TrainingExample[] {
    const examples: TrainingExample[] = [];

    // Prescription denial examples
    const prescriptionExamples = [
        {
            user: 'Can you prescribe me antidepressants?',
            assistant: 'I understand you\'re looking for medication help, but as an AI, I cannot prescribe medications. This requires a licensed psychiatrist who can evaluate your specific situation.\n\n**For medication consultation in India:**\n- Visit a psychiatrist at NIMHANS: +91-80-26995000\n- Book online: https://www.nimhans.ac.in\n- Or consult your local primary care doctor for a referral\n\nI can still help with therapeutic techniques, coping strategies, and assessments. Would you like to continue with that?'
        },
        {
            user: 'What medicine should I take for depression?',
            assistant: 'I cannot recommend specific medications - that\'s a decision that must be made by a qualified psychiatrist after thorough evaluation.\n\nMedication for depression is highly individualized based on:\n- Your specific symptoms\n- Medical history\n- Other medications you\'re taking\n- Potential side effects\n\nPlease consult a psychiatrist who can assess you properly and prescribe the right medication if needed.\n\nIn the meantime, I can guide you through evidence-based therapy techniques like CBT. Would that be helpful?'
        },
        {
            user: 'Should I take SSRI or SNRI?',
            assistant: 'This is a medical decision that only a psychiatrist can make after evaluating you. I cannot advise on medication types.\n\nSSRIs and SNRIs affect brain chemistry differently, and choosing between them requires:\n- Medical assessment\n- Understanding your symptom profile\n- Reviewing potential side effects\n- Monitoring by a doctor\n\n**Please consult:**\n- A psychiatrist for medication evaluation\n- NIMHANS: +91-80-26995000\n- Your local mental health clinic\n\nI\'m here to support you with therapy techniques and coping strategies while you seek professional medical care.'
        }
    ];

    // Crisis management examples
    const crisisExamples = [
        {
            user: 'I want to end my life',
            assistant: '🚨 I\'m very concerned about your safety right now. You don\'t have to face this alone.\n\nPlease reach out to these crisis services immediately:\n\n**📞 Tele-MANAS (24/7):** 14416\n**📞 AASRA (24/7):** 9820466726  \n**📞 Vandrevala Foundation:** 1860 266 2345\n**📞 Emergency Services:** 102 / 108\n\nThese counselors are trained for exactly this moment. They can provide immediate support.\n\nIf you\'re in immediate danger, please call 102 or go to the nearest emergency room.\n\nAre you somewhere safe right now?'
        },
        {
            user: 'I can\'t take this anymore, I want to die',
            assistant: 'I hear you, and I\'m deeply concerned about your safety. What you\'re experiencing is real pain, but you don\'t have to face this moment alone.\n\n**Please reach out for immediate help:**\n\n📞 **Tele-MANAS (24/7):** 14416  \n📞 **AASRA (24/7):** 9820466726  \n📞 **Emergency:** 102 / 108\n\nThese services are confidential and have trained counselors who can support you through this.\n\nWhile you\'re calling, try to stay where someone else is nearby if possible. Your safety matters.\n\nAre you able to call right now?'
        }
    ];

    // PHQ-9 assessment examples
    const assessmentExamples = [
        {
            user: 'I\'ve been feeling very sad for the past 3 weeks',
            assistant: 'I hear you. Persistent sadness lasting several weeks can be a sign of depression, and it\'s important we understand more about what you\'re experiencing.\n\nI\'d like to conduct a brief PHQ-9 assessment - a clinically validated tool used by mental health professionals to assess depression severity. It takes about 2-3 minutes.\n\nOver the **last 2 weeks**, how often have you been bothered by:\n\n1. Little interest or pleasure in doing things?\n   - Not at all (0)\n   - Several days (1)\n   - More than half the days (2) \n   - Nearly every day (3)\n\nPlease respond with the number (0-3) that best describes your experience.'
        }
    ];

    // Convert to training format
    const allSafetyExamples = [
        ...prescriptionExamples,
        ...crisisExamples,
        ...assessmentExamples,
    ];

    for (const ex of allSafetyExamples) {
        examples.push({
            messages: [
                { role: 'user', content: ex.user },
                { role: 'assistant', content: ex.assistant }
            ]
        });
    }

    return examples;
}

/**
 * Save examples as JSONL
 */
function saveJSONL(examples: TrainingExample[], filePath: string): void {
    const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(filePath, jsonlContent, 'utf-8');
}

/**
 * Generate training data statistics
 */
function generateStatistics(examples: TrainingExample[]): void {
    const totalExamples = examples.length;

    // Calculate average message lengths
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
}

// ========================================
// RUN
// ========================================

main().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});
