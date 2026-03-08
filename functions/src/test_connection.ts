
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID = 'amazon.nova-pro-v1:0';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

async function verifyConnection() {
    console.log(`🚀 Testing connection to Model: ${MODEL_ID} in ${AWS_REGION}...`);
    const client = new BedrockRuntimeClient({ region: AWS_REGION });

    try {
        const command = new ConverseCommand({
            modelId: MODEL_ID,
            messages: [
                {
                    role: 'user',
                    content: [{ text: "Hello! If you can hear me, respond with: 'The wellness engine is live.'" }]
                }
            ],
            inferenceConfig: {
                maxTokens: 100,
                temperature: 0.5
            }
        });

        const response = await client.send(command);
        const text = response.output?.message?.content?.[0]?.text;

        if (text) {
            console.log("\n✅ [SUCCESS] Bedrock Response Received:");
            console.log("------------------------------------------");
            console.log(text);
            console.log("------------------------------------------");
            console.log(`\n💰 Usage: ${response.usage?.totalTokens} tokens`);
            console.log(`🔍 Model used: ${MODEL_ID}`);
        } else {
            console.log("⚠️ [WARNING] Received empty response from Bedrock.");
        }
    } catch (error: any) {
        console.error("\n❌ [FAILURE] Failed to connect to Bedrock:");
        console.error("Full Error:", JSON.stringify(error, null, 2));
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);

        if (error.name === 'AccessDeniedException') {
            console.error("\n💡 TIP: You likely haven't enabled 'Claude 4.6 Sonnet' in AWS Bedrock Model Access console yet.");
            console.error("Go to: https://console.aws.amazon.com/bedrock/home#/modelaccess to enable it.");
        } else if (error.name === 'ValidationException' && error.message.includes('modelId')) {
            console.error("\n💡 TIP: The model ID might be slightly different in your region or Bedrock hasn't rolled out Claude 4.6 globally yet.");
        }
    }
}

verifyConnection();
