const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");

async function run() {
    try {
        const client = new BedrockRuntimeClient({ region: 'us-east-1' });
        const command = new ConverseCommand({
            modelId: 'amazon.nova-pro-v1:0',
            messages: [{ role: 'user', content: [{ text: "Hello" }] }]
        });
        const res = await client.send(command);
        console.log("Success:", res.output.message.content[0].text);
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
