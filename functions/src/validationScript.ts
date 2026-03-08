/**
 * Validation Script for Mental Health Bot
 * 
 * Tests the MentalHealthBot's accuracy using mhqa.csv
 * 
 * Process:
 * 1. Load mhqa.csv
 * 2. Select 50 random rows
 * 3. Feed questions into MentalHealthBot
 * 4. Compare bot output with correct_option column
 * 5. Calculate accuracy score
 * 
 * Usage: ts-node validationScript.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { MentalHealthBot } from './mentalHealthBot';

interface MHQARow {
    id: string;
    topic: string;
    type: string;
    question: string;
    options: string;
    correct_option: string;
    correct_option_number: string;
}

interface ValidationResult {
    questionId: string;
    question: string;
    correctAnswer: string;
    botResponse: string;
    isCorrect: boolean;
    topic: string;
}

export class ValidationScript {
    private dataPath: string;
    private results: ValidationResult[] = [];

    constructor(csvPath: string) {
        this.dataPath = csvPath;
    }

    /**
     * Load and parse the CSV file
     */
    private loadCSV(): MHQARow[] {
        try {
            const csvContent = fs.readFileSync(this.dataPath, 'utf-8');
            const lines = csvContent.split('\n').filter(line => line.trim());

            // Parse CSV (simple implementation - assumes no commas in quoted fields)
            const headers = lines[0].split(',').map(h => h.trim());
            const rows: MHQARow[] = [];

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);

                if (values.length === headers.length) {
                    const row: any = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    rows.push(row as MHQARow);
                }
            }

            console.log(`✅ Loaded ${rows.length} rows from MHQA dataset`);
            return rows;
        } catch (error) {
            console.error('❌ Error loading CSV:', error);
            throw error;
        }
    }

    /**
     * Parse CSV line handling quoted values
     */
    private parseCSVLine(line: string): string[] {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    }

    /**
     * Select N random rows from dataset
     */
    private selectRandomRows(rows: MHQARow[], count: number): MHQARow[] {
        const shuffled = [...rows].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, rows.length));
    }

    /**
     * Test a single question against the bot
     */
    private async testQuestion(row: MHQARow): Promise<ValidationResult> {
        try {
            // Format the question for the bot
            const userInput = {
                message: row.question,
                userId: 'validation_test',
                sessionId: `test_${row.id}`,
                conversationHistory: []
            };

            // Get bot response
            const botResponse = await MentalHealthBot.processUserInput(userInput);

            // Simple accuracy check: does the bot's response contain the correct answer?
            const normalizedBotResponse = botResponse.content.toLowerCase();
            const normalizedCorrectAnswer = row.correct_option.toLowerCase();

            // Check if the correct answer is mentioned in the response
            const isCorrect = normalizedBotResponse.includes(normalizedCorrectAnswer);

            return {
                questionId: row.id,
                question: row.question,
                correctAnswer: row.correct_option,
                botResponse: botResponse.content.substring(0, 200) + '...', // Truncate for readability
                isCorrect,
                topic: row.topic
            };
        } catch (error) {
            console.error(`Error testing question ${row.id}:`, error);
            return {
                questionId: row.id,
                question: row.question,
                correctAnswer: row.correct_option,
                botResponse: 'ERROR',
                isCorrect: false,
                topic: row.topic
            };
        }
    }

    /**
     * Run the full validation
     */
    public async runValidation(sampleSize: number = 50): Promise<void> {
        console.log('🚀 Starting Mental Health Bot Validation\n');
        console.log(`📊 Sample size: ${sampleSize} questions\n`);

        // Load dataset
        const allRows = this.loadCSV();

        // Select random sample
        const testRows = this.selectRandomRows(allRows, sampleSize);
        console.log(`✅ Selected ${testRows.length} random questions\n`);

        // Test each question
        console.log('🧪 Running tests...\n');
        for (let i = 0; i < testRows.length; i++) {
            const row = testRows[i];
            console.log(`Testing ${i + 1}/${testRows.length}: ${row.question.substring(0, 60)}...`);

            const result = await this.testQuestion(row);
            this.results.push(result);

            // Small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Calculate and display results
        this.displayResults();
    }

    /**
     * Display validation results
     */
    private displayResults(): void {
        const totalTests = this.results.length;
        const correctTests = this.results.filter(r => r.isCorrect).length;
        const accuracy = (correctTests / totalTests) * 100;

        console.log('\n' + '='.repeat(80));
        console.log('📈 VALIDATION RESULTS');
        console.log('='.repeat(80));
        console.log(`Total Questions Tested: ${totalTests}`);
        console.log(`Correct Responses: ${correctTests}`);
        console.log(`Incorrect Responses: ${totalTests - correctTests}`);
        console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
        console.log('='.repeat(80));

        // Breakdown by topic
        const byTopic: { [key: string]: { total: number; correct: number } } = {};
        this.results.forEach(r => {
            if (!byTopic[r.topic]) {
                byTopic[r.topic] = { total: 0, correct: 0 };
            }
            byTopic[r.topic].total++;
            if (r.isCorrect) byTopic[r.topic].correct++;
        });

        console.log('\n📚 Accuracy by Topic:');
        Object.entries(byTopic).forEach(([topic, stats]) => {
            const topicAccuracy = (stats.correct / stats.total) * 100;
            console.log(`  ${topic}: ${topicAccuracy.toFixed(1)}% (${stats.correct}/${stats.total})`);
        });

        // Show some incorrect examples
        const incorrectResults = this.results.filter(r => !r.isCorrect).slice(0, 5);
        if (incorrectResults.length > 0) {
            console.log('\n❌ Sample Incorrect Responses:');
            incorrectResults.forEach((r, idx) => {
                console.log(`\n${idx + 1}. Question: ${r.question}`);
                console.log(`   Correct Answer: ${r.correctAnswer}`);
                console.log(`   Bot Response: ${r.botResponse}`);
            });
        }

        // Save detailed results to file
        this.saveResultsToFile();
    }

    /**
     * Save results to JSON file for detailed analysis
     */
    private saveResultsToFile(): void {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(__dirname, `../../validation_results_${timestamp}.json`);

        const output = {
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            correctTests: this.results.filter(r => r.isCorrect).length,
            accuracy: (this.results.filter(r => r.isCorrect).length / this.results.length) * 100,
            results: this.results
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\n💾 Detailed results saved to: ${outputPath}`);
    }
}

/**
 * Main execution
 */
async function main() {
    // Path to MHQA CSV file
    const csvPath = path.join(__dirname, '../../mhqa.csv');

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Error: mhqa.csv not found at ${csvPath}`);
        console.error('Please ensure the mhqa.csv file is in the project root directory.');
        process.exit(1);
    }

    // Run validation
    const validator = new ValidationScript(csvPath);
    await validator.runValidation(50); // Test 50 random questions

    console.log('\n✅ Validation complete!\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

export default ValidationScript;
