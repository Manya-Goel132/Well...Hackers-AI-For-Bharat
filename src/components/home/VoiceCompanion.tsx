import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Mic, MicOff, Volume2, VolumeX, X, BrainCircuit, Sparkles, Activity, Loader2 } from 'lucide-react';
import { cn } from '../ui/utils';
import { toast } from 'sonner';
import { useAmazonTranscribe, INDIAN_LANGS } from '../../hooks/useAmazonTranscribe';
import { useAmazonPolly } from '../../hooks/useAmazonPolly';
import { getStandardResponse } from '../../services/standardAIService';
import { useAuth } from '../auth/AuthProvider';
import { useWellness } from '../../contexts/WellnessContext';
import { awsService } from '../../services/awsService';

interface VoiceCompanionProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VoiceCompanion: React.FC<VoiceCompanionProps> = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const { phq9Score, gad7Score, latestJournalScore, activeTreatmentPlan } = useWellness();
    const [userData, setUserData] = useState<any>(null);
    const audioUnlockedRef = useRef(false);

    const { isRecording, isTranscribing, startRecording, stopRecordingAndTranscribe } = useAmazonTranscribe();
    const { speak, stop, unlock, isSpeaking } = useAmazonPolly();

    const [isMuted, setIsMuted] = useState(false);
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState('');
    const [aiResponseText, setAiResponseText] = useState('');
    const [voiceLanguage, setVoiceLanguage] = useState('auto');
    const [volumeArray, setVolumeArray] = useState<number[]>(new Array(16).fill(0.1));

    // Animation refs for the "Orb"
    const orbRef = useRef<HTMLDivElement>(null);

    // Load user profile for context
    useEffect(() => {
        if (!currentUser || !isOpen) return;
        awsService.getUserProfile(currentUser.uid).then(setUserData).catch(console.error);
    }, [currentUser, isOpen]);

    // Sync status with hooks
    useEffect(() => {
        if (isRecording) setStatus('listening');
        else if (isTranscribing) setStatus('thinking');
        else if (isSpeaking) setStatus('speaking');
        else setStatus('idle');
    }, [isRecording, isTranscribing, isSpeaking]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            stop();
            if (isRecording) stopRecordingAndTranscribe();
        }
    }, [isOpen]);

    // Voice intensity animation
    useEffect(() => {
        let interval: any;
        if (status === 'listening' || status === 'speaking') {
            interval = setInterval(() => {
                setVolumeArray(prev => prev.map(() => 0.1 + Math.random() * 0.9));
            }, 100);
        } else {
            setVolumeArray(new Array(16).fill(0.1));
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status]);

    if (!isOpen) return null;

    const handleVoiceToggle = async () => {
        // Unlock audio on first interaction
        if (!audioUnlockedRef.current) {
            await unlock();
            audioUnlockedRef.current = true;
        }

        if (!isRecording) {
            setTranscript('');
            setAiResponseText('');
            stop(); // Stop any existing speech
            await startRecording();
        } else {
            const userText = await stopRecordingAndTranscribe(voiceLanguage);
            if (!userText) {
                toast.warning("I didn't catch that. Please try speaking again.");
                setStatus('idle');
                return;
            }

            setTranscript(userText);
            setStatus('thinking');

            try {
                // Get AI Response using the same logic as Chat
                const response = await getStandardResponse(
                    userText,
                    currentUser?.uid || 'guest',
                    [], // Brief session for voice
                    {
                        userProfile: {
                            name: currentUser?.displayName || userData?.displayName || 'Friend',
                            age: userData?.age || 22,
                            gender: userData?.gender || 'unknown',
                            location: userData?.location || 'India',
                            bio: userData?.bio || '',
                            preferredLanguage: userData?.preferences?.language || 'auto',
                            culturalBackground: 'Indian',
                            interests: userData?.interests || [],
                            comfortEnvironment: 'calm',
                            previousSessions: 0
                        },
                        currentState: {
                            mood: 'talking',
                            stressLevel: 'moderate',
                            energyLevel: 'moderate',
                            crisisRisk: 'low',
                            emotionalTone: 'reflective'
                        },
                        assessmentScores: {
                            phq9: phq9Score || 0,
                            gad7: gad7Score || 0,
                            overallWellness: latestJournalScore || 50
                        },
                        therapeuticGoals: activeTreatmentPlan ? [activeTreatmentPlan] : ['Support']
                    }
                );

                setAiResponseText(response.message);

                if (!isMuted) {
                    toast.info("Assistant is responding...", { duration: 2000 });
                    await speak(response.message);
                } else {
                    toast.success("Response received (Muted)");
                    setStatus('idle');
                }
            } catch (err) {
                console.error("Voice AI error:", err);
                toast.error("I'm having trouble thinking. Can you try saying that again?");
                setStatus('idle');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <Card className="w-full max-w-lg bg-[#0f172a]/95 border-white/10 shadow-2xl relative overflow-hidden text-white rounded-[2rem]">
                {/* Visual Background Glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

                <CardContent className="p-8 flex flex-col items-center gap-8 relative z-10">
                    {/* Header */}
                    <div className="w-full flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20">
                                <BrainCircuit className="w-6 h-6 text-primary-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">ManoSathi Voice</h2>
                                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-primary-400" />
                                    Powered by Amazon Nova Sonic
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>

                    {/* Language Selector */}
                    <div className="w-full flex justify-center -mt-4">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 text-primary-400" />
                            <select
                                value={voiceLanguage}
                                onChange={(e) => setVoiceLanguage(e.target.value)}
                                className="bg-transparent text-[10px] font-bold text-slate-300 uppercase outline-none cursor-pointer border-none p-0 focus:ring-0 appearance-none"
                            >
                                {INDIAN_LANGS.map(l => (
                                    <option key={l.code} value={l.code} className="bg-slate-900 text-white lowercase">
                                        {l.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* The "Sonic Orb" Visualizer */}
                    <div className="relative flex items-center justify-center h-64 w-full group">
                        {/* Outer Glow Circles */}
                        <div className={cn(
                            "absolute w-48 h-48 rounded-full border border-white/5 animate-ping duration-[3000ms]",
                            status === 'listening' && "border-primary-500/30",
                            status === 'speaking' && "border-purple-500/30"
                        )} />

                        {/* The Central Orb */}
                        <div
                            ref={orbRef}
                            className={cn(
                                "w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 relative z-20 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                                status === 'idle' && "bg-gradient-to-br from-slate-800 to-slate-900 scale-100 border border-white/10",
                                status === 'listening' && "bg-gradient-to-br from-primary-600 to-primary-900 scale-110 shadow-[0_0_80px_rgba(59,130,246,0.4)]",
                                status === 'thinking' && "bg-gradient-to-br from-indigo-600 to-purple-900 scale-105 animate-pulse",
                                status === 'speaking' && "bg-gradient-to-br from-purple-600 to-pink-900 scale-110 shadow-[0_0_80px_rgba(168,85,247,0.4)]"
                            )}
                        >
                            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />

                            {/* Animated Waves */}
                            <div className="flex items-end gap-1 h-16 px-4">
                                {volumeArray.map((vol, i) => (
                                    <div
                                        key={i}
                                        style={{ height: `${vol * 100}%` }}
                                        className={cn(
                                            "w-1.5 rounded-full transition-all duration-100",
                                            status === 'idle' && "bg-white/20 h-2",
                                            status === 'listening' && "bg-white h-2",
                                            status === 'thinking' && "bg-white/40 h-3 animate-bounce",
                                            status === 'speaking' && "bg-white h-2 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute bottom-0 flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold tracking-widest uppercase text-slate-300">
                            {status === 'thinking' ? (
                                <Loader2 className="w-3 h-3 text-primary-400 animate-spin" />
                            ) : (
                                <Activity className={cn("w-3 h-3 text-primary-400", status !== 'idle' && "animate-pulse")} />
                            )}
                            {status}
                        </div>
                    </div>

                    {/* Transcript Hint */}
                    <div className="min-h-[2.5rem] w-full text-center px-4 overflow-hidden">
                        {transcript && (
                            <p className="text-xs text-slate-400 animate-in fade-in slide-in-from-top-2">
                                &ldquo;{transcript}&rdquo;
                            </p>
                        )}
                        {aiResponseText && status === 'speaking' && (
                            <p className="text-sm text-slate-200 mt-2 line-clamp-2 italic">
                                {aiResponseText}
                            </p>
                        )}
                    </div>

                    {/* Control Bar */}
                    <div className="flex items-center gap-6 w-full justify-center">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                if (!isMuted) stop();
                                setIsMuted(!isMuted);
                            }}
                            className={cn(
                                "w-14 h-14 rounded-full border-white/10 transition-all shadow-xl",
                                isMuted ? "bg-red-500 hover:bg-red-600 border-red-500 shadow-red-500/20" : "bg-white/5 hover:bg-white/10 text-white"
                            )}
                        >
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </Button>

                        <button
                            onClick={handleVoiceToggle}
                            disabled={isTranscribing}
                            className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group",
                                isRecording
                                    ? "bg-red-500 scale-95 shadow-red-500/40"
                                    : "bg-white scale-100 hover:scale-105 shadow-white/20 active:scale-90",
                                isTranscribing && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 rounded-full animate-ping opacity-20 bg-inherit",
                                !isRecording && "hidden"
                            )} />
                            {isRecording
                                ? <MicOff className="w-10 h-10 text-white" />
                                : <Mic className={cn("w-10 h-10 transition-transform", isTranscribing ? "text-slate-400" : "text-slate-900 group-hover:scale-110")} />
                            }
                        </button>

                        <div className="w-14 h-14" /> {/* Placeholder for alignment */}
                    </div>

                    {/* Subtitle / Transcript Area */}
                    <div className="w-full min-h-16 flex items-center justify-center px-4">
                        <p className={cn(
                            "text-center text-base font-medium transition-all duration-300",
                            status === 'idle' ? "text-slate-500" : "text-slate-200",
                            status === 'thinking' && "animate-pulse"
                        )}>
                            {status === 'idle' && "How are you feeling? Tap the mic to speak."}
                            {status === 'listening' && "I'm listening..."}
                            {status === 'thinking' && "Reflecting on your words..."}
                            {status === 'speaking' && "Whispering words of care..."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
