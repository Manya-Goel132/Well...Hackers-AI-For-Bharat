import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const translate = new TranslateClient({ region: process.env.AWS_REGION || 'us-east-1' });
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: "Missing body" };
        const { journalEntries, targetLanguage = 'en' } = JSON.parse(event.body);

        if (!journalEntries || !journalEntries.length) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: "No entries provided" };
        }

        console.log(`📋 Generating Multilingual Therapist Report for ${journalEntries.length} entries...`);

        // 1. AWS Native: Batch Translation
        // We translate everything to the doctor's language (e.g. English)
        const translatedEntries = await Promise.all(journalEntries.map(async (entry: any) => {
            try {
                const transRes = await translate.send(new TranslateTextCommand({
                    Text: entry.content,
                    SourceLanguageCode: 'auto',
                    TargetLanguageCode: targetLanguage
                }));
                return { ...entry, content: transRes.TranslatedText };
            } catch (err) {
                console.warn("Translation failed for an entry, using original.", err);
                return entry;
            }
        }));

        // 2. AWS Native: Clinical Summarization via Bedrock
        const summaryPrompt = `You are a clinical supervisor generating a summary for a fellow therapist. 
Based on these journal entries, identify:
1. Primary Clinical Themes
2. Progress/Decline Trend
3. Key Risk Indicators
4. Recommended areas for the next 1-on-1 session.

JOURNAL ENTRIES:
${translatedEntries.map(e => `[${e.date}]: ${e.content}`).join('\n\n')}
`;

        const aiResponse = await bedrock.send(new ConverseCommand({
            modelId: 'amazon.nova-pro-v1:0',
            system: [{ text: "Summary must be professional, clinical, and structured." }],
            messages: [{ role: 'user', content: [{ text: summaryPrompt }] }]
        }));

        const report = aiResponse.output?.message?.content?.[0]?.text;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                handoverReport: report,
                translatedData: translatedEntries
            })
        };

    } catch (error: any) {
        console.error("Report Generation Error:", error);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: error.message }) };
    }
};
