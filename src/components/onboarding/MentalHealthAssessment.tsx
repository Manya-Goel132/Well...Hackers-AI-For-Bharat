import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { AlertCircle, Brain, Heart, Moon, Zap } from 'lucide-react';

const SYMPTOM_OPTIONS = {
    depression: [
        { id: 'low_mood', label: 'Persistent sad, empty, or hopeless mood' },
        { id: 'loss_of_interest', label: 'Loss of interest in activities you used to enjoy' },
        { id: 'fatigue', label: 'Feeling tired or having low energy most days' },
        { id: 'sleep_issues', label: 'Trouble sleeping or sleeping too much' },
        { id: 'appetite_changes', label: 'Changes in appetite or weight' },
        { id: 'concentration', label: 'Difficulty concentrating or making decisions' },
        { id: 'worthlessness', label: 'Feelings of worthlessness or excessive guilt' },
    ],
    anxiety: [
        { id: 'excessive_worry', label: 'Excessive worry about multiple things' },
        { id: 'restless', label: 'Feeling restless, keyed up, or on edge' },
        { id: 'panic_attacks', label: 'Sudden panic attacks or intense fear' },
        { id: 'physical_symptoms', label: 'Physical symptoms like rapid heartbeat, sweating, trembling' },
        { id: 'avoidance', label: 'Avoiding situations or places due to anxiety' },
        { id: 'muscle_tension', label: 'Muscle tension or feeling easily fatigued' },
    ],
    sleep: [
        { id: 'insomnia', label: 'Difficulty falling asleep or staying asleep' },
        { id: 'nightmares', label: 'Frequent nightmares or disturbing dreams' },
        { id: 'early_waking', label: 'Waking up too early and unable to go back to sleep' },
    ],
    trauma: [
        { id: 'flashbacks', label: 'Unwanted memories or flashbacks of traumatic events' },
        { id: 'hypervigilance', label: 'Feeling constantly on guard or easily startled' },
        { id: 'avoidance_trauma', label: 'Avoiding reminders of traumatic experiences' },
    ],
};

interface MentalHealthData {
    hasExistingConcerns: boolean;
    symptoms: {
        depression: string[];
        anxiety: string[];
        sleep: string[];
        trauma: string[];
    };
    previousDiagnosis?: string | null;
    additionalInfo?: string | null;
}

interface MentalHealthAssessmentProps {
    onComplete: (data: MentalHealthData) => void;
    onSkip: () => void;
}

