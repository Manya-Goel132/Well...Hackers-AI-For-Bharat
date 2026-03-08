import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const polly = new PollyClient({ region: AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing body" }) };
        }

        const { text, voiceId = 'Kajal', languageCode = 'en-IN' } = JSON.parse(event.body);

        if (!text) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing text" }) };
        }

        const ssmlText = `<speak><prosody rate="95%">${text}</prosody></speak>`;

        const command = new SynthesizeSpeechCommand({
            Text: ssmlText,
            TextType: 'ssml',
            OutputFormat: 'mp3',
            VoiceId: voiceId, // 'Kajal' for English, 'Aditi' for Hindi
            Engine: 'neural',
            LanguageCode: languageCode
        });

        const response = await polly.send(command);

        if (response.AudioStream) {
            const chunks = [];
            for await (const chunk of response.AudioStream as any) {
                chunks.push(chunk);
            }
            const audioBuffer = Buffer.concat(chunks);
            const base64Audio = audioBuffer.toString('base64');

            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ audioBase64: base64Audio })
            };
        }

        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "No audio stream returned" })
        };

    } catch (error: any) {
        console.error("Polly TTS Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message || "TTS failure" })
        };
    }
};
