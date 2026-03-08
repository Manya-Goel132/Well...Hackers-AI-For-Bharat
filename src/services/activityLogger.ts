// Activity Logger Service
// Centralized service for tracking all user activities in ManoSathi

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    doc,
    updateDoc,
    getDoc
} from './awsShim';
import { db } from './awsService';
import type {
    UserActivity,
    ActivityType,
    ActivitySubtype,
    ActivityMetadata,
    ActivityStats,
    StreakData,
    ActivityFilter,
    ActivitySummary,
    DailyActivity
} from '../types/activity';
import {
    calculateWellnessImpact,
    formatActivityDate,
    daysBetween
} from '../types/activity';

class ActivityLoggerService {
    private readonly COLLECTION_NAME = 'activities';
    private readonly STATS_COLLECTION = 'user_stats';

    /**
     * Log a new activity
     */
    async logActivity(
        userId: string,
        activityType: ActivityType,
        activitySubtype: ActivitySubtype,
        metadata: ActivityMetadata = {}
    ): Promise<{ activityId: string; newAchievements: any[] }> {
        try {
            // Calculate wellness impact
            const wellnessImpact = calculateWellnessImpact(activityType, metadata);

            // Remove undefined values from metadata (Firestore doesn't allow undefined)
            const cleanMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as ActivityMetadata);

            // Create activity object
            const activity: Omit<UserActivity, 'activityId'> = {
                userId,
                timestamp: new Date(),
                activityType,
                activitySubtype,
                metadata: {
                    ...cleanMetadata,
                    timestamp: new Date()
                },
                wellnessImpact
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
                ...activity,
                timestamp: Timestamp.fromDate(activity.timestamp),
                'metadata.timestamp': Timestamp.fromDate(new Date())
            });

            // Update user stats
            await this.updateUserStats(userId, activity as UserActivity);

            // Check for newly unlocked achievements (Commented out until achievementService is migrated)
            let newAchievements: any[] = [];
            /*
            try {
                const { achievementService } = await import('./achievementService');
                newAchievements = await achievementService.checkAndUnlockAchievements(userId);

                if (newAchievements.length > 0) {
                    console.log('🎉 New achievements unlocked:', newAchievements.map(a => a.name).join(', '));
                }
            } catch (error) {
                console.error('Error checking achievements:', error);
            }
            */

