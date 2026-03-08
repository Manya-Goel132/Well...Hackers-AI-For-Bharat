/**
 * Panic Button Component - Integrated Version
 * Emergency panic protocol UI for ManoSathi
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertTriangle, Heart, Wind, CheckCircle, X, AlertCircle, MessageCircle } from 'lucide-react';

interface PanicProtocolStep {
    stepNumber: number;
    stepName: string;
    content: string;
    requiresUserInput?: boolean;
    isCriticalSafety?: boolean;
}

interface PanicButtonProps {
    userId: string;
    onClose?: () => void;
}

export function PanicButton({ userId, onClose }: PanicButtonProps) {
    const [showInitialTriage, setShowInitialTriage] = useState(true);
    const [selectedHelp, setSelectedHelp] = useState<string>('');
    const [currentStep, setCurrentStep] = useState(0);
    const [awaitingTriageResponse, setAwaitingTriageResponse] = useState(false);
    const [showEmergencyExit, setShowEmergencyExit] = useState(false);

    // Protocol steps - hardcoded for frontend (can also call backend)
    const protocol: PanicProtocolStep[] = [
        {
            stepNumber: 1,
            stepName: "You're Safe - I'm Here",
            content: `**I'm here with you. You're not alone.**

I can sense you're feeling very anxious right now. What you're experiencing is a panic attack, and I want you to know that **it will pass**. Your body is responding to stress, but you are safe.

Let's take this moment by moment together. I'm going to guide you through this.`,
            requiresUserInput: false
        },
        {
            stepNumber: 2,
            stepName: "Let's Breathe Together",
            content: `**Let's start with your breath**

I'm going to guide you through a simple breathing cycle. This will help calm your nervous system.

**Quick Release Breathing:**

1. **Breathe IN slowly** through your nose for 4 seconds (1... 2... 3... 4...)
2. **HOLD** your breath gently for 4 seconds (1... 2... 3... 4...)
3. **Breathe OUT slowly** through your mouth for 4 seconds (1... 2... 3... 4...)

Let's do this **3 times together**:

🌬️ **Cycle 1:** IN (4s)... HOLD (4s)... OUT (4s)...
🌬️ **Cycle 2:** IN (4s)... HOLD (4s)... OUT (4s)...
🌬️ **Cycle 3:** IN (4s)... HOLD (4s)... OUT (4s)...

**Well done.** Take a moment to notice how you feel.`,
            requiresUserInput: false
        },
        {
            stepNumber: 3,
            stepName: "Safety Check",
            content: `**Before we continue, I need to ask you one important question for your safety:**

**Are you experiencing chest pain that's spreading to your left arm?**

Please answer: **Yes** or **No**`,
            requiresUserInput: true,
            isCriticalSafety: true
        },
        {
            stepNumber: 4,
            stepName: "Grounding Exercise",
            content: `**Let's ground you in the present moment**

The panic you're feeling is in your mind, but your body is here, safe. Let's connect with your surroundings using the **5-4-3-2-1 Technique**:

**Look around and notice:**

👁️ **5 things you can SEE** around you
   *(Example: a chair, a window, your phone, a cup, a picture)*

✋ **4 things you can TOUCH or FEEL**
   *(Example: the floor under your feet, your clothes, a table, the air)*

👂 **3 things you can HEAR**
   *(Example: distant traffic, a fan, birds, your breathing)*

👃 **2 things you can SMELL**
   *(Example: fresh air, soap, food cooking)*

👅 **1 thing you can TASTE**
   *(Example: the inside of your mouth, water, mint)*

Take your time with each sense. **You are here. You are safe. The panic is passing.**`,
            requiresUserInput: false
        },
        {
            stepNumber: 5,
            stepName: "You Did Great",
            content: `**You did really well** 🌿

The panic attack is subsiding now. Your body is returning to balance.

**What happens next?**

I'd like to help you build **long-term resilience** against panic attacks. The best way to do this is through a technique called **Applied Relaxation**.

**Applied Relaxation** teaches your body to:
- Recognize early signs of anxiety
- Release tension before it builds into panic
- Stay calm even in stressful situations

Would you like to continue chatting, or would you like some time to rest?

Remember: **You handled this well, and you're stronger than you know.** 💚`,
            requiresUserInput: false
        }
    ];

    const handleTriageResponse = (response: 'yes' | 'no') => {
        if (response === 'yes') {
            // EMERGENCY EXIT
            setShowEmergencyExit(true);
        } else {
            // Safe to continue
            setAwaitingTriageResponse(false);
            nextStep();
        }
    };

    const nextStep = () => {
        if (currentStep < protocol.length - 1) {
            const nextStepData = protocol[currentStep + 1];
            setCurrentStep(currentStep + 1);

            if (nextStepData.isCriticalSafety) {
                setAwaitingTriageResponse(true);
            }
        } else {
            // Protocol complete
            if (onClose) onClose();
        }
    };

    const getStepIcon = (stepName: string) => {
        if (stepName.includes('Safe') || stepName.includes('Here')) {
            return <Heart className="w-6 h-6 text-red-400" />;
        } else if (stepName.includes('Breathe')) {
            return <Wind className="w-6 h-6 text-blue-400" />;
        } else if (stepName.includes('Safety')) {
            return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
        } else if (stepName.includes('Grounding')) {
            return <CheckCircle className="w-6 h-6 text-green-500" />;
        } else {
            return <Heart className="w-6 h-6 text-purple-400" />;
        }
    };

    // Handle help type selection
    const handleHelpSelection = (helpType: string) => {
        setSelectedHelp(helpType);

        if (helpType === 'emergency') {
            // Skip protocol, go straight to emergency
            setShowEmergencyExit(true);
            setShowInitialTriage(false);
        } else if (helpType === 'panic' || helpType === 'breathing' || helpType === 'anxiety') {
            // Start panic/anxiety protocol
            setShowInitialTriage(false);
        } else if (helpType === 'talk') {
            // For "just need to talk", close modal and suggest using chat
            if (onClose) onClose();
        }
    };

    // Initial Help Selection Screen
    if (showInitialTriage) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white p-6 shadow-2xl">
                    {/* Close Button */}
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <Heart className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                            I'm Here to Help
                        </h2>
                        <p className="text-slate-600">
                            Let me know what you're experiencing, and I'll guide you through it.
                        </p>
                    </div>

                    {/* Help Options */}
                    <div className="space-y-3 mb-6">
                        {/* Option 1: Panic Attack */}
                        <button
                            onClick={() => handleHelpSelection('panic')}
                            className="w-full text-left p-4 border-2 border-slate-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">I'm having a panic attack</h3>
                                    <p className="text-sm text-slate-600">Heart racing, can't breathe, feeling scared</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: Breathing Help */}
                        <button
                            onClick={() => handleHelpSelection('breathing')}
                            className="w-full text-left p-4 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <Wind className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">I need help breathing</h3>
                                    <p className="text-sm text-slate-600">Feeling overwhelmed, need to calm down</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 3: Severe Anxiety */}
                        <button
                            onClick={() => handleHelpSelection('anxiety')}
                            className="w-full text-left p-4 border-2 border-slate-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">I'm very anxious</h3>
                                    <p className="text-sm text-slate-600">Worried, stressed, can't stop thinking</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 4: Emergency (Suicidal/Self-harm) */}
                        <button
                            onClick={() => handleHelpSelection('emergency')}
                            className="w-full text-left p-4 border-2 border-red-300 bg-red-50 rounded-lg hover:border-red-500 hover:bg-red-100 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center group-hover:bg-red-300 transition-colors">
                                    <AlertTriangle className="w-6 h-6 text-red-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-700">I'm thinking of hurting myself</h3>
                                    <p className="text-sm text-red-600">Suicidal thoughts or self-harm urges</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 5: Just Need to Talk */}
                        <button
                            onClick={() => handleHelpSelection('talk')}
                            className="w-full text-left p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                    <MessageCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">I just need someone to talk to</h3>
                                    <p className="text-sm text-slate-600">Feeling low, want support</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Footer Info */}
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                        <p className="mb-2">
                            <strong>Note:</strong> This is not a substitute for professional help.
                        </p>
                        <p>
                            <strong>Emergency:</strong> If this is a medical emergency, call <strong className="text-red-600">102</strong> or <strong className="text-red-600">108</strong> immediately.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    const currentProtocolStep = protocol[currentStep];

    // Emergency Exit Screen
    if (showEmergencyExit) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <Card className="max-w-xl w-full bg-white p-6 shadow-2xl">
                    <div className="text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-600 mb-4">
                            🚨 URGENT: Please Call Emergency Services
                        </h2>
                        <p className="text-slate-700 mb-6">
                            Based on your symptoms, this could be a medical emergency that needs immediate attention.
                        </p>

                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-lg mb-4">In India, please call:</h3>
                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        📞
                                    </div>
                                    <div>
                                        <div className="font-bold text-xl">102 or 108</div>
                                        <div className="text-sm text-slate-600">National Ambulance Service</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        🚨
                                    </div>
                                    <div>
                                        <div className="font-bold text-xl">112</div>
                                        <div className="text-sm text-slate-600">All-in-one Emergency Number</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                            <h4 className="font-semibold mb-2">What to do right now:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                                <li>If you're alone, try to get help from someone nearby</li>
                                <li>Sit down and stay calm while waiting for help</li>
                                <li>Keep your phone with you</li>
                            </ol>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            **This is not a panic attack - please seek medical help immediately.**
                        </p>

                        <Button
                            onClick={() => {
                                setShowEmergencyExit(false);
                                if (onClose) onClose();
                            }}
                            className="bg-slate-600 hover:bg-slate-700 text-white w-full"
                        >
                            I've Called for Help
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Main Protocol Screen
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white p-4 md:p-6 shadow-2xl">
                {/* Close Button */}
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress indicator */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-600">
                            Step {currentStep + 1} of {protocol.length}
                        </span>
                        <div className="flex gap-1">
                            {protocol.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx <= currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step icon and title */}
                <div className="flex items-center gap-3 mb-6">
                    {getStepIcon(currentProtocolStep.stepName)}
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                        {currentProtocolStep.stepName}
                    </h2>
                </div>

                {/* Step content */}
                <div className="prose prose-sm max-w-none mb-6">
                    <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                        {currentProtocolStep.content}
                    </div>
                </div>

                {/* Medical triage buttons (if applicable) */}
                {awaitingTriageResponse && currentProtocolStep.isCriticalSafety && (
                    <div className="flex gap-3 justify-center mb-6">
                        <Button
                            onClick={() => handleTriageResponse('yes')}
                            className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg"
                        >
                            Yes
                        </Button>
                        <Button
                            onClick={() => handleTriageResponse('no')}
                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg"
                        >
                            No
                        </Button>
                    </div>
                )}

                {/* Continue button (for non-triage steps) */}
                {!awaitingTriageResponse && (
                    <div className="flex justify-end">
                        <Button
                            onClick={nextStep}
                            className="bg-[var(--mm-primary)] hover:opacity-90 text-white px-6 py-3"
                        >
                            {currentStep < protocol.length - 1 ? 'Continue →' : 'Finish'}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default PanicButton;
