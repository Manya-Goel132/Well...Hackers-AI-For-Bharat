/**
 * Panic Button Protocol Service
 * 
 * Implements the emergency panic protocol as specified:
 * 1. De-escalation script
 * 2. Breathing intervention (Quick Release: 4s in, 4s hold, 4s out)
 * 3. Medical triage (chest pain safety question)
 * 4. Grounding technique (5-4-3-2-1)
 * 5. Redirect to Applied Relaxation module
 * 
 * Safety: Medical triage logic is deterministic (hardcoded If/Else), never LLM-generated
 * Tone: Indian English style (warm, respectful, non-clinical)
 */

export interface PanicProtocolStep {
    stepNumber: number;
    stepName: string;
    content: string;
    requiresUserInput?: boolean;
    expectedResponses?: string[];
    isCriticalSafety?: boolean;
    nextModule?: string;
}

export interface PanicProtocolResult {
    protocol: PanicProtocolStep[];
    currentStep: number;
    emergencyExit: boolean;
    nextModule?: string;
}

export class PanicProtocolService {
    /**
     * Initiates the full panic protocol sequence
     * Returns all steps that need to be executed
     */
    public static triggerPanicProtocol(): PanicProtocolResult {
        const protocolSteps: PanicProtocolStep[] = [
            // Step 1: Immediate De-escalation
            {
                stepNumber: 1,
                stepName: "De-escalation",
                content: this.getDeEscalationScript(),
                requiresUserInput: false
            },

            // Step 2: Breathing Exercise
            {
                stepNumber: 2,
                stepName: "Breathing Intervention",
                content: this.getBreathingExerciseScript(),
                requiresUserInput: false
            },

            // Step 3: Medical Triage (Critical Safety Question)
            {
                stepNumber: 3,
                stepName: "Medical Triage",
                content: this.getMedicalTriageQuestion(),
                requiresUserInput: true,
                expectedResponses: ["yes", "no"],
                isCriticalSafety: true
            },

            // Step 4: Grounding (5-4-3-2-1 Technique) - Only if no emergency
            {
                stepNumber: 4,
                stepName: "Grounding",
                content: this.getGroundingTechniqueScript(),
                requiresUserInput: false
            },

            // Step 5: Post-Panic Redirect
            {
                stepNumber: 5,
                stepName: "Post-Panic Redirect",
                content: this.getRedirectToAppliedRelaxation(),
                requiresUserInput: false,
                nextModule: "Applied Relaxation"
            }
        ];

        return {
            protocol: protocolSteps,
            currentStep: 1,
            emergencyExit: false
        };
    }

    /**
     * Step 1: De-escalation Script
     * Source: Therapy_Modules_Chatbot_Scripts.pdf - "User is experiencing a panic attack"
     */
    private static getDeEscalationScript(): string {
        return `**I'm here with you. You're not alone.**

I can sense you're feeling very anxious right now. What you're experiencing is a panic attack, and I want you to know that **it will pass**. Your body is responding to stress, but you are safe.

Let's take this moment to moment together. I'm going to guide you through this.`;
    }

    /**
     * Step 2: Breathing Exercise - "Quick Release" Technique
     * Source: Therapy_Modules_Chatbot_Scripts.pdf - Applied Relaxation Module
     * Pattern: 4 seconds in, 4 seconds hold, 4 seconds out
     */
    private static getBreathingExerciseScript(): string {
        return `**Let's start with your breath**

I'm going to guide you through a simple breathing cycle. This will help calm your nervous system.

**Quick Release Breathing:**

1. **Breathe IN slowly** through your nose for 4 seconds (1... 2... 3... 4...)
2. **HOLD** your breath gently for 4 seconds (1... 2... 3... 4...)
3. **Breathe OUT slowly** through your mouth for 4 seconds (1... 2... 3... 4...)

Let's do this **3 times together**:

*Cycle 1:* IN (4s)... HOLD (4s)... OUT (4s)...
*Cycle 2:* IN (4s)... HOLD (4s)... OUT (4s)...
*Cycle 3:* IN (4s)... HOLD (4s)... OUT (4s)...

**Well done.** Take a moment to notice how you feel.`;
    }

    /**
     * Step 3: Medical Triage Question (CRITICAL SAFETY)
     * Source: Clinical_Decision_Support_System.pdf - "Emergency/Red Flag"
     * 
     * This is HARDCODED and DETERMINISTIC - NEVER use LLM for this decision
     */
    private static getMedicalTriageQuestion(): string {
        return `**Before we continue, I need to ask you one important question for your safety:**

**Are you experiencing chest pain that's spreading to your left arm?**

Please answer: **Yes** or **No**`;
    }

    /**
     * Processes the medical triage response
     * Returns true if emergency services needed, false otherwise
     * 
     * CRITICAL: This logic is HARDCODED per Clinical Decision Support System
     */
    public static processMedicalTriageResponse(userResponse: string): {
        isEmergency: boolean;
        message: string;
    } {
        const normalized = userResponse.toLowerCase().trim();

        // Check for affirmative responses
        const affirmativePatterns = [
            'yes', 'yeah', 'yea', 'haan', 'ha', 'हाँ', 'yes i am',
            'yes i do', 'i am', 'i do', 'chest pain', 'left arm'
        ];

        const isAffirmative = affirmativePatterns.some(pattern =>
            normalized.includes(pattern)
        );

        if (isAffirmative) {
            // EMERGENCY EXIT
            return {
                isEmergency: true,
                message: this.getEmergencyExitMessage()
            };
        } else {
            // Safe to proceed with grounding
            return {
                isEmergency: false,
                message: "Thank you for letting me know. Let's continue with a grounding exercise to help you feel more present and calm."
            };
        }
    }