            console.log('Activity logged:', activityType, activitySubtype);
            return {
                activityId: docRef.id,
                newAchievements
            };
        } catch (error) {
            console.error('Error logging activity:', error);
            throw error;
        }
    }

    /**
     * Get activities for a user
     */
    async getActivities(
        userId: string,
        filter?: ActivityFilter,
        maxResults: number = 100
    ): Promise<UserActivity[]> {
        try {
            let q = query(
                collection(db, this.COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(maxResults)
            );

            // Apply filters
            if (filter?.activityTypes && filter.activityTypes.length > 0) {
                q = query(q, where('activityType', 'in', filter.activityTypes));
            }

            if (filter?.startDate) {
                q = query(q, where('timestamp', '>=', Timestamp.fromDate(filter.startDate)));
            }

            if (filter?.endDate) {
                q = query(q, where('timestamp', '<=', Timestamp.fromDate(filter.endDate)));
            }

            const snapshot = await getDocs(q);
            const activities: UserActivity[] = [];

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                activities.push({
                    activityId: docSnap.id,
                    userId: data.userId,
                    timestamp: data.timestamp.toDate(),
                    activityType: data.activityType,
                    activitySubtype: data.activitySubtype,
                    metadata: {
                        ...data.metadata,
                        timestamp: data.metadata?.timestamp?.toDate()
                    },
                    wellnessImpact: data.wellnessImpact,
                    notes: data.notes,
                    tags: data.tags
                });
            });

            return activities;
        } catch (error) {
            console.error('Error getting activities:', error);
            return [];
        }
    }

    /**
     * Get activity stats for a user
     */
    async getActivityStats(userId: string, days: number = 30): Promise<ActivityStats> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const activities = await this.getActivities(userId, {
                startDate
            }, 1000);

            const stats: ActivityStats = {
                totalActivities: activities.length,
                activitiesByType: {
                    journal: 0,
                    chat: 0,
                    voice_therapy: 0,
                    emotion_detection: 0,
                    assessment: 0,
                    settings: 0
                },
                totalDuration: 0,
                averageDuration: 0,
                lastActivity: new Date(0),
                firstActivity: new Date()
            };

            activities.forEach((activity) => {
                // Count by type
                stats.activitiesByType[activity.activityType]++;

                // Sum duration
                if (activity.metadata.duration) {
                    stats.totalDuration += activity.metadata.duration;
                }

                // Track first and last
                if (activity.timestamp > stats.lastActivity) {
                    stats.lastActivity = activity.timestamp;
                }
                if (activity.timestamp < stats.firstActivity) {
                    stats.firstActivity = activity.timestamp;
                }
            });

            // Calculate average
            if (stats.totalActivities > 0) {
                stats.averageDuration = stats.totalDuration / stats.totalActivities;
            }

            return stats;
        } catch (error) {
            console.error('Error getting activity stats:', error);
            throw error;
        }
    }

    /**
     * Calculate streak data
     */
    async getStreakData(userId: string): Promise<StreakData> {
        try {
            const activities = await this.getActivities(userId, {}, 365);

            if (activities.length === 0) {
                return {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: new Date(0),
                    streakStartDate: new Date()
                };
            }

            // Sort by date
            const sortedActivities = activities.sort((a, b) =>
                b.timestamp.getTime() - a.timestamp.getTime()
            );

            // Get unique dates
            const uniqueDates = new Set(
                sortedActivities.map(a => formatActivityDate(a.timestamp))
            );
            const dateArray = Array.from(uniqueDates).sort().reverse();

            // Calculate current streak
            let currentStreak = 0;
            let streakStartDate = new Date();
            const today = formatActivityDate(new Date());
            const yesterday = formatActivityDate(new Date(Date.now() - 86400000));

            // Check if active today or yesterday
            if (dateArray[0] === today || dateArray[0] === yesterday) {
                currentStreak = 1;
                streakStartDate = new Date(dateArray[0]);

                for (let i = 1; i < dateArray.length; i++) {
                    const currentDate = new Date(dateArray[i]);
                    const previousDate = new Date(dateArray[i - 1]);
                    const dayDiff = daysBetween(currentDate, previousDate);

                    if (dayDiff === 1) {
                        currentStreak++;
                        streakStartDate = currentDate;
                    } else {
                        break;
                    }
                }
            }

            // Calculate longest streak
            let longestStreak = 0;
            let tempStreak = 1;

            for (let i = 1; i < dateArray.length; i++) {
                const currentDate = new Date(dateArray[i]);
                const previousDate = new Date(dateArray[i - 1]);
                const dayDiff = daysBetween(currentDate, previousDate);

                if (dayDiff === 1) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 1;
                }
            }

            longestStreak = Math.max(longestStreak, currentStreak);

            return {
                currentStreak,
                longestStreak,
                lastActivityDate: sortedActivities[0].timestamp,
                streakStartDate
            };
        } catch (error) {
            console.error('Error calculating streak:', error);
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: new Date(0),
                streakStartDate: new Date()
            };
        }
    }

    /**
     * Get daily activities
     */
    async getDailyActivities(userId: string, date: Date): Promise<DailyActivity> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const activities = await this.getActivities(userId, {
                startDate: startOfDay,
                endDate: endOfDay
            });

            const totalDuration = activities.reduce((sum, a) =>
                sum + (a.metadata.duration || 0), 0
            );

            const wellnessScore = activities.reduce((sum, a) =>
                sum + a.wellnessImpact.score, 0
            );

            return {
                date: formatActivityDate(date),
                activities,
                totalActivities: activities.length,
                totalDuration,
                wellnessScore
            };
        } catch (error) {
            console.error('Error getting daily activities:', error);
            throw error;
        }
    }

    /**
     * Update user stats (called internally after logging activity)
     */
    private async updateUserStats(userId: string, activity: UserActivity): Promise<void> {
        try {
            const statsRef = doc(db, this.STATS_COLLECTION, userId);
            const statsDoc = await getDoc(statsRef);

            if (statsDoc.exists()) {
                const currentStats = statsDoc.data();
                await updateDoc(statsRef, {
                    totalActivities: (currentStats.totalActivities || 0) + 1,
                    lastActivity: Timestamp.fromDate(activity.timestamp),
                    [`activitiesByType.${activity.activityType}`]:
                        (currentStats.activitiesByType?.[activity.activityType] || 0) + 1
                });
            } else {
                // Create new stats document with userId as document ID
                await addDoc(collection(db, this.STATS_COLLECTION), {
                    userId,
                    totalActivities: 1,
                    lastActivity: Timestamp.fromDate(activity.timestamp),
                    activitiesByType: {
                        [activity.activityType]: 1
                    },
                    createdAt: Timestamp.now()
                });
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
            // Don't throw - stats update failure shouldn't block activity logging
        }
    }

    /**
     * Get activity summary for a period
     */
    async getActivitySummary(
        userId: string,
        period: 'day' | 'week' | 'month' | 'year'
    ): Promise<ActivitySummary> {
        try {
            const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;

            const stats = await this.getActivityStats(userId, days);
            const streak = await this.getStreakData(userId);
            const activities = await this.getActivities(userId, {
                startDate: new Date(Date.now() - days * 86400000)
            }, 1000);

            // Calculate top activities
            const activityCounts: Record<ActivityType, { count: number; totalDuration: number }> = {
                journal: { count: 0, totalDuration: 0 },
                chat: { count: 0, totalDuration: 0 },
                voice_therapy: { count: 0, totalDuration: 0 },
                emotion_detection: { count: 0, totalDuration: 0 },
                assessment: { count: 0, totalDuration: 0 },
                settings: { count: 0, totalDuration: 0 }
            };

            activities.forEach(activity => {
                activityCounts[activity.activityType].count++;
                activityCounts[activity.activityType].totalDuration += activity.metadata.duration || 0;
            });

            const topActivities = Object.entries(activityCounts)
                .map(([type, data]) => ({
                    type: type as ActivityType,
                    count: data.count,
                    totalDuration: data.totalDuration
                }))
                .sort((a, b) => b.count - a.count);

            // Calculate mood distribution
            const moodDistribution: any = {};
            activities.forEach(activity => {
                if (activity.metadata.mood) {
                    moodDistribution[activity.metadata.mood] =
                        (moodDistribution[activity.metadata.mood] || 0) + 1;
                }
            });

            // Calculate average wellness impact
            const totalImpact = activities.reduce((sum, a) => sum + a.wellnessImpact.score, 0);
            const averageWellnessImpact = activities.length > 0 ? totalImpact / activities.length : 0;

            return {
                period,
                stats,
                streak,
                topActivities,
                moodDistribution,
                averageWellnessImpact
            };
        } catch (error) {
            console.error('Error getting activity summary:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const activityLogger = new ActivityLoggerService();

// For direct imports
export default activityLogger;
