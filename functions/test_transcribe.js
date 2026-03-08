const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require('@aws-sdk/client-transcribe-streaming');
const client = new TranscribeStreamingClient({ region: 'us-east-1' });

async function test() {
    try {
        const audioBuffer = Buffer.alloc(32000, 0); // 1 second of silence at 16000hz 16-bit
        const chunkSize = 8000;

        async function* audioStream() {
            for (let i = 0; i < audioBuffer.length; i += chunkSize) {
                yield { AudioEvent: { AudioChunk: audioBuffer.slice(i, i + chunkSize) } };
                await new Promise(r => setTimeout(r, 50));
            }
        }

        const command = new StartStreamTranscriptionCommand({
            LanguageCode: 'en-US',
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: 16000, // Important!
            AudioStream: audioStream()
        });

        console.log("Starting stream...");
        const response = await client.send(command);
        let transcribedText = '';

        if (response.TranscriptResultStream) {
            for await (const event of response.TranscriptResultStream) {
                if (event.TranscriptEvent?.Transcript?.Results) {
                    for (const result of event.TranscriptEvent.Transcript.Results) {
                        if (!result.IsPartial && result.Alternatives && result.Alternatives.length > 0) {
                            transcribedText += result.Alternatives[0].Transcript + ' ';
                            console.log("Partial result:", result.Alternatives[0].Transcript);
                        }
                    }
                }
            }
        }
        console.log('Final text:', transcribedText);
    } catch (e) {
        console.error("FAIL:", e);
    }
}
test();
