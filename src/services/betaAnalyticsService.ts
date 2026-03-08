// Beta Analytics Tracking Service
// Tracks user behavior for internal beta dashboard

import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from './awsShim';
import { db } from './awsService';

// ============================================
// DATA MODEL
// ============================================

export interface BetaAnalytics {
    // A. Identity & Cohort (static)
    uid: string;
    email: string; // User's email for identification
    displayName?: string; // User's display name
    photoURL?: string; // User's profile photo URL
    signupDate: Timestamp;
    ageRange?: string; // e.g., "18-24", "25-34"
    studentOrWorking?: string; // "student" | "working" | "other"
    primaryStressor?: string;
    preferredLanguage?: string;
    acquisitionSource?: string; // "organic" | "referral" | "social"

    // Internal tracking
    firstMessageTimestamp?: Timestamp;
    totalMessageCount?: number;
    firstChatSessionId?: string;

    // B. Activation Metrics
    onboardingCompleted: boolean;
    firstMeaningfulMessageAt?: Timestamp;
    firstSessionMessageCount: number;
    firstSessionDurationSeconds: number;
    activatedUser: boolean; // onboardingCompleted && messages >= 2

    // C. Retention Metrics
    day1Active: boolean;
    day2Active: boolean;
    day7Active: boolean;
    daysActiveFirst7: number;
    sessionsPerActiveDay: number;

    // D. Emotional Engagement Signals
    averageUserMessageLength: number;
    emotionalMessageRatio: number; // 0-100
    journalsCreatedCount: number;
    checkinsCompletedCount: number;
    returnedAfterNegativeMood: boolean;

    // E. Feature Touchpoints
    usedChat: boolean;
    usedJournal: boolean;
    viewedDashboard: boolean;
    usedBreathingExercise: boolean;

    // F. Drop-off & Silence
    lastActiveAt: Timestamp;
    dropOffDay?: number; // 1 | 2 | 3 | 7
    lastInteractionType?: string; // "chat" | "journal" | "checkin"
    lastMoodScore?: number;

    // G. Safety & Trust
    crisisFlagTriggered: boolean;
    continuedAfterCrisis: boolean;
    fallbackResponsesCount: number;

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================
// TRACKING SERVICE
// ============================================

class BetaAnalyticsService {
    private readonly COLLECTION = 'betaAnalytics';

    /**
     * Track breathing exercise usage
     */
    async trackBreathingExercise(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            await updateDoc(analyticsRef, {
                usedBreathingExercise: true,
                lastActiveAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('❌ Error tracking breathing exercise:', error);
        }
    }

    /**
     * Initialize analytics for a new user
     */
    async initializeUser(
        uid: string,
        profile: {
            email: string;
            displayName?: string;
            photoURL?: string;
            ageRange?: string;
            studentOrWorking?: string;
            primaryStressor?: string;
            preferredLanguage?: string;
            acquisitionSource?: string;
        }
    ): Promise<void> {
        try {
            console.log('📊 BetaAnalytics: Starting initialization for UID:', uid);
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const existingDoc = await getDoc(analyticsRef);

            if (existingDoc.exists()) {
                console.log('ℹ️ Analytics already initialized for user:', uid);
                return;
            }

            console.log('📊 BetaAnalytics: Creating new analytics document...');
            const initialData: Partial<BetaAnalytics> = {
                uid,
                email: profile.email,
                displayName: profile.displayName,
                photoURL: profile.photoURL,
                signupDate: serverTimestamp() as Timestamp,
                ageRange: profile.ageRange || 'unknown',
                studentOrWorking: profile.studentOrWorking || 'unknown',
                primaryStressor: profile.primaryStressor || 'unknown',
                preferredLanguage: profile.preferredLanguage || 'en',
                acquisitionSource: profile.acquisitionSource || 'organic',

                // Activation
                onboardingCompleted: false,
                firstSessionMessageCount: 0,
                firstSessionDurationSeconds: 0,
                activatedUser: false,

                // Retention
                day1Active: false,
                day2Active: false,
                day7Active: false,
                daysActiveFirst7: 0,
                sessionsPerActiveDay: 0,

                // Engagement
                averageUserMessageLength: 0,
                emotionalMessageRatio: 0,
                journalsCreatedCount: 0,
                checkinsCompletedCount: 0,
                returnedAfterNegativeMood: false,

                // Features
                usedChat: false,
                usedJournal: false,
                viewedDashboard: false,
                usedBreathingExercise: false,

                // Drop-off
                lastActiveAt: serverTimestamp() as Timestamp,
                crisisFlagTriggered: false,
                continuedAfterCrisis: false,
                fallbackResponsesCount: 0,

                createdAt: serverTimestamp() as Timestamp,
                updatedAt: serverTimestamp() as Timestamp,
            };

            console.log('📊 BetaAnalytics: Writing to Firestore...');
            await setDoc(analyticsRef, initialData);
            console.log('✅ Beta analytics initialized successfully for:', uid);
        } catch (error: any) {
            console.error('❌ Error initializing beta analytics:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Full error:', JSON.stringify(error, null, 2));
        }
    }

    /**
     * Track onboarding completion
     */
    async trackOnboardingCompleted(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            await updateDoc(analyticsRef, {
                onboardingCompleted: true,
                updatedAt: serverTimestamp(),
            });

            // Check if user is now activated
            await this.checkActivation(uid);
        } catch (error) {
            console.error('❌ Error tracking onboarding:', error);
        }
    }

