import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { dynamo } from '../aws/dynamoDB';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const CRISIS_TOPIC_ARN = process.env.SNS_CRISIS_TOPIC_ARN;

/**
 * AWS Native Event-Driven Crisis Dispatcher
 * Triggered by DynamoDB Streams when a High/Severe risk is detected by AI
 */
export const handler = async (event: DynamoDBStreamEvent, context: Context) => {
    console.log("🚨 Crisis Dispatcher Triggered with", event.Records.length, "records");

    for (const record of event.Records) {
        if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') continue;

        const newImage = record.dynamodb?.NewImage;
        if (!newImage) continue;

        // Extract risk data based on table type
        let riskLevel = "none";
        let userId = "unknown";
        let sourceContent = "";
        let eventType = "unknown";

        // Case A: Chat Session Record
        if (newImage.aiResponseFull) {
            const fullResponse = unmarshal(newImage.aiResponseFull);
            riskLevel = fullResponse?.riskAssessment?.level || "none";
            userId = newImage.userId?.S || "unknown";
            sourceContent = newImage.userMessage?.S || "Chat Message";
            eventType = "CHAT_INTERACTION";
        }
        // Case B: Journal Entry Record
        else if (newImage.aiInsights) {
            const insights = unmarshal(newImage.aiInsights);
            riskLevel = insights?.metadata?.riskLevel || "none";
            userId = newImage.userId?.S || "unknown";
            sourceContent = newImage.content?.S || "Journal Content";
            eventType = "JOURNAL_ENTRY";
        }

        console.log(`🔍 Checking Risk: [${riskLevel}] for User ${userId}`);

        if (riskLevel === 'high' || riskLevel === 'severe') {
            console.warn(`🔥 CRITICAL RISK DETECTED: Dispatching Emergency Alerts for ${userId}`);

            const alertMessage = `
🚨 MANOSATHI EMERGENCY ALERT 🚨
---------------------------------
User ID: ${userId}
Event Type: ${eventType}
Risk Level: ${riskLevel}
Source snippet: "${sourceContent.substring(0, 100)}..."
Timestamp: ${new Date().toISOString()}

This user has triggered a high-severity AI risk flag. 
Please initiate standard clinical wellness protocols and contact the user if consent is provided.
---------------------------------
            `;

            try {
                // 1. Publish to SNS (Managed Messaging)
                if (CRISIS_TOPIC_ARN) {
                    await snsClient.send(new PublishCommand({
                        TopicArn: CRISIS_TOPIC_ARN,
                        Subject: `ManoSathi Crisis Alert: ${riskLevel.toUpperCase()}`,
                        Message: alertMessage
                    }));
                    console.log("✅ SNS Alert Published successfully");
                }

                // 2. Log to Clinical Exceptions Table (Audit Trail)
                await dynamo.send(new PutCommand({
                    TableName: "manosathi-clinical-logs",
                    Item: {
                        logId: `crisis_${Date.now()}_${userId}`,
                        userId,
                        riskLevel,
                        eventType,
                        contentSnippet: sourceContent.substring(0, 200),
                        timestamp: new Date().toISOString(),
                        actionTaken: "SNS_DISPATCHED",
                        requestId: context.awsRequestId
                    }
                }));
                console.log("📂 Crisis event logged to Audit Trail");

            } catch (err) {
                console.error("❌ Failed to dispatch emergency alert:", err);
            }
        }
    }
};

/**
 * Crude unmarshaler for DynamoDB Stream JSON format
 */
function unmarshal(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj.M) {
        const result: any = {};
        for (const key in obj.M) {
            result[key] = unmarshal(obj.M[key]);
        }
        return result;
    }
    if (obj.S) return obj.S;
    if (obj.N) return Number(obj.N);
    if (obj.BOOL !== undefined) return obj.BOOL;
    if (obj.L) return obj.L.map((item: any) => unmarshal(item));
    return obj;
}