export function MentalHealthAssessment({ onComplete, onSkip }: MentalHealthAssessmentProps) {
    const [hasExistingConcerns, setHasExistingConcerns] = useState<boolean | null>(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState({
        depression: [] as string[],
        anxiety: [] as string[],
        sleep: [] as string[],
        trauma: [] as string[],
    });
    const [previousDiagnosis, setPreviousDiagnosis] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');

    const handleSymptomToggle = (
        category: 'depression' | 'anxiety' | 'sleep' | 'trauma',
        symptomId: string
    ) => {
        setSelectedSymptoms((prev) => ({
            ...prev,
            [category]: prev[category].includes(symptomId)
                ? prev[category].filter((id) => id !== symptomId)
                : [...prev[category], symptomId],
        }));
    };

    const handleSubmit = () => {
        onComplete({
            hasExistingConcerns: hasExistingConcerns || false,
            symptoms: selectedSymptoms,
            previousDiagnosis: previousDiagnosis.trim() || null,
            additionalInfo: additionalInfo.trim() || null,
        });
    };

    const getTotalSymptoms = () => {
        return Object.values(selectedSymptoms).reduce((sum, arr) => sum + arr.length, 0);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-3xl shadow-xl border-slate-200 animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <Brain className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                        Mental Health Assessment
                    </CardTitle>
                    <CardDescription className="text-slate-600 max-w-xl mx-auto">
                        This helps us provide personalized support tailored to your needs. Your information is
                        completely private and secure.
                    </CardDescription>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-100 rounded-lg p-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>This is optional. You can skip this step if you prefer.</span>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Step 1: Do you have concerns? */}
                    <div className="space-y-3">
                        <label className="block font-medium text-slate-700">
                            Are you currently experiencing any mental health concerns?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                onClick={() => setHasExistingConcerns(true)}
                                variant={hasExistingConcerns === true ? 'default' : 'outline'}
                                className={`h-12 ${hasExistingConcerns === true
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'hover:border-blue-400'
                                    }`}
                            >
                                Yes, I am
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setHasExistingConcerns(false)}
                                variant={hasExistingConcerns === false ? 'default' : 'outline'}
                                className={`h-12 ${hasExistingConcerns === false
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'hover:border-green-400'
                                    }`}
                            >
                                No, I'm not
                            </Button>
                        </div>
                    </div>

                    {/* Step 2: If yes, show symptom checklist */}
                    {hasExistingConcerns === true && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <p className="text-sm text-slate-500 italic">Select any symptoms that apply to you:</p>

                            {/* Depression Symptoms */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Heart className="w-5 h-5 text-pink-600" />
                                    <h3 className="font-semibold">Depression-Related Symptoms</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-7">
                                    {SYMPTOM_OPTIONS.depression.map((symptom) => {
                                        const isSelected = selectedSymptoms.depression.includes(symptom.id);
                                        return (
                                            <button
                                                key={symptom.id}
                                                type="button"
                                                onClick={() => handleSymptomToggle('depression', symptom.id)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-pink-100 text-pink-800 border-2 border-pink-400 shadow-sm'
                                                        : 'bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200'
                                                    }`}
                                            >
                                                {symptom.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Anxiety Symptoms */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Zap className="w-5 h-5 text-yellow-600" />
                                    <h3 className="font-semibold">Anxiety-Related Symptoms</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-7">
                                    {SYMPTOM_OPTIONS.anxiety.map((symptom) => {
                                        const isSelected = selectedSymptoms.anxiety.includes(symptom.id);
                                        return (
                                            <button
                                                key={symptom.id}
                                                type="button"
                                                onClick={() => handleSymptomToggle('anxiety', symptom.id)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400 shadow-sm'
                                                        : 'bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200'
                                                    }`}
                                            >
                                                {symptom.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sleep Issues */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Moon className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-semibold">Sleep-Related Issues</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-7">
                                    {SYMPTOM_OPTIONS.sleep.map((symptom) => {
                                        const isSelected = selectedSymptoms.sleep.includes(symptom.id);
                                        return (
                                            <button
                                                key={symptom.id}
                                                type="button"
                                                onClick={() => handleSymptomToggle('sleep', symptom.id)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-400 shadow-sm'
                                                        : 'bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200'
                                                    }`}
                                            >
                                                {symptom.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Trauma/PTSD Symptoms */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <h3 className="font-semibold">Trauma-Related Symptoms</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-7">
                                    {SYMPTOM_OPTIONS.trauma.map((symptom) => {
                                        const isSelected = selectedSymptoms.trauma.includes(symptom.id);
                                        return (
                                            <button
                                                key={symptom.id}
                                                type="button"
                                                onClick={() => handleSymptomToggle('trauma', symptom.id)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-red-100 text-red-800 border-2 border-red-400 shadow-sm'
                                                        : 'bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200'
                                                    }`}
                                            >
                                                {symptom.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary */}
                            {getTotalSymptoms() > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>{getTotalSymptoms()}</strong> symptom{getTotalSymptoms() !== 1 && 's'}{' '}
                                        selected. This will help us provide better support.
                                    </p>
                                </div>
                            )}

                            {/* Previous Diagnosis */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Have you been diagnosed with any mental health condition? (Optional)
                                </label>
                                <Textarea
                                    value={previousDiagnosis}
                                    onChange={(e) => setPreviousDiagnosis(e.target.value)}
                                    placeholder="e.g., Depression, Generalized Anxiety Disorder, PTSD..."
                                    className="min-h-[80px]"
                                />
                                <p className="text-xs text-slate-500">
                                    This helps us understand your background, but it's completely optional.
                                </p>
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Anything else you'd like us to know? (Optional)
                                </label>
                                <Textarea
                                    value={additionalInfo}
                                    onChange={(e) => setAdditionalInfo(e.target.value)}
                                    placeholder="Any other information that might help us support you better..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            onClick={onSkip}
                            variant="ghost"
                            className="flex-1 order-2 sm:order-1"
                        >
                            Skip for now
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={hasExistingConcerns === null}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 order-1 sm:order-2"
                        >
                            Continue
                        </Button>
                    </div>

                    {/* Privacy Notice */}
                    <div className="text-center">
                        <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                            <span>🔒</span>
                            Your data is encrypted and never shared with third parties
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
