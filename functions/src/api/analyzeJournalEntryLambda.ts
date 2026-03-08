import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamo, TABLE_NAMES } from '../aws/dynamoDB';
import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { ComprehendClient, DetectPiiEntitiesCommand } from "@aws-sdk/client-comprehend";

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const comprehend = new ComprehendClient({ region: process.env.AWS_REGION || 'us-east-1' });

const MODEL_ID = 'amazon.nova-pro-v1:0';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log("📥 Received Journal Analysis Event");

        if (!event.body) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing body" }) };
        }

        const requestData = JSON.parse(event.body);
        const { entryId, content, mood } = requestData;

        if (!entryId || !content) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing 'entryId' or 'content'" }) };
        }

        // ─── AWS Native Security: PII Redaction ──────────────────────────
        let safeContent = content;
        try {
            const piiResponse = await comprehend.send(new DetectPiiEntitiesCommand({
                Text: content,
                LanguageCode: 'en' // Simplified, could use dynamic detection
            }));

            // Mask detected entities
            if (piiResponse.Entities) {
                for (const entity of piiResponse.Entities.sort((a, b) => (b.BeginOffset || 0) - (a.BeginOffset || 0))) {
                    safeContent = safeContent.substring(0, entity.BeginOffset) + "[REDACTED]" + safeContent.substring(entity.EndOffset || 0);
                }
                console.log("🛡️ PII Entities Redacted from AI input");
            }
        } catch (piiErr) {
            console.error("Warning: PII Redaction failed, proceeding with caution:", piiErr);
        }
        // ──────────────────────────────────────────────────────────────────

        // Check if journal already has insights globally
        try {
            const entryResp = await dynamo.send(new GetCommand({
                TableName: TABLE_NAMES.JOURNALS,
                Key: { id: entryId }
            }));
            if (entryResp.Item?.aiInsights) {
                console.log("Entry already analyzed.");
                return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Already analyzed", data: entryResp.Item.aiInsights }) };
            }
        } catch (e) { /* Ignore */ }

        let systemPrompt = `You are an AI performing mental health journal analysis for an Indian wellness platform.
Analyze the user's journal entry and return ONLY a valid JSON object matching this schema exactly. Do NOT wrap it in markdown. Do NOT add extra text outside of the JSON block.

{
  "detectedLanguage": "en | hi | ta | etc",
  "conversationalResponse": "Warm, empathetic reply (1-2 sentences)",
  "therapeuticPerspective": "Professional psychological insight",
  "thoughtPatterns": "Cognitive patterns identified",
  "emotionalNuance": "Deep emotional layers",
  "tryThis": "Optional gentle suggestion",
  "keyThemes": ["theme1", "theme2"],
  "metadata": {
    "sentimentScore": -1.0 to 1.0,
    "cognitiveDistortions": [],
    "culturalContext": "Culture relevance",
    "riskFlags": []
  }
}
`;

        let insights: any = null;
        try {
            const sdkResponse = await bedrockClient.send(new ConverseCommand({
                modelId: MODEL_ID,
                inferenceConfig: { maxTokens: 1500, temperature: 0.6, topP: 0.9 },
                system: [{ text: systemPrompt }],
                messages: [{
                    role: 'user',
                    content: [{ text: `MOOD: ${mood || 'neutral'}\n\nJOURNAL CONTENT: ${safeContent}` }]
                }]
            }));
            const aiText = sdkResponse.output?.message?.content?.[0]?.text;
            if (aiText) {
                let cleanJson = aiText.trim();
                if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
                if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
                if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
                try { insights = JSON.parse(cleanJson); } catch (err) { console.error('JSON parse error:', err); }
            }
        } catch (bedrockErr) {
            console.error('Bedrock SDK Error (journal):', bedrockErr);
            throw new Error('Bedrock request failed');
        }

        if (!insights) {
            insights = { summary: "Could not completely analyze the journal entry at this time." };
        }

        // Finally, save insights using DynamoDB
        try {
            await dynamo.send(new UpdateCommand({
                TableName: TABLE_NAMES.JOURNALS,
                Key: { id: entryId },
                UpdateExpression: "SET aiInsights = :insights, analyzedAt = :time",
                ExpressionAttributeValues: {
                    ":insights": insights,
                    ":time": new Date().toISOString()
                },
                ReturnValues: "ALL_NEW"
            }));
            console.log(`✅ Successfully analyzed entry ${entryId}`);

            // ─── AWS Native: CloudWatch Health Metrics ────────────────────────
            // Publish the sentiment score to CloudWatch for time-series visualization
            const sentimentScore = insights?.metadata?.sentimentScore || 0;
            try {
                await cloudwatch.send(new PutMetricDataCommand({
                    Namespace: "ManoSathi/Wellness",
                    MetricData: [
                        {
                            MetricName: "SentimentScore",
                            Dimensions: [
                                { Name: "UserId", Value: requestData.userId || "anonymous" }
                            ],
                            Value: sentimentScore,
                            Unit: "None",
                            Timestamp: new Date()
                        }
                    ]
                }));
                console.log(`📊 Published sentiment metric (${sentimentScore}) to CloudWatch`);
            } catch (cwErr) {
                console.error("Warning: Failed to publish CloudWatch metric:", cwErr);
            }
            // ──────────────────────────────────────────────────────────────────
        } catch (dbError) {
            console.error(`Warning: Could not update dynamo table for entry ${entryId}`, dbError);
            // It might fail if the table isn't created during local testing, but we return 200 to frontend anyway
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(insights)
        };

    } catch (error: any) {
        console.error("Journal Analysis Error:", error);
        return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Internal Error" }) };
    }
};
