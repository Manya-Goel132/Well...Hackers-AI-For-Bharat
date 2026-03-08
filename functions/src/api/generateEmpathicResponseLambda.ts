import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamo, TABLE_NAMES } from '../aws/dynamoDB';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

import { awsBedrockAI } from '../awsBedrockAI';

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * AWS API Gateway + Lambda Handler for Generating Empathetic Chat Responses
 * Replaces the Firebase `onCall` function `generateEmpathicResponse`
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log("📥 Received Event:", JSON.stringify(event));

        // 1. API Gateway usually parses the body as a JSON string
        if (!event.body) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "Missing required request body." })
            };
        }

        const requestData = JSON.parse(event.body);

        // Security check - Instead of request.auth (Firebase), AWS handles this via
        // API Gateway Authorizers. Here we extract the authorized IAM/Cognito UID.
        // For Hackathon testing, we will just expect it in the body until Cognito is linked.
        const userId = requestData.userId ||
            (event.requestContext?.authorizer?.claims?.sub) ||
            'anonymous-test-user';

        const {
            userMessage,
            riskAssessment,
            emotionalAnalysis,
            previousMessages,
            userProfile,
            assessments,
            sessionId, // Adding sessionId for DynamoDB Chat grouping
            multimodalImage // AWS Native: Multimodal Support
        } = requestData;

        if (!userMessage) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "Missing 'userMessage'." })
            };
        }

        console.log(`🤖 Generating therapeutic response for user ${userId}`);
        console.log(`📥 Received ${previousMessages?.length || 0} previous messages`);

        // 2. Fetch User Preferences locally from Amazon DynamoDB (AWS Native Pattern)
        let dynamoUserProfile = userProfile;
        try {
            const getProfileCmd = new GetCommand({
                TableName: TABLE_NAMES.USERS,
                Key: { id: userId } // Assuming 'id' is Hash Key
            });
            const profileRes = await dynamo.send(getProfileCmd);
            if (profileRes.Item) {
                dynamoUserProfile = { ...profileRes.Item, ...userProfile };
            }
        } catch (dbErr) {
            console.error("Warning: Could not fetch profile from DynamoDB. Proceeding with payload profile.", dbErr);
        }

        // 2.5 Retrieve Clinical Guidelines from S3 (RAG Workflow Concept)
        let clinicalKnowledge = "";
        try {
            // In a real AWS environment, you would use Bedrock Knowledge Bases Retrieve API here
            // For now, we simulate grounding our AI in evidence-based therapy documents
            clinicalKnowledge = "Use the 'Empathetic Containment' framework: Validate feelings first, then name the primary emotion tentatively, and end with a grounding breath.";
            console.log("📚 Grounding AI in Clinical Knowledge Base...");
        } catch (ragErr) {
            console.error("RAG Error:", ragErr);
        }

        // 3. Trigger Bedrock AI directly
        const therapeuticResponse = await awsBedrockAI.generateEmpathicResponse_Full(
            userMessage,
            {
                userId,
                sessionId: sessionId || `session_${new Date().toISOString().split('T')[0]}`,
                userProfile: dynamoUserProfile || {},
                currentState: { mood: emotionalAnalysis?.primaryEmotion, crisisRisk: riskAssessment?.level },
                assessmentScores: assessments,
                therapeuticGoals: [],
                conversationHistory: previousMessages || [],
                clinicalGrounding: clinicalKnowledge,
                multimodalImage: multimodalImage || undefined
            }
        );

        // 4. Save the interaction to DynamoDB for Long-Term Memory
        try {
            const currentSessionId = sessionId || `session_${new Date().toISOString().split('T')[0]}`;

            // Format for DynamoDB
            const chatEntryId = `${userId}_${Date.now()}`;

            const putCmd = new PutCommand({
                TableName: TABLE_NAMES.CHATS,
                Item: {
                    chatId: chatEntryId,         // Hash Key
                    userId: userId,              // GSI Hash Key
                    sessionId: currentSessionId, // GSI Sort Key
                    userMessage: userMessage,
                    aiResponseText: therapeuticResponse.message,
                    aiResponseFull: therapeuticResponse,
                    timestamp: new Date().toISOString(),
                }
            });
            await dynamo.send(putCmd);
            console.log("💾 Saved Chat interaction to DynamoDB");

            // 📊 Push real-time sentiment to CloudWatch Pulse
            try {
                await cloudwatch.send(new PutMetricDataCommand({
                    Namespace: "ManoSathi/Wellness",
                    MetricData: [
                        {
                            MetricName: "SentimentScore",
                            Dimensions: [{ Name: "UserId", Value: userId }],
                            Value: therapeuticResponse.sentimentScore || 0,
                            Unit: "None",
                            Timestamp: new Date()
                        }
                    ]
                }));
            } catch (cwErr) {
                console.error("Warning: CloudWatch metrics failed for chat.", cwErr);
            }

        } catch (dbSaveErr) {
            // Non-fatal error
            console.error("Warning: Failed to persist interaction to DynamoDB:", dbSaveErr);
        }

        // 5. Return API Gateway standard response
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // CORS
            },
            body: JSON.stringify(therapeuticResponse)
        };

    } catch (error: any) {
        console.error("❌ Fatal Error in AWS Lambda API Handler:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                error: "Internal Server Error",
                details: error.message
            })
        };
    }
};
