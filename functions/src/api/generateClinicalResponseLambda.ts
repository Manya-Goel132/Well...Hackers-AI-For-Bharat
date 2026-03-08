import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamo, TABLE_NAMES } from '../aws/dynamoDB';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

const MODEL_ID = 'amazon.nova-pro-v1:0';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

const CRISIS_KEYWORDS = [
    'kill myself', 'end my life', 'want to die', 'suicide', 'suicidal',
    'hurt myself', 'harm myself', 'self harm', 'cut myself',
    'better off dead', 'no reason to live', 'can\'t go on',
    'end it all', 'take my life'
];

const PRESCRIPTION_KEYWORDS = [
    'prescribe', 'prescription', 'medication', 'medicine', 'drug',
    'ssri', 'snri', 'antidepressant', 'anti-depressant',
    'anxiolytic', 'benzodiazepine', 'pills', 'tablets'
];

function detectCrisis(message: string): boolean {
    return CRISIS_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword));
}

function detectPrescriptionRequest(message: string): boolean {
    return PRESCRIPTION_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword));
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log("📥 Received Clinical AI Event:", JSON.stringify(event));

        if (!event.body) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing body" }) };
        }

        const requestData = JSON.parse(event.body);
        const userId = requestData.userId || event.requestContext?.authorizer?.claims?.sub || 'anonymous';
        const { userMessage, conversationHistory = [], contextOptions = {} } = requestData;

        if (!userMessage) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing 'userMessage'" }) };
        }

        // 1. SAFETY CHECKS
        if (detectCrisis(userMessage)) {
            return {
                statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "🚨 **I'm very concerned about your safety right now.**\n\nPlease reach out: Tele-MANAS (14416) or Emergency Services (108).", mode: 'pro', error: true })
            };
        }
        if (detectPrescriptionRequest(userMessage)) {
            return {
                statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "I cannot prescribe medications. This requires a licensed psychiatrist. For medication consultation in India, please contact NIMHANS (+91-80-26995000).", mode: 'pro', error: true })
            };
        }

        // 2. Fetch User Profile from DynamoDB
        let dynamoUserProfile: any = {};
        try {
            const profileRes = await dynamo.send(new GetCommand({ TableName: TABLE_NAMES.USERS, Key: { id: userId } }));
            if (profileRes.Item) dynamoUserProfile = profileRes.Item;
        } catch (e) {
            console.error("Warning: Could not fetch profile", e);
        }

        if (dynamoUserProfile.consents && dynamoUserProfile.consents.proModeAccess === false) {
            return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "User has not consented to AI Companion Pro" }) };
        }

        // 3. Build Bedrock Prompt
        let systemPrompt = `You are AI Companion Pro, a specialized Clinical AI designed for mental health diagnosis and therapeutic treatment planning.
PRIMARY OBJECTIVES:
1. Clinical Diagnosis: Use structured interviewing tools.
2. Therapeutic Treatment: Provide structured, evidence-based interventions.
CRITICAL RULES:
1. NEVER prescribe medications.
2. ALWAYS include disclaimers that this is not a substitute for professional care.

Write your response in natural prose. Follow your response with this EXACT metadata block format:

---METADATA---
TONE: professional | empathetic | diagnostic
RISK: none | low | moderate | high | severe
SENTIMENT: -1.0 to 1.0
---END---
`;

        if (contextOptions.phq9Score !== undefined) systemPrompt += `- PHQ-9 Score: ${contextOptions.phq9Score}/27\n`;
        if (contextOptions.gad7Score !== undefined) systemPrompt += `- GAD-7 Score: ${contextOptions.gad7Score}/21\n`;
        if (contextOptions.activeTreatmentPlan) systemPrompt += `- Active Therapy Module: "${contextOptions.activeTreatmentPlan}"\n`;

        const contents: any[] = [];
        for (const msg of conversationHistory.slice(-5)) {
            contents.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: [{ text: msg.content }] });
        }
        contents.push({ role: 'user', content: [{ text: userMessage }] });

        // 4. Call Amazon Nova Pro via Bedrock Converse
        let rawAiText = "I apologize, but I am having technical difficulties.";
        try {
            const sdkResponse = await bedrockClient.send(new ConverseCommand({
                modelId: MODEL_ID,
                inferenceConfig: { maxTokens: 1500, temperature: 0.5, topP: 0.8 },
                system: [{ text: systemPrompt }],
                messages: contents.map((m: any) => ({ ...m, role: m.role as 'user' | 'assistant' }))
            }));
            rawAiText = sdkResponse.output?.message?.content?.[0]?.text || rawAiText;
        } catch (bedrockErr) {
            console.error('Bedrock SDK Error (clinical):', bedrockErr);
        }

        // Parse Metadata
        let aiText = rawAiText;
        let sentimentScore = 0;
        const metadataMatch = rawAiText.match(/---METADATA---([\s\S]*?)---END---/);
        if (metadataMatch) {
            aiText = rawAiText.substring(0, rawAiText.indexOf('---METADATA---')).trim();
            const sentimentMatch = metadataMatch[1].match(/SENTIMENT:\s*([0-9.-]+)/i);
            if (sentimentMatch) sentimentScore = parseFloat(sentimentMatch[1]);
        }

        if (!aiText.includes('*Note:')) aiText += '\n\n*Note: This information is educational. Please consult a healthcare provider for personalized medical advice.*';

        // 5. Save Clinical Log and Push Metrics
        try {
            await dynamo.send(new PutCommand({
                TableName: "manosathi-clinical-logs",
                Item: {
                    logId: `${userId}_${Date.now()}`,
                    userId: userId,
                    userMessage: userMessage,
                    aiResponse: aiText,
                    sentimentScore: sentimentScore,
                    mode: 'pro',
                    timestamp: new Date().toISOString()
                }
            }));

            // 📊 Push to CloudWatch
            await cloudwatch.send(new PutMetricDataCommand({
                Namespace: "ManoSathi/Wellness",
                MetricData: [
                    {
                        MetricName: "SentimentScore",
                        Dimensions: [{ Name: "UserId", Value: userId }],
                        Value: sentimentScore,
                        Unit: "None",
                        Timestamp: new Date()
                    }
                ]
            }));
        } catch (err) {
            console.error("Warning: Failed to log clinical response/metrics", err);
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: aiText, mode: 'pro', timestamp: new Date().toISOString() })
        };

    } catch (error: any) {
        console.error("Clinical Lambda Error:", error);
        return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Internal Error" }) };
    }
};
