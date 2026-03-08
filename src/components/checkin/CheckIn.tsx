import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Loader2, Smile, Frown, Meh, ArrowRight, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { doc, setDoc, serverTimestamp } from '../../services/awsShim';
import { db } from '../../services/awsService';

// --- Types ---
interface CheckInData {
    mood: number; // 1-10
    feelings: string[];
    factors: string[];
    sleepQuality: number; // 1-10
    anxietyLevel: number; // 1-10
    note: string;
}

// --- Constants ---
const FEELINGS = [
    'Anxious', 'Calm', 'Confused', 'Energetic',
    'Exhausted', 'Happy', 'Hopeful', 'Irritated',
    'Lonely', 'Proud', 'Sad', 'Stressed'
];

const FACTORS = [
    'Work/School', 'Family', 'Friends', 'Relationship',
    'Health', 'Sleep', 'Money', 'Current Events'
];

export default function CheckIn() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [data, setData] = useState<CheckInData>({
        mood: 5,
        feelings: [],
        factors: [],
        sleepQuality: 5,
        anxietyLevel: 3,
        note: ''
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const toggleSelection = (field: 'feelings' | 'factors', item: string) => {
        setData(prev => {
            const list = prev[field];
            if (list.includes(item)) {
                return { ...prev, [field]: list.filter(i => i !== item) };
            } else {
                return { ...prev, [field]: [...list, item] };
            }
        });
    };

    const submitCheckIn = async () => {
        if (!currentUser) {
            toast.info("Please log in or sign up to save your check-in.");
            navigate('/auth');
            return;
        }
        setIsSubmitting(true);
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const docId = `${today}_${Date.now()}`;

            // 1. Initial Save
            await setDoc(doc(db, 'users', currentUser.uid, 'checkins', docId), {
                ...data,
                date: today,
                timestamp: serverTimestamp(),
                userId: currentUser.uid
            });

            // Track analytics (fire & forget)
            try {
                const { betaAnalyticsService } = await import('../../services/betaAnalyticsService');
                betaAnalyticsService.trackCheckinCompleted(currentUser.uid, data.mood);
            } catch (e) { console.error(e); }

            // 2. Generate AI Insight
            try {
                const { awsService } = await import('../../services/awsService');
                const history = await awsService.getCheckInHistory(currentUser.uid, 4);

                const historyContext = history.length > 0 ? history.slice().reverse().map((h: any) =>
                    `- [${h.date || 'Past'}]: Mood ${h.mood}/10, Sleep ${h.sleepQuality}/10, Anxiety ${h.anxietyLevel}/10`
                ).join('\n') : "No previous history.";

                const context = `
                    Current Check-in Data (Just Now):
                    - Mood: ${data.mood}/10
                    - Sleep: ${data.sleepQuality}/10
                    - Anxiety: ${data.anxietyLevel}/10
                    - Feelings: ${data.feelings.join(', ')}
                    - Factors: ${data.factors.join(', ')}
                    
                    Recent History:
                    ${historyContext}
                    
                    Instructions:
                    1. Analyze the user's immediate state.
                    2. Compare it with the recent history provided above.
                    3. Provide a warm, supportive, and actionable mental health insight (max 2-3 sentences).
                 `;

                const analysis = await awsService.getChatResponse(
                    "Generate a check-in insight.",
                    currentUser.uid,
                    [{ role: 'user', content: context }],
                    'English'
                );

                if (analysis) {
                    await setDoc(doc(db, 'users', currentUser.uid, 'checkins', docId), {
                        aiAnalysis: analysis,
                        aiAnalysisVariants: { 'en': analysis }
                    }, { merge: true });
                }

            } catch (aiError) {
                console.error("AI generation failed:", aiError);
            }

            toast.success("Check-in complete! Taking time for yourself matters.");
            navigate('/');
        } catch (error) {
            console.error("Error saving check-in:", error);
            toast.error("Failed to save check-in. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1_Mood = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-display font-bold text-moss-900">How are you feeling?</h2>
                <p className="text-moss-600">Slide to select your mood</p>
            </div>

            <div className="py-8 px-4">
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.mood}
                    onChange={(e) => setData({ ...data, mood: parseInt(e.target.value) })}
                    className="w-full h-3 bg-sage-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between mt-4 text-sm font-medium text-moss-500">
                    <span>Terrible</span>
                    <span>Okay</span>
                    <span>Awesome</span>
                </div>
            </div>

            <div className="flex justify-center">
                <div className={`p-8 rounded-full transition-all duration-500 shadow-soft ${data.mood <= 3 ? 'bg-red-50 text-red-500' :
                    data.mood <= 7 ? 'bg-orange-50 text-orange-500' :
                        'bg-emerald-50 text-emerald-600'
                    }`}>
                    {data.mood <= 3 ? <Frown size={64} strokeWidth={1.5} /> :
                        data.mood <= 7 ? <Meh size={64} strokeWidth={1.5} /> :
                            <Smile size={64} strokeWidth={1.5} />}
                </div>
            </div>
        </div>
    );

    const renderStep2_Feelings = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-moss-900">What emotions are present?</h2>
                <p className="text-moss-600">Select all that apply</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FEELINGS.map(feeling => (
                    <button
                        key={feeling}
                        onClick={() => toggleSelection('feelings', feeling)}
                        className={`p-4 rounded-xl border text-sm font-medium transition-all duration-200 ${data.feelings.includes(feeling)
                            ? 'bg-moss-900 border-moss-900 text-white shadow-md transform scale-105'
                            : 'bg-white border-sage-100 text-moss-700 hover:bg-sage-50 hover:border-sage-200'
                            }`}
                    >
                        {feeling}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3_Factors = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-moss-900">What's affecting you?</h2>
                <p className="text-moss-600">Identify the sources</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {FACTORS.map(factor => (
                    <button
                        key={factor}
                        onClick={() => toggleSelection('factors', factor)}
                        className={`p-4 rounded-xl border text-sm font-medium transition-all duration-200 ${data.factors.includes(factor)
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-800 ring-1 ring-emerald-200'
                            : 'bg-white border-sage-100 text-moss-700 hover:bg-sage-50 hover:border-sage-200'
                            }`}
                    >
                        {factor}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep4_Vitals = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-moss-900">Quick Check</h2>
                <p className="text-moss-600">Rate these from 1 to 10</p>
            </div>

            <div className="space-y-8 px-4">
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <Label className="text-moss-700 font-semibold text-base">Sleep Quality</Label>
                        <span className="font-bold text-emerald-600 text-xl">{data.sleepQuality}/10</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={data.sleepQuality}
                        onChange={(e) => setData({ ...data, sleepQuality: parseInt(e.target.value) })}
                        className="w-full h-2 bg-sage-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <Label className="text-moss-700 font-semibold text-base">Anxiety Level</Label>
                        <span className="font-bold text-purple-600 text-xl">{data.anxietyLevel}/10</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={data.anxietyLevel}
                        onChange={(e) => setData({ ...data, anxietyLevel: parseInt(e.target.value) })}
                        className="w-full h-2 bg-sage-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto py-8 px-4 md:py-12">
            <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1.5 bg-sage-100 w-full">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                <CardHeader className="pt-8 pb-2 px-8">
                    <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold px-3 py-1 bg-sage-100 text-moss-700 rounded-full uppercase tracking-wider">
                            Step {step} of 4
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="h-8 w-8 text-sage-400 hover:text-moss-600 hover:bg-sage-50 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="px-8 py-6 min-h-[400px] flex flex-col justify-center">
                    {step === 1 && renderStep1_Mood()}
                    {step === 2 && renderStep2_Feelings()}
                    {step === 3 && renderStep3_Factors()}
                    {step === 4 && renderStep4_Vitals()}
                </CardContent>

                <CardFooter className="flex justify-between px-8 py-6 bg-sage-50/50">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1 || isSubmitting}
                        className="text-moss-600 hover:text-moss-900 hover:bg-sage-100"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>

                    {step < 4 ? (
                        <Button
                            onClick={handleNext}
                            className="bg-moss-900 hover:bg-moss-800 text-white shadow-md rounded-full px-6"
                        >
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={submitCheckIn}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow rounded-full px-8"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Check In
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
