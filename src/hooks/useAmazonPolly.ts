import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook to convert text to speech using our AWS Polly Lambda
 */
export function useAmazonPolly() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef(new Audio());

    // Cleanup on unmount
    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    const speak = useCallback(async (text: string, voiceId: string = 'Kajal') => {
        try {
            const audio = audioRef.current;
            // Stop any current speaking
            audio.pause();
            audio.currentTime = 0;

            setIsSpeaking(true);

            const response = await fetch('https://6gcmnzrb72.execute-api.us-east-1.amazonaws.com/speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId })
            });

            const data = await response.json();
            if (data.audioBase64) {
                audio.src = `data:audio/mp3;base64,${data.audioBase64}`;
                audio.onended = () => setIsSpeaking(false);
                audio.onerror = (e) => {
                    console.error("Audio playback error:", e);
                    setIsSpeaking(false);
                };
                await audio.play();
            } else {
                console.warn("No audio data returned from Polly:", data);
                setIsSpeaking(false);
            }
        } catch (err) {
            console.error("Polly TTS error:", err);
            setIsSpeaking(false);
        }
    }, []);

    const stop = useCallback(() => {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        setIsSpeaking(false);
    }, []);

    const unlock = useCallback(async () => {
        const audio = audioRef.current;
        try {
            audio.play().catch(() => { });
            audio.pause();
        } catch (e) { }
    }, []);

    return { speak, stop, unlock, isSpeaking };
}
