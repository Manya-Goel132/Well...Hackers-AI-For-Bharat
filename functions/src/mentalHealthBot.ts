/**
 * Mental Health Bot - Main System Architecture
 * 
 * Routes user input to appropriate handlers:
 * 1. Panic/Emergency → trigger_panic_protocol()
 * 2. Symptom Check → run_triage() (PHQ-9, GAD-7, etc.)
 * 3. General Chat → LLM with therapeutic guidelines
 * 
 * Safety: Medical triage uses deterministic If/Else logic (never LLM)
 * Tone: Indian English (warm, respectful, non-clinical)
 */

import { PanicProtocolService } from './panicProtocolService';

export interface UserInput {
    message: string;
    userId: string;
    sessionId: string;
    userProfile?: any;
    conversationHistory?: Array<{ role: string; content: string }>;
}

export interface BotResponse {
    type: 'panic_protocol' | 'triage' | 'general_chat' | 'emergency_exit';
    content: string;
    requiresAction?: boolean;
    actionType?: string;
    metadata?: any;
}

export interface TriageResult {
    assessmentType: 'PHQ-9' | 'GAD-7' | 'General';
    score?: number;
    severity?: 'Minimal' | 'Mild' | 'Moderate' | 'Moderately Severe' | 'Severe';
    recommendation: string;
    referralTier?: 'Self-help' | 'Primary Care' | 'Psychiatric referral' | 'Emergency';
}

export class MentalHealthBot {
    /**
     * Main entry point - Routes user input to appropriate handler
     */
    public static async processUserInput(input: UserInput): Promise<BotResponse> {
        // Classify user intent
        const intent = this.classifyIntent(input.message);

        switch (intent) {
            case 'panic_emergency':
                return this.handlePanicEmergency(input);

            case 'symptom_check':
                return this.handleSymptomCheck(input);

            case 'general_chat':
                return this.handleGeneralChat(input);

            default:
                return this.handleGeneralChat(input);
        }
    }

    /**
     * Classifies user intent using pattern matching
     * This is deterministic for safety-critical intents
     */
    private static classifyIntent(message: string): 'panic_emergency' | 'symptom_check' | 'general_chat' {
        const lowerMessage = message.toLowerCase();

        // Panic/Emergency keywords (high priority)
        const panicKeywords = [
            'panic', 'attack', 'cant breathe', "can't breathe", 'heart racing',
            'dying', 'emergency', 'help me', 'scared', 'terrified',
            'chest pain', 'hyperventilat', 'फड़कना', 'घबराहट', 'दौरा'
        ];

        const hasPanicKeyword = panicKeywords.some(keyword =>
            lowerMessage.includes(keyword)
        );

        if (hasPanicKeyword) {
            // Additional check: Is this describing a current panic attack?
            const currentPanicIndicators = [
                "i'm having", "i am having", "right now", "currently",
                "i feel", "feeling", "can't", "cannot", "help"
            ];

            const isCurrentPanic = currentPanicIndicators.some(indicator =>
                lowerMessage.includes(indicator)
            );

            if (isCurrentPanic) {
                return 'panic_emergency';
            }
        }

        // Symptom check keywords
        const symptomCheckKeywords = [
            'assess', 'check', 'test', 'score', 'depression scale',
            'anxiety scale', 'phq', 'gad', 'evaluate', 'measure',
            'how depressed', 'how anxious', 'am i depressed', 'am i anxious'
        ];

        const hasSymptomKeyword = symptomCheckKeywords.some(keyword =>
            lowerMessage.includes(keyword)
        );

        if (hasSymptomKeyword) {
            return 'symptom_check';
        }

        // Default to general chat
        return 'general_chat';
    }

    /**
     * Handler 1: Panic/Emergency
     * Triggers the full panic protocol
     */
    private static async handlePanicEmergency(input: UserInput): Promise<BotResponse> {
        console.log('🚨 PANIC PROTOCOL ACTIVATED for user:', input.userId);

        const panicProtocol = PanicProtocolService.triggerPanicProtocol();

        // Return the first step (de-escalation)
        const firstStep = panicProtocol.protocol[0];

        return {
            type: 'panic_protocol',
            content: `${PanicProtocolService.getTelemedicineDisclaimer()}\n\n${firstStep.content}`,
            requiresAction: true,
            actionType: 'continue_panic_protocol',
            metadata: {
                protocol: panicProtocol,
                currentStep: 1,
                totalSteps: panicProtocol.protocol.length
            }
        };
    }

