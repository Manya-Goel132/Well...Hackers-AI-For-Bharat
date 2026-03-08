// Activity Types and Interfaces for ManoSathi
// Comprehensive type definitions for tracking all user activities

export type ActivityType =
    | 'journal'
    | 'chat'
    | 'voice_therapy'
    | 'emotion_detection'
    | 'assessment'
    | 'settings';

export type ActivitySubtype =
    // Journal subtypes
    | 'journal_entry_created'
    | 'journal_entry_viewed'
    | 'mood_selected'

    // Chat subtypes
    | 'conversation_started'
    | 'message_sent'
    | 'message_received'
    | 'conversation_ended'
    | 'conversation_deleted'
    | 'conversation_renamed'

    // Voice therapy subtypes
    | 'exercise_started'
    | 'exercise_completed'
    | 'exercise_abandoned'
    | 'voice_changed'

    // Emotion detection subtypes
    | 'emotion_scan_started'
    | 'emotion_detected'
    | 'emotion_scan_ended'

    // Assessment subtypes
    | 'assessment_started'
    | 'assessment_completed'
    | 'assessment_abandoned'
    | 'assessment_viewed'

    // Settings subtypes
    | 'profile_updated'
    | 'language_changed'
    | 'theme_changed'
    | 'preference_updated';

export type WellnessCategory = 'emotional' | 'mental' | 'behavioral' | 'social';

export type MoodType =
    | 'very_happy'
    | 'happy'
    | 'neutral'
    | 'sad'
    | 'very_sad'
    | 'anxious'
    | 'calm'
    | 'excited'
    | 'stressed'
    | 'relaxed'
    | 'angry'
    | 'grateful'
    | 'hopeful'
    | 'lonely'
    | 'content'
    | 'peaceful';

export type EmotionType =
    | 'happy'
    | 'sad'
    | 'neutral'
    | 'calm'
    | 'anxious'
    | 'angry'
    | 'surprised'
    | 'fearful';

export interface ActivityMetadata {
    // Journal metadata
    wordCount?: number;
    mood?: MoodType;
    sentiment?: number; // -1 to 1
    themes?: string[];
    gratitudeCount?: number;

    // Chat metadata
    messageCount?: number;
    conversationId?: string;
    conversationTitle?: string;
    topics?: string[];
    sentimentScore?: number;

    // Voice therapy metadata
    exerciseType?: 'breathing' | 'affirmation' | 'mindfulness' | 'expression';
    exerciseName?: string;
    completed?: boolean;
    voiceUsed?: string;
    language?: string;

    // Emotion detection metadata
    emotionDetected?: EmotionType;
    confidence?: number;
    emotionHistory?: EmotionType[];

    // Assessment metadata
    assessmentType?: string;
    totalScore?: number;
    severity?: string;
    previousScore?: number;
    trend?: string;

    // Settings metadata
    settingChanged?: string;
    oldValue?: string;
    newValue?: string;

    // Common metadata
    duration?: number; // in seconds
    timestamp?: Date;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
}

export interface WellnessImpact {
    category: WellnessCategory;
    score: number; // -10 to +10
    reason?: string;
}

export interface UserActivity {
    // Core fields
    activityId: string;
    userId: string;
    timestamp: Date;

    // Activity details
    activityType: ActivityType;
    activitySubtype: ActivitySubtype;

    // Metadata
    metadata: ActivityMetadata;

    // Wellness impact
    wellnessImpact: WellnessImpact;

    // Optional fields
    notes?: string;
    tags?: string[];
}

export interface ActivityStats {
    totalActivities: number;
    activitiesByType: Record<ActivityType, number>;
    totalDuration: number; // in seconds
    averageDuration: number;
    lastActivity: Date;
    firstActivity: Date;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    streakStartDate: Date;
}

export interface DailyActivity {
    date: string; // YYYY-MM-DD
    activities: UserActivity[];
    totalActivities: number;
    totalDuration: number;
    wellnessScore: number;
    dominantMood?: MoodType;
}

export interface ActivityFilter {
    startDate?: Date;
    endDate?: Date;
    activityTypes?: ActivityType[];
    activitySubtypes?: ActivitySubtype[];
    minDuration?: number;
    maxDuration?: number;
}

export interface ActivitySummary {
    period: 'day' | 'week' | 'month' | 'year';
    stats: ActivityStats;
    streak: StreakData;
    topActivities: Array<{
        type: ActivityType;
        count: number;
        totalDuration: number;
    }>;
    moodDistribution: Record<MoodType, number>;
    averageWellnessImpact: number;
}

// Helper type guards
export const isJournalActivity = (activity: UserActivity): boolean => {
    return activity.activityType === 'journal';
};

export const isChatActivity = (activity: UserActivity): boolean => {
    return activity.activityType === 'chat';
};

export const isVoiceTherapyActivity = (activity: UserActivity): boolean => {
    return activity.activityType === 'voice_therapy';
};

export const isEmotionDetectionActivity = (activity: UserActivity): boolean => {
    return activity.activityType === 'emotion_detection';
};

// Wellness impact calculation helpers
export const calculateWellnessImpact = (
    activityType: ActivityType,
    metadata: ActivityMetadata
): WellnessImpact => {
    let category: WellnessCategory;
    let score: number = 0;
    let reason: string = '';

    switch (activityType) {
        case 'journal':
            category = 'mental';
            score = 5; // Journaling is generally positive
            if (metadata.mood === 'very_happy' || metadata.mood === 'happy') {
                score += 2;
                reason = 'Positive mood while journaling';
            }
            if (metadata.gratitudeCount && metadata.gratitudeCount > 0) {
                score += 3;
                reason = 'Gratitude practice';
            }
            break;

        case 'chat':
            category = 'social';
            score = 3; // AI interaction is supportive
            if (metadata.sentimentScore && metadata.sentimentScore > 0.5) {
                score += 2;
                reason = 'Positive conversation';
            }
            break;

        case 'voice_therapy':
            category = 'behavioral';
            score = metadata.completed ? 7 : 3;
            reason = metadata.completed ? 'Exercise completed' : 'Exercise attempted';
            break;

        case 'emotion_detection':
            category = 'emotional';
            score = 4; // Self-awareness is valuable
            reason = 'Emotional self-awareness';
            break;

        case 'assessment':
            category = 'mental';
            score = 6; // Taking assessments shows self-awareness
            reason = 'Mental health self-assessment';
            if (metadata.trend === 'improving') {
                score += 2;
                reason = 'Improving mental health metrics';
            } else if (metadata.trend === 'declining') {
                score -= 1;
                reason = 'Declining metrics - awareness is first step';
            }
            break;

        case 'settings':
            category = 'behavioral';
            score = 1; // Small positive impact
            reason = 'Platform engagement';
            break;

        default:
            category = 'behavioral';
            score = 1;
    }

    return { category, score, reason };
};

// Date helpers
export const formatActivityDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatActivityDate(date) === formatActivityDate(today);
};

export const isYesterday = (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatActivityDate(date) === formatActivityDate(yesterday);
};

export const daysBetween = (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};
