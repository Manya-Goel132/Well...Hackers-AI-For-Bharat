/**
 * Clinical AI Service - Frontend
 * 
 * Handles Pro Mode interactions with the backend
 */



export interface ClinicalMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ClinicalAIResponse {
    message: string;
    mode: 'pro';
    timestamp: string;
    error?: boolean;
}

/**
 * Get Clinical AI response from backend
 */
export async function getClinicalResponse(
    userMessage: string,
    userId: string,
    conversationHistory: ClinicalMessage[] = [],
    contextOptions: any = {}
): Promise<string> {
    try {
        const payload = {
            userMessage,
            userId,
            conversationHistory: conversationHistory.slice(-5),
            contextOptions
        };

        const response = await fetch('https://6gcmnzrb72.execute-api.us-east-1.amazonaws.com/chat/clinical', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`AWS API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error('Clinical AI service error');
        }

        return data.message || data.response;
    } catch (error) {
        console.error('Clinical AI error:', error);

        // Return safe fallback
        return `I apologize, but I'm having technical difficulties right now. 

For immediate support:
📞 **Tele-MANAS (24/7):** 14416
📞 **AASRA (24/7):** 9820466726

You can also switch to Standard Mode for general emotional support while we resolve this issue.`;
    }
}

/**
 * Check if user has Pro mode access
 */
export async function hasProModeAccess(userProfile: any): Promise<boolean> {
    return userProfile?.consents?.proModeAccess === true;
}

/**
 * PHQ-9 Questions for frontend presentation
 */
export const PHQ9_QUESTIONS = [
    'Little interest or pleasure in doing things?',
    'Feeling down, depressed, or hopeless?',
    'Trouble falling or staying asleep, or sleeping too much?',
    'Feeling tired or having little energy?',
    'Poor appetite or overeating?',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down?',
    'Trouble concentrating on things, such as reading the newspaper or watching television?',
    'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
    'Thoughts that you would be better off dead, or of hurting yourself in some way?'
];

/**
 * GAD-7 Questions for frontend presentation
 */
export const GAD7_QUESTIONS = [
    'Feeling nervous, anxious, or on edge?',
    'Not being able to stop or control worrying?',
    'Worrying too much about different things?',
    'Trouble relaxing?',
    'Being so restless that it is hard to sit still?',
    'Becoming easily annoyed or irritable?',
    'Feeling afraid, as if something awful might happen?'
];

export const clinicalAIServiceFrontend = {
    getClinicalResponse,
    hasProModeAccess,
    PHQ9_QUESTIONS,
    GAD7_QUESTIONS
};