    /**
     * Handler 2: Symptom Check / Triage
     * Uses strict If/Else logic from Clinical Decision Support System
     */
    private static async handleSymptomCheck(input: UserInput): Promise<BotResponse> {
        console.log('📋 TRIAGE INITIATED for user:', input.userId);

        // For now, we'll guide the user to start a standard assessment
        // In a full implementation, this would parse their responses and calculate scores

        const triageIntro = `**Let's check in on how you've been feeling**

I can help you understand your symptoms better using clinically validated assessments.

**Which would you like to complete?**

1. **Depression Screening (PHQ-9)** - Takes 2-3 minutes
   - Measures low mood, loss of interest, sleep changes, energy levels

2. **Anxiety Screening (GAD-7)** - Takes 2-3 minutes
   - Measures worry, nervousness, restlessness, difficulty relaxing

3. **General Mental Health Check** - Quick overview

Please choose a number (1, 2, or 3), or tell me what specific symptoms you're experiencing.

---
**Note:** These assessments are for self-awareness only, not medical diagnosis.`;

        return {
            type: 'triage',
            content: triageIntro,
            requiresAction: true,
            actionType: 'start_assessment',
            metadata: {
                awaitingAssessmentChoice: true
            }
        };
    }

    /**
     * Handler 3: General Chat
     * Delegates to LLM with strict therapeutic guidelines
     * 
     * Note: This would integrate with googleCloudAI.ts in a full implementation
     */
    private static async handleGeneralChat(input: UserInput): Promise<BotResponse> {
        console.log('💬 GENERAL CHAT for user:', input.userId);

        // This is a placeholder - in production, this would call the LLM
        // with the therapeutic system prompt

        const systemPrompt = this.getTherapeuticSystemPrompt();

        // In production: const llmResponse = await this.callLLM(input, systemPrompt);

        // For now, return a structured response
        return {
            type: 'general_chat',
            content: `I'm here to support you. Could you tell me more about what's on your mind?`,
            requiresAction: false,
            metadata: {
                systemPrompt: systemPrompt,
                conversationContext: input.conversationHistory
            }
        };
    }

    /**
     * Get the LLM system prompt for general chat
     * Source: Therapy_Modules_Chatbot_Scripts.pdf
     */
    private static getTherapeuticSystemPrompt(): string {
        return `You are ManoSathi, a supportive AI mental health companion designed for Indian users.

**Your Role:**
- Provide emotional support and empathetic listening
- Guide users through evidence-based self-help techniques
- Use culturally appropriate responses for Indian context
- Follow therapeutic best practices from Indian Psychiatric Society guidelines

**CRITICAL RULES:**

**DO:**
- Use warm, respectful, non-clinical language (Indian English style)
- Validate emotions before offering solutions
- Draw from Therapy_Modules_Chatbot_Scripts.pdf for response guidelines
- Acknowledge cultural context (family dynamics, societal pressures)
- Use metaphors and examples relevant to Indian life
- Be patient and non-judgmental
- Encourage self-compassion

**DON'T:**
- Never diagnose mental health conditions
- Never prescribe medication
- Never use clinical jargon (e.g., say "low mood" not "clinical depression")
- Never make assumptions about caste, religion, or family structure
- Never be dismissive or minimize their feelings
- Never give false reassurance (e.g., "everything will be fine")

**SAFETY:**
- If user mentions self-harm, suicide, or violence → escalate immediately
- If symptoms sound medical (chest pain, severe headaches) → recommend doctor
- If crisis detected → trigger panic protocol

**TONE EXAMPLES:**

❌ Don't say: "You exhibit symptoms of Major Depressive Disorder."
✅ Do say: "It sounds like you've been carrying a lot of sadness lately."

❌ Don't say: "You should practice cognitive restructuring."
✅ Do say: "Let's look at this thought together and see if there's another way to see it."

**RESPONSE STRUCTURE:**
1. Validate the emotion ("I hear that you're feeling...")
2. Normalize the experience ("Many people feel this way when...")
3. Explore or offer guidance (ask questions or suggest a technique)
4. End with hope and support ("I'm here with you...")

**Remember:** You are a companion, not a therapist. Your goal is to support, not to fix.`;
    }