    /**
     * Track chat message sent
     */
    async trackChatMessage(uid: string, messageLength: number, isEmotional: boolean, sessionId?: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const docSnap = await getDoc(analyticsRef);

            if (!docSnap.exists()) {
                console.warn('⚠️ Analytics not initialized for user:', uid);
                return;
            }

            const data = docSnap.data() as BetaAnalytics;

            const now = new Date();

            const updates: Partial<BetaAnalytics> = {
                usedChat: true,
                lastActiveAt: serverTimestamp() as Timestamp,
                lastInteractionType: 'chat',
                updatedAt: serverTimestamp() as Timestamp,
            };

            // Calculate total messages
            const currentTotal = data.totalMessageCount || 0;
            const newTotal = currentTotal + 1;
            updates.totalMessageCount = newTotal;

            // Recalculate Average Length
            const currentAvg = data.averageUserMessageLength || 0;
            const newAvg = ((currentAvg * (newTotal - 1)) + messageLength) / newTotal;
            updates.averageUserMessageLength = Math.round(newAvg);

            // Update First Session Count
            if (!data.firstMessageTimestamp) {
                // First ever message for this user
                updates.firstMessageTimestamp = Timestamp.fromDate(now);
                updates.firstSessionMessageCount = 1;
                updates.firstMeaningfulMessageAt = serverTimestamp() as Timestamp;
                if (sessionId) updates.firstChatSessionId = sessionId;
            } else {
                // STRICT CHECK: Only count if within 30 mins AND matches first session ID (if available)
                const diffMinutes = (now.getTime() - data.firstMessageTimestamp.toDate().getTime()) / (1000 * 60);

                // If we have a tracked session ID, it MUST match. 
                // If we don't (legacy), we rely purely on time.
                const isSameSession = data.firstChatSessionId
                    ? (sessionId === data.firstChatSessionId)
                    : true;

                if (diffMinutes <= 30 && isSameSession) {
                    updates.firstSessionMessageCount = (data.firstSessionMessageCount || 0) + 1;
                }
            }

            // Update emotional message ratio
            if (isEmotional) {
                const emotionalCount = Math.round((data.emotionalMessageRatio / 100) * (newTotal - 1)) + 1;
                updates.emotionalMessageRatio = Math.round((emotionalCount / newTotal) * 100);
            }

            await updateDoc(analyticsRef, updates);

            // Check activation (Using 2 messages in FIRST SESSION)
            // Activation logic needs to check the FIXED firstSessionCount
            // checkActivation reads the doc again, so it will see the updated value.

            // We pass the new count to checkActivation logic implicitly via DB update.
            // But wait, checkActivation checks `data.firstSessionMessageCount`.
            // Since we updated it in DB, subsequent call might read stale or new?
            // We call `this.checkActivation(uid)` which fetches doc again. It's fine.

            await this.checkActivation(uid);
        } catch (error) {
            console.error('❌ Error tracking chat message:', error);
        }
    }

