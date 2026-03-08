

export interface StandardAIContext {
    userProfile: {
        name: string;
        age: number;
        gender: string;
        location: string;
        bio: string;
        preferredLanguage: string;
        culturalBackground: string;
        interests: string[];
        comfortEnvironment: string;
        previousSessions: number;
    };
    currentState: {
        mood: string;
        stressLevel: string;
        energyLevel: string;
        crisisRisk: string;
        emotionalTone: string;
    };
    assessmentScores: {
        phq9: number;
        gad7: number;
        overallWellness: number;
    };
    therapeuticGoals: string[];
    multimodalImage?: string; // Base64 image for AWS Bedrock Multimodal support
}

export interface StandardAIResponse {
    message: string;
    isFallback: boolean;
    timestamp: string;
    confidence?: number;
    emotionalTone?: string; // calming | empathetic | encouraging | urgent
}

/**
 * BULLETPROOF message extractor.
 * No matter what shape the backend returns (nested JSON string, wrapped object, plain string),
 * this will always extract the clean human-readable message text.
 * It recurses up to 5 levels deep to handle double/triple serialization.
 */
function extractMessageFromAnyShape(data: any, depth = 0): string {
    if (depth > 5) return "I'm here for you.";

    // Plain string
    if (typeof data === 'string') {
        const trimmed = data.trim();
        // Looks like JSON? Parse and recurse
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                return extractMessageFromAnyShape(parsed, depth + 1);
            } catch {
                // Not valid JSON — return the plain string
                return trimmed;
            }
        }
        return trimmed || "I'm here for you.";
    }

    // Object — look for known message keys
    if (typeof data === 'object' && data !== null) {
        if (data.message) return extractMessageFromAnyShape(data.message, depth + 1);
        if (data.response) return extractMessageFromAnyShape(data.response, depth + 1);
        if (data.text) return extractMessageFromAnyShape(data.text, depth + 1);
    }

    return "I'm here for you.";
}

/**
 * Get response from Standard (Empathic) AI
 */
export async function getStandardResponse(
    userMessage: string,
    userId: string,
    history: { role: string; content: string }[],
    context: StandardAIContext
): Promise<StandardAIResponse> {
    const payload = {
        userMessage,
        userId,
        previousMessages: history,
        userProfile: context.userProfile,
        currentState: context.currentState,
        assessmentScores: context.assessmentScores,
        therapeuticGoals: context.therapeuticGoals
    };

    const MAX_ATTEMPTS = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s timeout

            const response = await fetch('https://6gcmnzrb72.execute-api.us-east-1.amazonaws.com/chat/empathic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`AWS API error: ${response.status}`);
            }

            const data = await response.json();
            const messageString = extractMessageFromAnyShape(data);

            return {
                message: messageString,
                isFallback: data?.isFallback === true,
                emotionalTone: data?.emotionalTone || 'empathetic',
                timestamp: new Date().toISOString()
            };

        } catch (error: any) {
            lastError = error;
            const isAbort = error?.name === 'AbortError';
            const isNetwork = error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch');

            console.warn(`Standard AI attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error?.message);

            if (attempt < MAX_ATTEMPTS && (isAbort || isNetwork)) {
                // Brief pause before retry (cold-start recovery)
                await new Promise(r => setTimeout(r, 1500 * attempt));
                continue;
            }
            break;
        }
    }

    console.error('Standard AI Service Error after all retries:', lastError);
    return {
        message: "I'm having a little trouble connecting right now, but I'm here. Could you tell me more about that?",
        isFallback: true,
        timestamp: new Date().toISOString()
    };
}

export const standardAIService = {
    getStandardResponse
};
