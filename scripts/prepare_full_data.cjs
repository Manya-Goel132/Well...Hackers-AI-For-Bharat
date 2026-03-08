const fs = require('fs');
const path = require('path');
// const csv = require('csv-parse/sync'); // Removed external dependency

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    mhqaFile: './mhqa.csv',
    therapyFile: './Therapy_Modules_Chatbot_Scripts.md',
    clinicalFile: './Clinical_Decision_Support_System.md',
    outputFile: './training_data/clinical_training_data.jsonl',
    validationSplit: 0.1
};

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
    console.log('🚀 Starting Full Training Data Preparation...\n');
    let allExamples = [];

    // 1. Process MHQA CSV
    if (fs.existsSync(CONFIG.mhqaFile)) {
        console.log('📂 Processing MHQA CSV...');
        const mhqaExamples = processMHQACSV(CONFIG.mhqaFile);
        console.log(`✅ Extracted ${mhqaExamples.length} examples from MHQA`);
        allExamples = [...allExamples, ...mhqaExamples];
    } else {
        console.log('⚠️ MHQA CSV not found');
    }

    // 2. Process Therapy Modules MD
    if (fs.existsSync(CONFIG.therapyFile)) {
        console.log('\n📂 Processing Therapy Scripts...');
        const therapyExamples = processTherapyMD(CONFIG.therapyFile);
        console.log(`✅ Extracted ${therapyExamples.length} examples from Therapy Scripts`);
        allExamples = [...allExamples, ...therapyExamples];
    }

    // 3. Process Clinical Decision MD
    if (fs.existsSync(CONFIG.clinicalFile)) {
        console.log('\n📂 Processing Clinical Guidelines...');
        const clinicalExamples = processClinicalMD(CONFIG.clinicalFile);
        console.log(`✅ Extracted ${clinicalExamples.length} examples from Clinical Guidelines`);
        allExamples = [...allExamples, ...clinicalExamples];
    }

    // 4. Custom Safety Examples (Crisis & Prescriptions)
    const safetyExamples = generateSafetyExamples();
    console.log(`\n🛡️ Generated ${safetyExamples.length} safety examples`);
    allExamples = [...allExamples, ...safetyExamples];

    // 5. Shuffle and Split
    allExamples = shuffleArray(allExamples);
    const splitIndex = Math.floor(allExamples.length * (1 - CONFIG.validationSplit));
    const trainingData = allExamples.slice(0, splitIndex);
    const validationData = allExamples.slice(splitIndex);

    console.log(`\n📊 Final Dataset Statistics:`);
    console.log(`   Total Examples: ${allExamples.length}`);
    console.log(`   Training Set:   ${trainingData.length}`);
    console.log(`   Validation Set: ${validationData.length}`);

    // 6. Save Files
    saveJSONL(trainingData, CONFIG.outputFile);
    saveJSONL(validationData, CONFIG.outputFile.replace('.jsonl', '_validation.jsonl'));

    console.log('\n✨ Done! Ready for training.');
}

// ========================================
// PARSERS
// ========================================

/**
 * Parse MHQA CSV (Custom Parser for specific format)
 * Structure: ID, Category, Type, Question, Opt1, Opt2, Opt3, Opt4, Answer, Index
 */
function processMHQACSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const examples = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (handling quotes simplisticly for now as data seems clean enough or we use regex)
        // Regex to split by comma but ignore commas inside quotes
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        // Fallback simple split if regex fails or complicates
        // The file format seems to be: ID, Cat, Type, Question, ... , Answer, Index
        // Let's use a robust approach for this specific file structure we saw

        // We know Question is ~index 3 and Answer is ~index 8
        // But simply splitting by comma is risky if text contains commas.
        // Let's try to reconstruct carefully.

        const row = parseCSVLine(line);
        if (row.length < 9) continue;

        const question = row[3];
        const answer = row[8];
        const type = row[2];

        if (question && answer) {
            examples.push({
                user: question.replace(/^"|"$/g, '').trim(),
                model: answer.replace(/^"|"$/g, '').trim() + `\n\n*Note: Educational information based on ${type} data.*`
            });
        }
    }
    return examples;
}

function processTherapyMD(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const examples = [];

    let currentSituation = '';
    let capturingDoSay = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect Situation Header (e.g. "## 1. User expresses..." or "## 5. User is...")
        // Flexible regex to catch any numbered header starting with User
        const headerMatch = line.match(/^##\s+\d+\.\s+User\s+(.+)$/i);
        if (headerMatch) {
            currentSituation = headerMatch[1].trim();
            capturingDoSay = false;
            continue;
        }

        // Detect "DO SAY" Header
        if (line.includes('### ✓ DO SAY:')) {
            capturingDoSay = true;
            continue;
        }

        // Stop capturing on next header or section break
        if (line.startsWith('#') || line.startsWith('---')) {
            capturingDoSay = false;
        }

        // Capture Bullet Points
        if (capturingDoSay && line.startsWith('-') && currentSituation) {
            const response = line.substring(1).trim();
            if (response && response.length > 5) {
                // Add direct response example
                examples.push({
                    user: `I am ${currentSituation}`,
                    model: response
                });

                // Add instructional example
                examples.push({
                    user: `How should I respond when a user is ${currentSituation}?`,
                    model: `Here is a therapeutic response:\n\n"${response}"`
                });
            }
        }
    }

    return examples;
}

/**
 * Parse Clinical MD
 * Strategy: Extract Clinical Status and Action Recommendations
 */
function processClinicalMD(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const examples = [];

    // Extract Status/Action pairs
    const statusMatches = content.matchAll(/\*\*Clinical Status:\*\* (.*?)\n\n\*\*Action Recommendation:\*\* (.*?)\n/g);
    for (const match of statusMatches) {
        examples.push({
            user: "What is the recommended action for this clinical status: " + match[1],
            model: `**Recommendation:** ${match[2]}\n\n*Source: IPS Clinical Practice Guidelines*`
        });
    }

    return examples;
}

// ========================================
// UTILITIES
// ========================================

function generateSafetyExamples() {
    // Crisis and Prescription safety examples (same as before)
    return [
        {
            user: "I want to kill myself",
            model: "🚨 **I'm very concerned about your safety.**\n\nPlease reach out immediately:\n- Tele-MANAS: 14416\n- AASRA: 9820466726\n- Emergency: 102/108\n\nYou are not alone. Please call them now."
        },
        {
            user: "Can you prescribe Xanax?",
            model: "I cannot prescribe medications. Please consult a licensed psychiatrist for medication evaluation.\n\nI can help with coping strategies and therapy techniques."
        },
        // ... (Add more if needed)
    ];
}

function parseCSVLine(line) {
    const result = [];
    let start = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            result.push(line.substring(start, i));
            start = i + 1;
        }
    }
    result.push(line.substring(start));
    return result;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function saveJSONL(data, filePath) {
    const stream = fs.createWriteStream(filePath);
    data.forEach(item => {
        const vertexFormat = {
            contents: [
                { role: "user", parts: [{ text: item.user }] },
                { role: "model", parts: [{ text: item.model }] }
            ]
        };
        stream.write(JSON.stringify(vertexFormat) + '\n');
    });
    stream.end();
}

// Run
main().catch(console.error);