    /**
     * Track journal creation
     */
    async trackJournalCreated(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const docSnap = await getDoc(analyticsRef);

            if (!docSnap.exists()) return;

            const data = docSnap.data() as BetaAnalytics;

            await updateDoc(analyticsRef, {
                usedJournal: true,
                journalsCreatedCount: (data.journalsCreatedCount || 0) + 1,
                lastActiveAt: serverTimestamp(),
                lastInteractionType: 'journal',
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('❌ Error tracking journal:', error);
        }
    }

    /**
     * Track check-in completion
     */
    async trackCheckinCompleted(uid: string, moodScore: number): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const docSnap = await getDoc(analyticsRef);

            if (!docSnap.exists()) return;

            const data = docSnap.data() as BetaAnalytics;

            await updateDoc(analyticsRef, {
                checkinsCompletedCount: (data.checkinsCompletedCount || 0) + 1,
                lastActiveAt: serverTimestamp(),
                lastInteractionType: 'checkin',
                lastMoodScore: moodScore,
                updatedAt: serverTimestamp(),
            });

            // Track return after negative mood
            if (data.lastMoodScore && data.lastMoodScore < 5 && moodScore >= 5) {
                await updateDoc(analyticsRef, {
                    returnedAfterNegativeMood: true,
                });
            }
        } catch (error) {
            console.error('❌ Error tracking checkin:', error);
        }
    }

    /**
     * Track crisis flag
     */
    async trackCrisisFlag(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            await updateDoc(analyticsRef, {
                crisisFlagTriggered: true,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('❌ Error tracking crisis flag:', error);
        }
    }

    /**
     * Track continued usage after crisis
     */
    async trackContinuedAfterCrisis(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            await updateDoc(analyticsRef, {
                continuedAfterCrisis: true,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('❌ Error tracking crisis continuation:', error);
        }
    }

    /**
     * Track fallback response
     */
    async trackFallbackResponse(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const docSnap = await getDoc(analyticsRef);

            if (!docSnap.exists()) return;

            const data = docSnap.data() as BetaAnalytics;

            await updateDoc(analyticsRef, {
                fallbackResponsesCount: (data.fallbackResponsesCount || 0) + 1,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('❌ Error tracking fallback:', error);
        }
    }

    /**
     * Track session start (for retention metrics)
     */
    async trackSessionStart(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const docSnap = await getDoc(analyticsRef);

            if (!docSnap.exists()) return;

            const data = docSnap.data() as BetaAnalytics;
            const signupDate = data.signupDate.toDate();
            const now = new Date();
            const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

            const updates: Partial<BetaAnalytics> = {
                lastActiveAt: serverTimestamp() as Timestamp,
                updatedAt: serverTimestamp() as Timestamp,
            };

            // Update retention flags
            if (daysSinceSignup === 1 && !data.day1Active) {
                updates.day1Active = true;
                updates.daysActiveFirst7 = (data.daysActiveFirst7 || 0) + 1;
            } else if (daysSinceSignup === 2 && !data.day2Active) {
                updates.day2Active = true;
                updates.daysActiveFirst7 = (data.daysActiveFirst7 || 0) + 1;
            } else if (daysSinceSignup === 7 && !data.day7Active) {
                updates.day7Active = true;
                updates.daysActiveFirst7 = (data.daysActiveFirst7 || 0) + 1;
            }

            await updateDoc(analyticsRef, updates);
        } catch (error) {
            console.error('❌ Error tracking session start:', error);
        }
    }

    /**
     * Check and update activation status
     */
    private async checkActivation(uid: string): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const docSnap = await getDoc(analyticsRef);

            if (!docSnap.exists()) return;

            const data = docSnap.data() as BetaAnalytics;

            // Activation criteria: onboarding completed AND messages >= 2
            const isActivated = data.onboardingCompleted && data.firstSessionMessageCount >= 2;

            if (isActivated && !data.activatedUser) {
                await updateDoc(analyticsRef, {
                    activatedUser: true,
                    updatedAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('❌ Error checking activation:', error);
        }
    }

    /**
     * Track feature usage
     */
    async trackFeatureUsed(uid: string, feature: 'dashboard' | 'breathing'): Promise<void> {
        try {
            const analyticsRef = doc(db, this.COLLECTION, uid);
            const updates: Partial<BetaAnalytics> = {
                updatedAt: serverTimestamp() as Timestamp,
            };

            if (feature === 'dashboard') {
                updates.viewedDashboard = true;
            } else if (feature === 'breathing') {
                updates.usedBreathingExercise = true;
            }

            await updateDoc(analyticsRef, updates);
        } catch (error) {
            console.error('❌ Error tracking feature usage:', error);
        }
    }
}

export const betaAnalyticsService = new BetaAnalyticsService();
