/**
 * Example: Panic Button UI Component Integration
 * 
 * This file shows how to integrate the Panic Button Protocol
 * into the existing Chat.tsx component.
 * 
 * Place this code in src/components/PanicButton.tsx
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertTriangle, Heart, Wind, CheckCircle } from 'lucide-react';
import { MentalHealthBot, BotResponse } from '../../functions/src/mentalHealthBot';
import { PanicProtocolService, PanicProtocolStep } from '../../functions/src/panicProtocolService';

interface PanicButtonProps {
    userId: string;
    onComplete?: () => void;
}

export function PanicButton({ userId, onComplete }: PanicButtonProps) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [protocol, setProtocol] = useState<PanicProtocolStep[]>([]);
    const [awaitingTriageResponse, setAwaitingTriageResponse] = useState(false);

    /**
     * Trigger the panic protocol
     */
    const handlePanicClick = async () => {
        console.log('🚨 Panic button activated');

        // Get the full protocol
        const panicProtocol = PanicProtocolService.triggerPanicProtocol();
        setProtocol(panicProtocol.protocol);
        setCurrentStep(0);
        setIsActive(true);
    };

    /**
     * Handle medical triage response (Yes/No to chest pain question)
     */
    const handleTriageResponse = async (response: 'yes' | 'no') => {
        const result = PanicProtocolService.processMedicalTriageResponse(response);

        if (result.isEmergency) {
            // Show emergency exit message
            alert(result.message);
            // Could also open emergency services modal
            setIsActive(false);
            return;
        }

        // Safe to continue - go to next step (grounding)
        setAwaitingTriageResponse(false);
        nextStep();
    };

    /**
     * Move to next step in protocol
     */
    const nextStep = () => {
        if (currentStep < protocol.length - 1) {
            setCurrentStep(currentStep + 1);

            // Check if next step is medical triage
            if (protocol[currentStep + 1].isCriticalSafety) {
                setAwaitingTriageResponse(true);
            }
        } else {
            // Protocol complete
            setIsActive(false);
            if (onComplete) onComplete();
        }
    };

    /**
     * Get icon for current step
     */
    const getStepIcon = (stepName: string) => {
        switch (stepName) {
            case 'De-escalation':
                return <Heart className="w-6 h-6 text-red-500" />;
            case 'Breathing Intervention':
                return <Wind className="w-6 h-6 text-blue-500" />;
            case 'Medical Triage':
                return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
            case 'Grounding':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            default:
                return <Heart className="w-6 h-6 text-purple-500" />;
        }
    };

    if (!isActive) {
        return (
            <Button
                onClick={handlePanicClick}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
            >
                🚨 I Need Help Now
            </Button>
        );
    }

    const currentProtocolStep = protocol[currentStep];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white p-6">
                {/* Progress indicator */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">
                            Step {currentStep + 1} of {protocol.length}
                        </span>
                        <div className="flex gap-1">
                            {protocol.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${idx <= currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step icon and title */}
                <div className="flex items-center gap-3 mb-4">
                    {getStepIcon(currentProtocolStep.stepName)}
                    <h2 className="text-2xl font-bold text-slate-800">
                        {currentProtocolStep.stepName}
                    </h2>
                </div>

                {/* Step content */}
                <div className="prose prose-sm max-w-none mb-6">
                    <div className="text-slate-700 whitespace-pre-line">
                        {currentProtocolStep.content}
                    </div>
                </div>

                {/* Medical triage buttons (if applicable) */}
                {awaitingTriageResponse && currentProtocolStep.isCriticalSafety && (
                    <div className="flex gap-3 justify-center mb-4">
                        <Button
                            onClick={() => handleTriageResponse('yes')}
                            className="bg-red-500 hover:bg-red-600 text-white px-8"
                        >
                            Yes
                        </Button>
                        <Button
                            onClick={() => handleTriageResponse('no')}
                            className="bg-green-500 hover:bg-green-600 text-white px-8"
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
                            className="bg-[var(--mm-primary)] hover:opacity-90 text-white"
                        >
                            {currentStep < protocol.length - 1 ? 'Continue' : 'Finish'}
                        </Button>
                    </div>
                )}

                {/* Emergency Exit Button */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={() => setIsActive(false)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                    >
                        Exit Protocol
                    </button>
                </div>
            </Card>
        </div>
    );
}

/**
 * Alternative: Inline Integration in Chat.tsx
 * 
 * Add this to your existing Chat component:
 */

/*
// Inside Chat component, add state:
const [showPanicProtocol, setShowPanicProtocol] = useState(false);

// Add button in the header or input area:
<Button
    onClick={() => setShowPanicProtocol(true)}
    className="bg-red-500 hover:bg-red-600 text-white"
    size="sm"
>
    🚨 Panic Button
</Button>

// Render the panic button component when active:
{showPanicProtocol && (
    <PanicButton
        userId={currentUser.uid}
        onComplete={() => {
            setShowPanicProtocol(false);
            toast.success('Protocol completed. You did great! 💚');
        }}
    />
)}
*/

/**
 * Example: Automatic Panic Detection in Chat
 * 
 * Add this to the handleSend function in Chat.tsx:
 */

/*
const handleSend = async () => {
    if (!currentUser || !inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();

    // STEP 1: Check for panic keywords BEFORE sending to AI
    const panicKeywords = [
        'panic', 'attack', "can't breathe", 'heart racing',
        'dying', 'emergency', 'help me', 'terrified'
    ];

    const hasPanicKeyword = panicKeywords.some(keyword =>
        userText.toLowerCase().includes(keyword)
    );

    if (hasPanicKeyword) {
        // Ask if they want to activate panic protocol
        const activatePanic = confirm(
            "It sounds like you might be experiencing a panic attack. " +
            "Would you like me to guide you through our emergency panic protocol?"
        );

        if (activatePanic) {
            setShowPanicProtocol(true);
            setInputMessage('');
            return;
        }
    }

    // STEP 2: Continue with normal chat flow
    // ... existing code
};
*/

/**
 * Firebase Cloud Function Integration
 * 
 * Call the panic protocol from a cloud function:
 */

/*
import { httpsCallable } from '../../services/awsShim';
import { functions } from '../services/awsService';

const handlePanicClick = async () => {
    const handlePanic = httpsCallable(functions, 'handlePanicProtocol');
    
    const result = await handlePanic({
        userId: currentUser.uid,
        message: "I'm having a panic attack"
    });

    if (result.data.type === 'panic_protocol') {
        // Display protocol steps
        setProtocol(result.data.metadata.protocol);
        setIsActive(true);
    }
};
*/

export default PanicButton;
