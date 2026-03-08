// Private Beta Analytics Dashboard
// Internal-only view for founders to track beta user behavior

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from '../../services/awsShim';
import { db } from '../../services/awsService';
import { BetaAnalytics } from '../../services/betaAnalyticsService';
import { Loader2, Users, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { Card } from '../ui/card';

interface AggregatedMetrics {
    totalUsers: number;
    activatedUsers: number;
    activationRate: number;
    day1Retention: number;
    day2Retention: number;
    day7Retention: number;
    avgSessionsPerUser: number;
    avgMessageLength: number;
    journalsPerUser: number;
    crisisEvents: number;
    continuedAfterCrisisRate: number;
    dropOffByDay: { day: number; count: number }[];
    // New Metrics
    firstSession: {
        zeroMsg: number;
        oneMsg: number;
        twoPlusMsg: number;
        medianTime: number;
    };
    lastInteraction: {
        type: Record<string, number>;
        avgMoodDropOff: number;
    };
    secondSession: {
        returnedUsers: number;
        usedChat: number;
        usedJournal: number;
        usedCheckin: number;
    };
    languageMetrics: Record<string, { count: number; activation: number; retention: number }>;
}

export function BetaDashboard() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
    const [users, setUsers] = useState<BetaAnalytics[]>([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const analyticsRef = collection(db, 'betaAnalytics');
            const q = query(analyticsRef, orderBy('signupDate', 'desc'));
            const snapshot = await getDocs(q);

            const userData: BetaAnalytics[] = [];
            snapshot.forEach((doc) => {
                userData.push(doc.data() as BetaAnalytics);
            });

            setUsers(userData);
            setMetrics(calculateMetrics(userData));
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMedian = (values: number[]) => {
        if (values.length === 0) return 0;
        values.sort((a, b) => a - b);
        const half = Math.floor(values.length / 2);
        if (values.length % 2) return values[half];
        return (values[half - 1] + values[half]) / 2.0;
    };

    const calculateMetrics = (users: BetaAnalytics[]): AggregatedMetrics => {
        const total = users.length;
        if (total === 0) {
            return {
                totalUsers: 0,
                activatedUsers: 0,
                activationRate: 0,
                day1Retention: 0,
                day2Retention: 0,
                day7Retention: 0,
                avgSessionsPerUser: 0,
                avgMessageLength: 0,
                journalsPerUser: 0,
                crisisEvents: 0,
                continuedAfterCrisisRate: 0,
                dropOffByDay: [],
                firstSession: { zeroMsg: 0, oneMsg: 0, twoPlusMsg: 0, medianTime: 0 },
                lastInteraction: { type: {}, avgMoodDropOff: 0 },
                secondSession: { returnedUsers: 0, usedChat: 0, usedJournal: 0, usedCheckin: 0 },
                languageMetrics: {},
            };
        }

        const activated = users.filter(u => u.activatedUser).length;
        const day1Active = users.filter(u => u.day1Active).length;
        const day2Active = users.filter(u => u.day2Active).length;
        const day7Active = users.filter(u => u.day7Active).length;

        const totalSessions = users.reduce((sum, u) => sum + (u.sessionsPerActiveDay || 0), 0);
        const totalMessageLength = users.reduce((sum, u) => sum + (u.averageUserMessageLength || 0), 0);
        const totalJournals = users.reduce((sum, u) => sum + (u.journalsCreatedCount || 0), 0);
        const crisisCount = users.filter(u => u.crisisFlagTriggered).length;
        const continuedAfterCrisis = users.filter(u => u.continuedAfterCrisis).length;

        // Drop-off analysis
        const dropOffCounts: { [key: number]: number } = {};
        users.forEach(u => {
            if (u.dropOffDay) {
                dropOffCounts[u.dropOffDay] = (dropOffCounts[u.dropOffDay] || 0) + 1;
            }
        });

        const dropOffByDay = Object.entries(dropOffCounts).map(([day, count]) => ({
            day: parseInt(day),
            count,
        }));

        // --- NEW CALCULATIONS ---

        // 1. First Session Breakdown
        const zeroMsg = users.filter(u => u.firstSessionMessageCount === 0).length;
        const oneMsg = users.filter(u => u.firstSessionMessageCount === 1).length;
        const twoPlusMsg = users.filter(u => u.firstSessionMessageCount >= 2).length;
        const medianTime = calculateMedian(users.map(u => u.firstSessionDurationSeconds || 0));

        // 2. Last Interaction (Proxy for reason of drop-off)
        const lastInteractionType: Record<string, number> = {};
        let totalDropOffMood = 0;
        let dropOffMoodCount = 0;

        users.forEach(u => {
            const type = u.lastInteractionType || 'onboarding'; // Default to onboarding if null
            lastInteractionType[type] = (lastInteractionType[type] || 0) + 1;

            if (u.lastMoodScore) {
                totalDropOffMood += u.lastMoodScore;
                dropOffMoodCount++;
            }
        });

        // 3. Second Session (Returning Users)
        // Proxy: Users active for > 1 day or explicitly marked day1Active (returned next day)
        const returningUsers = users.filter(u => u.day1Active || (u.daysActiveFirst7 && u.daysActiveFirst7 >= 2));
        const returnedCount = returningUsers.length;
        const usedChatRet = returningUsers.filter(u => u.usedChat).length;
        const usedJournalRet = returningUsers.filter(u => u.usedJournal).length;
        const usedCheckinRet = returningUsers.filter(u => u.checkinsCompletedCount > 0).length;

        // 4. Language Metrics
        const languageMetrics: Record<string, { count: number; activation: number; retention: number }> = {};
        const langs = Array.from(new Set(users.map(u => u.preferredLanguage || 'en')));

        langs.forEach(lang => {
            const langUsers = users.filter(u => (u.preferredLanguage || 'en') === lang);
            const count = langUsers.length;
            const act = langUsers.filter(u => u.activatedUser).length;
            const ret = langUsers.filter(u => u.day1Active).length;

            languageMetrics[lang] = {
                count,
                activation: (act / count) * 100,
                retention: (ret / count) * 100
            };
        });

        return {
            totalUsers: total,
            activatedUsers: activated,
            activationRate: (activated / total) * 100,
            day1Retention: (day1Active / total) * 100,
            day2Retention: (day2Active / total) * 100,
            day7Retention: (day7Active / total) * 100,
            avgSessionsPerUser: totalSessions / total,
            avgMessageLength: totalMessageLength / total,
            journalsPerUser: totalJournals / total,
            crisisEvents: crisisCount,
            continuedAfterCrisisRate: crisisCount > 0 ? (continuedAfterCrisis / crisisCount) * 100 : 0,
            dropOffByDay,
            firstSession: { zeroMsg, oneMsg, twoPlusMsg, medianTime },
            lastInteraction: { type: lastInteractionType, avgMoodDropOff: dropOffMoodCount ? totalDropOffMood / dropOffMoodCount : 0 },
            secondSession: {
                returnedUsers: returnedCount,
                usedChat: usedChatRet,
                usedJournal: usedJournalRet,
                usedCheckin: usedCheckinRet
            },
            languageMetrics
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const showWarning = metrics && (metrics.activationRate < 60 || metrics.day7Retention < 20);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Beta Analytics Dashboard</h1>
                    <p className="text-gray-600">Internal metrics for ManoSathi beta users</p>
                </div>

                {/* Warning Banner */}
                {showWarning && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-900">Low Performance Alert</h3>
                            <p className="text-sm text-red-700">
                                {metrics.activationRate < 60 && `Activation rate is ${metrics.activationRate.toFixed(1)}% (target: 60%+). `}
                                {metrics.day7Retention < 20 && `D7 retention is ${metrics.day7Retention.toFixed(1)}% (target: 20%+).`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        icon={<Users className="w-5 h-5" />}
                        label="Total Beta Users"
                        value={metrics?.totalUsers || 0}
                        color="blue"
                    />
                    <MetricCard
                        icon={<TrendingUp className="w-5 h-5" />}
                        label="Activated Users"
                        value={`${metrics?.activationRate.toFixed(1)}%`}
                        subtitle={`${metrics?.activatedUsers} users`}
                        color="emerald"
                    />
                    <MetricCard
                        icon={<Activity className="w-5 h-5" />}
                        label="D7 Retention"
                        value={`${metrics?.day7Retention.toFixed(1)}%`}
                        color="purple"
                    />
                    <MetricCard
                        icon={<AlertTriangle className="w-5 h-5" />}
                        label="Crisis Events"
                        value={metrics?.crisisEvents || 0}
                        subtitle={`${metrics?.continuedAfterCrisisRate.toFixed(0)}% continued`}
                        color="red"
                    />
                </div>

                {/* NEW PANELS ROW 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* 1. First Session Breakdown */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">First Session Quality</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{metrics?.firstSession.zeroMsg}</div>
                                    <div className="text-xs text-red-700 font-medium">0 Msgs (Bounce)</div>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">{metrics?.firstSession.oneMsg}</div>
                                    <div className="text-xs text-yellow-700 font-medium">1 Msg (Risk)</div>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                    <div className="text-2xl font-bold text-emerald-600">{metrics?.firstSession.twoPlusMsg}</div>
                                    <div className="text-xs text-emerald-700 font-medium">2+ Msgs (Safe)</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-sm text-gray-600">Median First Session Time</span>
                                <span className="font-mono font-bold text-gray-800">{metrics?.firstSession.medianTime.toFixed(0)}s</span>
                            </div>
                        </div>
                    </Card>

                    {/* 2. Last Interaction Analysis */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Interaction (Drop-off Proxy)</h2>
                        <div className="space-y-3">
                            {Object.entries(metrics?.lastInteraction.type || {}).map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center">
                                    <span className="capitalize text-sm text-gray-700">{type}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-100 rounded-full h-2">
                                            <div className="bg-slate-500 h-2 rounded-full"
                                                style={{ width: `${(count / (metrics?.totalUsers || 1)) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-mono">{count}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Avg Mood at Drop-off</span>
                                    <span className={`font-bold ${metrics?.lastInteraction.avgMoodDropOff && metrics.lastInteraction.avgMoodDropOff < 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {metrics?.lastInteraction.avgMoodDropOff.toFixed(1)}/10
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* NEW PANELS ROW 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* 3. Second Session (Returning Users) */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Returning Users Behavior</h2>
                        <div className="mb-4">
                            <div className="text-3xl font-bold text-gray-900">{metrics?.secondSession.returnedUsers}</div>
                            <div className="text-sm text-gray-500">Users returned after Day 1</div>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Features Used by Returners</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Used Chat</span>
                                <span className="font-medium">{metrics?.secondSession.usedChat} users</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Used Journal</span>
                                <span className="font-medium">{metrics?.secondSession.usedJournal} users</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Completed Check-in</span>
                                <span className="font-medium">{metrics?.secondSession.usedCheckin} users</span>
                            </div>
                        </div>
                    </Card>

                    {/* 4. Language Metrics */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metrics by Language</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-2 text-gray-600 font-medium">Lang</th>
                                        <th className="text-right p-2 text-gray-600 font-medium">Users</th>
                                        <th className="text-right p-2 text-gray-600 font-medium">Activ.</th>
                                        <th className="text-right p-2 text-gray-600 font-medium">Ret. (D1)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(metrics?.languageMetrics || {}).map(([lang, data]) => (
                                        <tr key={lang} className="border-b border-gray-100">
                                            <td className="p-2 font-medium capitalize">{lang}</td>
                                            <td className="p-2 text-right">{data.count}</td>
                                            <td className="p-2 text-right">{data.activation.toFixed(0)}%</td>
                                            <td className="p-2 text-right">{data.retention.toFixed(0)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Retention Funnel */}
                <Card className="p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Retention Funnel</h2>
                    <div className="space-y-3">
                        <FunnelStep label="Signup" value={metrics?.totalUsers || 0} percentage={100} />
                        <FunnelStep
                            label="Activated (Onboarding + 2 messages)"
                            value={metrics?.activatedUsers || 0}
                            percentage={metrics?.activationRate || 0}
                        />
                        <FunnelStep
                            label="Day 2 Active"
                            value={Math.round((metrics?.day2Retention || 0) * (metrics?.totalUsers || 0) / 100)}
                            percentage={metrics?.day2Retention || 0}
                        />
                        <FunnelStep
                            label="Day 7 Active"
                            value={Math.round((metrics?.day7Retention || 0) * (metrics?.totalUsers || 0) / 100)}
                            percentage={metrics?.day7Retention || 0}
                        />
                    </div>
                </Card>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Message Length</h3>
                        <p className="text-2xl font-bold text-gray-900">{metrics?.avgMessageLength.toFixed(0)} chars</p>
                    </Card>
                    <Card className="p-6">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Journals per User</h3>
                        <p className="text-2xl font-bold text-gray-900">{metrics?.journalsPerUser.toFixed(1)}</p>
                    </Card>
                    <Card className="p-6">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Sessions/User</h3>
                        <p className="text-2xl font-bold text-gray-900">{metrics?.avgSessionsPerUser.toFixed(1)}</p>
                    </Card>
                </div>

                {/* Drop-off Analysis */}
                {metrics && metrics.dropOffByDay.length > 0 && (
                    <Card className="p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Drop-off by Day</h2>
                        <div className="space-y-2">
                            {metrics.dropOffByDay.map(({ day, count }) => (
                                <div key={day} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Day {day}</span>
                                    <span className="text-sm font-medium text-gray-900">{count} users</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* User Table */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-3 font-medium text-gray-600">Email</th>
                                    <th className="text-left p-3 font-medium text-gray-600">Name</th>
                                    <th className="text-left p-3 font-medium text-gray-600">Signup Date</th>
                                    <th className="text-left p-3 font-medium text-gray-600">Activated</th>
                                    <th className="text-left p-3 font-medium text-gray-600">Messages</th>
                                    <th className="text-left p-3 font-medium text-gray-600">Journals</th>
                                    <th className="text-left p-3 font-medium text-gray-600">Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.slice(0, 20).map((user) => (
                                    <tr key={user.uid} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-xs">{user.email || 'N/A'}</td>
                                        <td className="p-3 text-xs">{user.displayName || 'N/A'}</td>
                                        <td className="p-3">{user.signupDate?.toDate().toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${user.activatedUser ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {user.activatedUser ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-3">{user.firstSessionMessageCount}</td>
                                        <td className="p-3">{user.journalsCreatedCount}</td>
                                        <td className="p-3">{user.lastActiveAt?.toDate().toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Helper Components

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    color: 'blue' | 'emerald' | 'purple' | 'red';
}

function MetricCard({ icon, label, value, subtitle, color }: MetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        purple: 'bg-purple-100 text-purple-600',
        red: 'bg-red-100 text-red-600',
    };

    return (
        <Card className="p-6">
            <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </Card>
    );
}

interface FunnelStepProps {
    label: string;
    value: number;
    percentage: number;
}

function FunnelStep({ label, value, percentage }: FunnelStepProps) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm text-gray-600">{value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
