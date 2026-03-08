import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from '@aws-sdk/client-transcribe-streaming';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const client = new TranscribeStreamingClient({ region: AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing body" }) };
        }

        const requestData = JSON.parse(event.body);
        const { audioBase64, sampleRate = 16000, languageCode } = requestData;

        if (!audioBase64) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing 'audioBase64'" }) };
        }

        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const chunkSize = 8192;

        async function* audioStream() {
            for (let i = 0; i < audioBuffer.length; i += chunkSize) {
                yield { AudioEvent: { AudioChunk: audioBuffer.slice(i, i + chunkSize) } };
                // Keep stream flowing gracefully
                await new Promise(r => setTimeout(r, 10));
            }
        }

        const transcribeParams: any = {
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: sampleRate,
            AudioStream: audioStream()
        };

        if (languageCode && languageCode !== 'auto') {
            transcribeParams.LanguageCode = languageCode;
        } else {
            // ✅ Multilingual support: Identify the spoken language
            // Limit to 10 languages (Amazon Transcribe Streaming limit)
            transcribeParams.IdentifyLanguage = true;
            transcribeParams.LanguageOptions = 'en-IN,hi-IN,bn-IN,gu-IN,kn-IN,mr-IN,ta-IN,te-IN,pa-IN,en-US';
        }

        const command = new StartStreamTranscriptionCommand(transcribeParams);

        const response = await client.send(command);
        let transcribedText = '';

        if (response.TranscriptResultStream) {
            for await (const event of response.TranscriptResultStream) {
                if (event.TranscriptEvent?.Transcript?.Results) {
                    for (const result of event.TranscriptEvent.Transcript.Results) {
                        if (!result.IsPartial && result.Alternatives && result.Alternatives.length > 0) {
                            transcribedText += result.Alternatives[0].Transcript + ' ';
                        }
                    }
                }
            }
        }

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
            body: JSON.stringify({ text: transcribedText.trim() })
        };

    } catch (error: any) {
        console.error("Transcribe API Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message || "Internal failure for transcription" })
        };
    }
};
