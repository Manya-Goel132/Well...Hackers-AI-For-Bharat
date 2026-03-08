// Subscription and Feature Management Service
// Handles free tier limits, premium features, and subscription status

import {
    doc,
    getDoc,
    setDoc,
    collection
} from './awsShim';
import { awsService, db } from './awsService';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionStatus {
    tier: SubscriptionTier;
    isActive: boolean;
    expiresAt?: Date;
    features: SubscriptionFeatures;
}

export interface SubscriptionFeatures {
    // Chat limits
    dailyMessageLimit: number;
    unlimitedChat: boolean;

    // Voice features
    voiceJournaling: boolean;
    voiceEmotionAnalysis: boolean;
    realTimeEmotions: boolean; // Hume AI

    // Journal limits
    monthlyJournalLimit: number;
    unlimitedJournals: boolean;

    // Advanced features
    moodForecasting: boolean;
    culturalIdioms: boolean;
    crisisDetection: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;

    // Family & Extras
    familyAccounts: number;
    therapistMatching: boolean;
    videoSupport: boolean;
    wellnessCoach: boolean;
}

export interface UsageStats {
    messagesToday: number;
    journalsThisMonth: number;
    lastResetDate: string;
}

// Feature definitions per tier
const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
    free: {
        dailyMessageLimit: 5, // 5 messages per day
        unlimitedChat: false,
        voiceJournaling: true, // Web Speech only
        voiceEmotionAnalysis: false,
        realTimeEmotions: false,
        monthlyJournalLimit: 8, // 3 quick + 5 text
        unlimitedJournals: false,
        moodForecasting: false,
        culturalIdioms: true, // Available to all
        crisisDetection: true, // Available to all
        advancedAnalytics: false,
        prioritySupport: false,
        familyAccounts: 1,
        therapistMatching: false,
        videoSupport: false,
        wellnessCoach: false,
    },
    premium: {
        dailyMessageLimit: 30, // 30 messages per day
        unlimitedChat: false,
        voiceJournaling: true,
        voiceEmotionAnalysis: true, // Mock emotions
        realTimeEmotions: false,
        monthlyJournalLimit: 40, // 15 quick + 5 audio + 20 text
        unlimitedJournals: false,
        moodForecasting: true,
        culturalIdioms: true,
        crisisDetection: true,
        advancedAnalytics: true,
        prioritySupport: true,
        familyAccounts: 1,
        therapistMatching: false,
        videoSupport: false,
        wellnessCoach: false,
    },
    pro: {
        dailyMessageLimit: 50, // 50 messages per day
        unlimitedChat: false,
        voiceJournaling: true,
        voiceEmotionAnalysis: true,
        realTimeEmotions: true, // Real Hume AI
        monthlyJournalLimit: 65, // 20 quick + 10 audio + 5 deep + 30 text
        unlimitedJournals: false,
        moodForecasting: true,
        culturalIdioms: true,
        crisisDetection: true,
        advancedAnalytics: true,
        prioritySupport: true,
        familyAccounts: 4,
        therapistMatching: true,
        videoSupport: true,
        wellnessCoach: true,
    },
};

class SubscriptionService {
    /**
     * Get user's subscription status
     */
    async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
        try {
            const userDoc = await awsService.getUserProfile(userId);

            // For now, everyone is free tier
            // Cast to validation as property might be missing on type
            const tier: SubscriptionTier = ((userDoc as any)?.subscriptionTier as SubscriptionTier) || 'free';

            return {
                tier,
                isActive: true,
                features: TIER_FEATURES[tier],
            };
        } catch (error) {
            console.error('Error getting subscription status:', error);
            // Default to free tier on error
            return {
                tier: 'free',
                isActive: true,
                features: TIER_FEATURES.free,
            };
        }
    }

    /**
     * Get user's usage stats
     */
    async getUsageStats(userId: string): Promise<UsageStats> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const thisMonth = new Date().toISOString().slice(0, 7);

            // Get from Firestore using Modular SDK
            const usageRef = doc(db, 'users', userId, 'usage', 'current');
            const usageDoc = await getDoc(usageRef);

            const data = usageDoc.data();

            // Reset if new day/month
            const shouldReset = data?.lastResetDate !== today;

            if (shouldReset) {
                return {
                    messagesToday: 0,
                    journalsThisMonth: 0,
                    lastResetDate: today,
                };
            }

            return {
                messagesToday: data?.messagesToday || 0,
                journalsThisMonth: data?.journalsThisMonth || 0,
                lastResetDate: data?.lastResetDate || today,
            };
        } catch (error) {
            console.error('Error getting usage stats:', error);
            return {
                messagesToday: 0,
                journalsThisMonth: 0,
                lastResetDate: new Date().toISOString().split('T')[0],
            };
        }
    }

    /**
     * Check if user can send a message
     */
    async canSendMessage(userId: string): Promise<{ allowed: boolean; reason?: string }> {
        const subscription = await this.getSubscriptionStatus(userId);

        // Premium/Pro users have unlimited messages
        if (subscription.features.unlimitedChat) {
            return { allowed: true };
        }

        // Check free tier limit
        const usage = await this.getUsageStats(userId);

        if (usage.messagesToday >= subscription.features.dailyMessageLimit) {
            return {
                allowed: false,
                reason: `Daily message limit reached (${subscription.features.dailyMessageLimit}/day). Upgrade to Premium for unlimited messages!`,
            };
        }

        return { allowed: true };
    }

    /**
     * Increment message count
     */
    async incrementMessageCount(userId: string): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const usage = await this.getUsageStats(userId);

            const usageRef = doc(db, 'users', userId, 'usage', 'current');
            await setDoc(usageRef, {
                messagesToday: usage.messagesToday + 1,
                journalsThisMonth: usage.journalsThisMonth,
                lastResetDate: today,
            });
        } catch (error) {
            console.error('Error incrementing message count:', error);
        }
    }

    /**
     * Check if user can create a journal
     */
    async canCreateJournal(userId: string): Promise<{ allowed: boolean; reason?: string }> {
        const subscription = await this.getSubscriptionStatus(userId);

        // Premium/Pro users have unlimited journals
        if (subscription.features.unlimitedJournals) {
            return { allowed: true };
        }

        // Check free tier limit
        const usage = await this.getUsageStats(userId);

        if (usage.journalsThisMonth >= subscription.features.monthlyJournalLimit) {
            return {
                allowed: false,
                reason: `Monthly journal limit reached (${subscription.features.monthlyJournalLimit}/month). Upgrade to Premium for unlimited journals!`,
            };
        }

        return { allowed: true };
    }

    /**
     * Check if feature is available
     */
    async hasFeature(userId: string, feature: keyof SubscriptionFeatures): Promise<boolean> {
        const subscription = await this.getSubscriptionStatus(userId);
        return !!subscription.features[feature];
    }

    /**
     * Get upgrade prompt message
     */
    getUpgradeMessage(tier: SubscriptionTier): string {
        if (tier === 'free') {
            return '🎉 Upgrade to Premium for unlimited messages, voice journaling, and advanced features! Only ₹299/month.';
        }
        if (tier === 'premium') {
            return '🚀 Upgrade to Pro for real-time voice emotions, therapist matching, and family accounts! Only ₹499/month.';
        }
        return '';
    }
}

export const subscriptionService = new SubscriptionService();