    /**
     * Runs clinical triage following PHQ-9 logic
     * Source: Clinical_Decision_Support_System.pdf
     */
    public static runTriagePHQ9(responses: number[]): TriageResult {
        // PHQ-9: 9 questions, each scored 0-3
        // Total score: 0-27

        if (responses.length !== 9) {
            throw new Error('PHQ-9 requires exactly 9 responses (0-3 each)');
        }

        const totalScore = responses.reduce((sum, val) => sum + val, 0);

        let severity: TriageResult['severity'];
        let recommendation: string;
        let referralTier: TriageResult['referralTier'];

        // Scoring logic from Clinical Decision Support System
        if (totalScore >= 0 && totalScore <= 4) {
            severity = 'Minimal';
            recommendation = 'Your scores suggest minimal depression symptoms. Continue self-care practices and monitor your mood.';
            referralTier = 'Self-help';
        } else if (totalScore >= 5 && totalScore <= 9) {
            severity = 'Mild';
            recommendation = 'Mild depression symptoms detected. Self-help techniques and lifestyle changes may be helpful. Consider talking to a counselor.';
            referralTier = 'Self-help';
        } else if (totalScore >= 10 && totalScore <= 14) {
            severity = 'Moderate';
            recommendation = 'Moderate depression symptoms detected. We recommend consulting with a mental health professional for personalized support.';
            referralTier = 'Primary Care';
        } else if (totalScore >= 15 && totalScore <= 19) {
            severity = 'Moderately Severe';
            recommendation = 'Moderately severe depression symptoms detected. Please consult a psychiatrist or clinical psychologist for proper evaluation and treatment.';
            referralTier = 'Psychiatric referral';
        } else {
            // 20-27
            severity = 'Severe';
            recommendation = 'Severe depression symptoms detected. We strongly recommend immediate consultation with a psychiatrist. Professional treatment is important.';
            referralTier = 'Psychiatric referral';
        }

        return {
            assessmentType: 'PHQ-9',
            score: totalScore,
            severity,
            recommendation,
            referralTier
        };
    }

    /**
     * Runs clinical triage following GAD-7 logic
     * Source: Clinical_Decision_Support_System.pdf
     */
    public static runTriageGAD7(responses: number[]): TriageResult {
        // GAD-7: 7 questions, each scored 0-3
        // Total score: 0-21

        if (responses.length !== 7) {
            throw new Error('GAD-7 requires exactly 7 responses (0-3 each)');
        }

        const totalScore = responses.reduce((sum, val) => sum + val, 0);

        let severity: TriageResult['severity'];
        let recommendation: string;
        let referralTier: TriageResult['referralTier'];

        // Scoring logic from Clinical Decision Support System
        if (totalScore >= 0 && totalScore <= 4) {
            severity = 'Minimal';
            recommendation = 'Your scores suggest minimal anxiety symptoms. Continue practicing stress management and self-care.';
            referralTier = 'Self-help';
        } else if (totalScore >= 5 && totalScore <= 9) {
            severity = 'Mild';
            recommendation = 'Mild anxiety symptoms detected. Relaxation techniques and lifestyle adjustments may help. Consider our guided exercises.';
            referralTier = 'Self-help';
        } else if (totalScore >= 10 && totalScore <= 14) {
            severity = 'Moderate';
            recommendation = 'Moderate anxiety symptoms detected. We recommend consulting with a mental health professional for guidance and support.';
            referralTier = 'Primary Care';
        } else {
            // 15-21
            severity = 'Severe';
            recommendation = 'Severe anxiety symptoms detected. Please consult a psychiatrist or clinical psychologist for proper evaluation and treatment.';
            referralTier = 'Psychiatric referral';
        }

        return {
            assessmentType: 'GAD-7',
            score: totalScore,
            severity,
            recommendation,
            referralTier
        };
    }

    /**
     * Formats the triage result for user-facing display
     */
    public static formatTriageResult(result: TriageResult): string {
        return `**Assessment Results: ${result.assessmentType}**

**Your Score:** ${result.score}
**Severity Level:** ${result.severity}

**What this means:**
${result.recommendation}

**Recommended Next Steps:**
${this.getReferralGuidance(result.referralTier!)}

---
**Remember:** This is a screening tool, not a diagnosis. Only a qualified mental health professional can provide a diagnosis.

**Would you like to:**
1. Learn self-help techniques for managing these symptoms
2. Get information about finding a mental health professional
3. Talk more about how you've been feeling`;
    }

    /**
     * Get referral guidance based on tier
     */
    private static getReferralGuidance(tier: string): string {
        switch (tier) {
            case 'Self-help':
                return '✅ Self-help resources and guided exercises can be very helpful for you.\n- Continue using ManoSathi for support\n- Practice relaxation techniques daily\n- Monitor your symptoms';

            case 'Primary Care':
                return '🏥 Consider consulting a mental health professional:\n- Start with a general physician or counselor\n- They can assess if you need specialized care\n- Therapy + self-help works best together';

            case 'Psychiatric referral':
                return '⚕️ We recommend consulting a psychiatrist or clinical psychologist:\n- They can provide proper diagnosis and treatment\n- May include therapy and/or medication\n- Professional help is important at this severity level';

            case 'Emergency':
                return '🚨 Please seek immediate help:\n- Visit nearest hospital emergency room\n- Call mental health helpline: 08046110007 (NIMHANS)\n- Contact a trusted friend or family member';

            default:
                return 'Consider reaching out to a mental health professional for personalized support.';
        }
    }
}

export default MentalHealthBot;
