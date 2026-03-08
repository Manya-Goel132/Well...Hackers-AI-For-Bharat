import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook to record raw 16kHz PCM audio from the browser,
 * and send it to our AWS API Gateway Lambda for Amazon Transcribe Streaming.
 */
export function useAmazonTranscribe() {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<AudioWorkletNode | null>(null);
    const pcmDataRef = useRef<Int16Array[]>([]);

    const startRecording = useCallback(async () => {
        try {
            pcmDataRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContextCls = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextCls({ sampleRate: 16000 });
            audioCtxRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);

            // ✅ Modern AudioWorklet - runs in its own thread to avoid UI lag
            // Ensure the pcm-worker.js file is in the public/worklets/ directory
            await audioCtx.audioWorklet.addModule('/worklets/pcm-worker.js');
            const worklet = new AudioWorkletNode(audioCtx, 'pcm-worker');
            processorRef.current = worklet;

            source.connect(worklet);
            worklet.connect(audioCtx.destination);

            worklet.port.onmessage = (e: MessageEvent<Int16Array>) => {
                // pcm16 Int16Array received from worker thread
                pcmDataRef.current.push(e.data);
            };

            setIsRecording(true);
            toast.info("Recording started. Speak into the mic...");
        } catch (err: any) {
            console.error("Microphone access error:", err);
            toast.error("Could not access microphone.");
            setIsRecording(false);
        }
    }, []);

    const stopRecordingAndTranscribe = useCallback(async (languageCode: string = 'auto'): Promise<string> => {
        return new Promise(async (resolve) => {
            if (!isRecording || !processorRef.current || !streamRef.current || !audioCtxRef.current) {
                resolve("");
                return;
            }

            try {
                // Disconnect worklet
                processorRef.current.disconnect();
                streamRef.current.getTracks().forEach((t) => t.stop());
                await audioCtxRef.current.close();

                setIsRecording(false);
                setIsTranscribing(true);
                toast.loading("Transcribing your voice...");

                // Flatten all PCM chunks into one single array
                const length = pcmDataRef.current.reduce((acc, val) => acc + val.length, 0);
                // Require at least 1 second of audio (16,000 samples at 16kHz)
                // for reliable language identification and transcription.
                if (length < 16000) {
                    toast.dismiss();
                    setIsTranscribing(false);
                    if (length > 0) {
                        toast.warning("Captured audio was too short. Please speak for at least 1 second.");
                    }
                    resolve("");
                    return;
                }

                const flatPcm = new Int16Array(length);
                let offset = 0;
                for (const chunk of pcmDataRef.current) {
                    flatPcm.set(chunk, offset);
                    offset += chunk.length;
                }

                // Convert to Uint8Array for Base64 encoding
                const byteBuf = new Uint8Array(flatPcm.buffer);

                // Quick base64 encode for large arrays safely
                const chunkSize = 0x8000;
                const stringChunks: string[] = [];
                for (let i = 0; i < byteBuf.length; i += chunkSize) {
                    const sub = byteBuf.subarray(i, i + chunkSize);
                    stringChunks.push(String.fromCharCode(...Array.from(sub)));
                }
                const base64Audio = btoa(stringChunks.join(''));

                // Call our AWS API Gateway Endpoint
                fetch('https://6gcmnzrb72.execute-api.us-east-1.amazonaws.com/transcribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audioBase64: base64Audio,
                        sampleRate: 16000,
                        languageCode: languageCode
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        toast.dismiss();
                        setIsTranscribing(false);
                        if (data.error) {
                            toast.error("Transcription failed.");
                            console.error(data.error);
                            resolve("");
                        } else {
                            // Success! Return the transcribed string
                            toast.success("Transcription complete!");
                            resolve(data.text || "");
                        }
                    })
                    .catch(err => {
                        toast.dismiss();
                        setIsTranscribing(false);
                        console.error("Transcribe API err:", err);
                        toast.error("Network issue with transcription service.");
                        resolve("");
                    });

            } catch (e) {
                toast.dismiss();
                setIsTranscribing(false);
                console.error("Error stopping recording:", e);
                resolve("");
            }
        });
    }, [isRecording]);

    // Handle abrupt cleanups
    const cancelRecording = useCallback(() => {
        if (processorRef.current) processorRef.current.disconnect();
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        if (audioCtxRef.current) audioCtxRef.current.close().catch(() => { });
        setIsRecording(false);
        setIsTranscribing(false);
    }, []);

    return {
        isRecording,
        isTranscribing,
        startRecording,
        stopRecordingAndTranscribe,
        cancelRecording
    };
}

export const INDIAN_LANGS = [
    { label: 'Auto Detect', code: 'auto' },
    { label: 'Hindi + English (Hinglish)', code: 'hi-IN' },
    { label: 'Indian English', code: 'en-IN' },
    { label: 'Bengali', code: 'bn-IN' },
    { label: 'Marathi', code: 'mr-IN' },
    { label: 'Telugu', code: 'te-IN' },
    { label: 'Tamil', code: 'ta-IN' },
    { label: 'Gujarati', code: 'gu-IN' },
    { label: 'Kannada', code: 'kn-IN' },
    { label: 'Malayalam', code: 'ml-IN' },
    { label: 'Punjabi', code: 'pa-IN' },
    { label: 'Odia', code: 'or-IN' },
    { label: 'Assamese', code: 'as-IN' },
    { label: 'International English', code: 'en-US' }
];