    /**
     * Emergency Exit Message
     * Source: Clinical Decision Support System - Red Flag Protocol
     */
    private static getEmergencyExitMessage(): string {
        return `**🚨 URGENT: Please call emergency services immediately**

Based on your symptoms, this could be a medical emergency that needs immediate attention.

**In India, please call:**
- 📞 **Ambulance: 102 or 108** (National Ambulance Service)
- 📞 **Emergency: 112** (All-in-one emergency number)

**What to do right now:**
1. If you're alone, try to get help from someone nearby
2. Sit down and stay calm while waiting for help
3. Keep your phone with you

**This is not a panic attack - please seek medical help immediately.**

You can also go to the nearest hospital emergency room.

**Stay safe. Medical help is on the way when you call.**`;
    }

    /**
     * Step 4: Grounding - 5-4-3-2-1 Technique
     * Source: Therapy_Modules_Chatbot_Scripts.pdf - Exposure Therapy Module
     */
    private static getGroundingTechniqueScript(): string {
        return `**Let's ground you in the present moment**

The panic you're feeling is in your mind, but your body is here, safe. Let's connect with your surroundings using the **5-4-3-2-1 Technique**:

**Look around and name:**

🔹 **5 things you can SEE** around you
   *(Example: a chair, a window, your phone, a cup, a picture)*

🔹 **4 things you can TOUCH or FEEL**
   *(Example: the floor under your feet, your clothes, a table, the air)*

🔹 **3 things you can HEAR**
   *(Example: distant traffic, a fan, birds, your breathing)*

🔹 **2 things you can SMELL**
   *(Example: fresh air, soap, food cooking)*

🔹 **1 thing you can TASTE**
   *(Example: the inside of your mouth, water, mint)*

Take your time with each sense. **You are here. You are safe. The panic is passing.**`;
    }

    /**
     * Step 5: Redirect to Applied Relaxation Module
     * Post-panic recovery pathway
     */
    private static getRedirectToAppliedRelaxation(): string {
        return `**You did really well** 🌿

The panic attack is subsiding now. Your body is returning to balance.

**What happens next?**

I'd like to help you build **long-term resilience** against panic attacks. The best way to do this is through a technique called **Applied Relaxation**.

**Applied Relaxation** teaches your body to:
- Recognize early signs of anxiety
- Release tension before it builds into panic
- Stay calm even in stressful situations

**Would you like me to guide you through the Applied Relaxation module?**

It takes about 15-20 minutes, and it's one of the most effective ways to prevent future panic attacks.

You can start now, or bookmark it for later when you're feeling more settled.`;
    }

    /**
     * Get the Applied Relaxation module details
     * Source: Therapy_Modules_Chatbot_Scripts.pdf
     */
    public static getAppliedRelaxationModule(): string {
        return `# Applied Relaxation Module

**Target Condition:** Panic Disorder, Generalized Anxiety Disorder
**Difficulty Level:** Beginner
**Duration:** 15-20 minutes daily practice
**Clinical Rationale:** Based on Progressive Muscle Relaxation with faster application

## What is Applied Relaxation?

Applied Relaxation is a technique that helps you quickly calm your body's stress response. Unlike traditional relaxation (which can take 20+ minutes), this method trains you to relax your muscles in just 20-30 seconds.

## The 4 Steps:

### Step 1: Release-Only Relaxation (Week 1)
- Focus on releasing muscle tension WITHOUT tensing first
- Start with your forehead, work down to your toes
- Practice 2 times daily for 10-15 minutes

### Step 2: Cue-Controlled Relaxation (Week 2)
- Pair relaxation with a cue word like "calm" or "relax"
- Breathe slowly and say your cue word silently
- Practice linking the word to the feeling of relaxation

### Step 3: Rapid Relaxation (Week 3)
- Practice relaxing in everyday situations (sitting, walking, working)
- Use your cue word to trigger relaxation
- Reduce practice time to 20-30 seconds

### Step 4: Applied Relaxation (Week 4+)
- Use the technique in real anxiety-provoking situations
- Notice early signs of tension and apply rapid relaxation
- This becomes your automatic response to stress

## How to Practice:

**Daily Practice (15 minutes):**
1. Sit comfortably in a quiet space
2. Close your eyes and scan your body for tension
3. Starting from your forehead, consciously release each muscle group
4. Breathe slowly and repeat your cue word ("calm")
5. Work through: forehead → eyes → jaw → neck → shoulders → arms → chest → stomach → legs → feet

**Emergency Use (30 seconds):**
1. Notice anxiety rising
2. Say your cue word
3. Take 2-3 slow breaths
4. Release all muscle tension
5. Return to your activity

## Practice Reminder:
This technique gets **much more effective** with daily practice. After 4 weeks, most people can relax their entire body in under 30 seconds.

**Contraindications:** None - safe for everyone

**Tip:** Practice when you're NOT anxious first. Build the skill in calm moments, then use it during stress.`;
    }

    /**
     * Telemedicine Disclaimer
     * Must be shown at the start of any new session
     */
    public static getTelemedicineDisclaimer(): string {
        return `**📋 Important Notice - Telemedicine Services**

ManoSathi provides **mental health support and information**, but we are **not a substitute for professional medical care**.

**Please note:**
- This is an AI-powered companion for emotional support and self-help guidance
- We do not provide medical diagnosis or treatment
- In case of emergency or severe symptoms, please contact emergency services or visit a healthcare facility
- For persistent mental health concerns, please consult a licensed psychiatrist or psychologist

**Emergency Contacts (India):**
- 📞 Ambulance: 102 / 108
- 📞 Mental Health Helpline: 08046110007 (NIMHANS)
- 📞 Suicide Prevention: 9152987821 (iCall)

By continuing, you acknowledge that you understand these limitations.

---`;
    }
}

export default PanicProtocolService;
