import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { useAuth } from '../auth/AuthProvider';
import { awsService } from '../../services/awsService';
import { Loader2, TrendingUp, TrendingDown, Minus, Brain, Moon, Zap, Activity, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function DashboardStats() {
    const { currentUser } = useAuth();
    const { t, i18n } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [translatingIds, setTranslatingIds] = useState<Record<string, boolean>>({});

    const translateHistoryItem = async (checkIn: any) => {
        if (!checkIn.aiAnalysis && (!checkIn.aiAnalysisVariants || Object.keys(checkIn.aiAnalysisVariants).length === 0)) {
            return; // Nothing to translate
        }

        const currentLangCode = (i18n.language || 'en').split('-')[0];
        const variants = checkIn.aiAnalysisVariants || {};

        // If already has language, do nothing
        if (variants[currentLangCode]) return;

        setTranslatingIds(prev => ({ ...prev, [checkIn.id]: true }));

        try {
            const targetLanguage = languageMap[currentLangCode] || 'English';
            // Source text: prefer English variant, or any available
            const sourceText = checkIn.aiAnalysis || Object.values(variants)[0] as string;

            if (!sourceText) return;

            const response = await awsService.getChatResponse(
                `Translate the following mental health analysis to ${targetLanguage}. Keep the tone warm and supportive. Do not add any new advice, just translate:\n\n"${sourceText}"`,
                currentUser!.uid,
                [],
                targetLanguage
            );

            // Update Firestore
            const updates = {
                aiAnalysisVariants: {
                    ...variants,
                    [currentLangCode]: response
                }
            };
            await awsService.updateCheckIn(currentUser!.uid, checkIn.id, updates);

            // Update Local State
            const updatedCheckins = stats.checkins.map((c: any) =>
                c.id === checkIn.id ? { ...c, ...updates } : c
            );
            setStats({ ...stats, checkins: updatedCheckins });

        } catch (error) {
            console.error("Translation error:", error);
            // toast.error("Failed to translate history item."); // Silent fail to avoid spam
        } finally {
            setTranslatingIds(prev => ({ ...prev, [checkIn.id]: false }));
        }
    };

    // Auto-translate visible history items when modal is open
    useEffect(() => {
        if (isHistoryOpen && stats && stats.checkins) {
            stats.checkins.forEach((checkIn: any) => {
                translateHistoryItem(checkIn);
            });
        }
    }, [isHistoryOpen, i18n.language, stats]);

    useEffect(() => {
        if (currentUser) {
            loadStats();
        } else {
            setIsLoading(false);
        }
    }, [currentUser]);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Check-ins
            const checkins = await awsService.getCheckInHistory(currentUser!.uid, 7);

            // 2. Fetch recent Journals (for context)
            const journals = await awsService.getJournalEntries(currentUser!.uid, 5);

            // 3. Process Data
            if (checkins.length > 0) {
                const latestCheckIn = checkins[0];

                // If the latest check-in already has an analysis, load it directly
                if (latestCheckIn.aiAnalysis) {
                    setAiInsight(latestCheckIn.aiAnalysis);
                } else {
                    setAiInsight(null); // Allow generation
                }

                const totalMood = checkins.reduce((acc, c) => acc + (c.mood || 5), 0);
                const avgMood = (totalMood / checkins.length).toFixed(1);

                const totalSleep = checkins.reduce((acc, c) => acc + (c.sleepQuality || 5), 0);
                const avgSleep = (totalSleep / checkins.length).toFixed(1);

                const totalAnxiety = checkins.reduce((acc, c) => acc + (c.anxietyLevel || 5), 0);
                const avgAnxiety = (totalAnxiety / checkins.length).toFixed(1);

                // Collect Factors
                const factorCounts: Record<string, number> = {};
                checkins.forEach(c => {
                    if (c.factors) {
                        c.factors.forEach((f: string) => {
                            factorCounts[f] = (factorCounts[f] || 0) + 1;
                        });
                    }
                });
                const topFactors = Object.entries(factorCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([f]) => f);

                setStats({
                    checkins, // Array of last 7 checkins
                    latestId: latestCheckIn.id, // Store ID for updating
                    avgMood,
                    avgSleep,
                    avgAnxiety,
                    topFactors,
                    journalCount: journals.length
                });
            } else {
                setStats(null); // No data yet
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Map language codes to English names for the AI prompt
    const languageMap: Record<string, string> = {
        'en': 'English',
        'hi': 'Hindi',
        'mr': 'Marathi',
        'bn': 'Bengali',
        'te': 'Telugu',
        'ta': 'Tamil',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'pa': 'Punjabi',
        'or': 'Odia',
        'as': 'Assamese',
        'ur': 'Urdu',
        'sa': 'Sanskrit'
    };

    const generateAIReport = async (forceLanguage?: string) => {
        if (!stats || !currentUser) return;
        setIsGenerating(true);

        try {
            const currentLangCode = forceLanguage || (i18n.language || 'en').split('-')[0];
            const targetLanguage = languageMap[currentLangCode] || 'English';

            // Find previous analysis for context (from 2nd checkin if exists)
            const previousAnalysis = stats.checkins.length > 1 ? stats.checkins[1].aiAnalysis : null;

            // Construct a prompt context
            const context = `
                User's last 7 days stats:
                - Average Mood: ${stats.avgMood}/10
                - Sleep Quality: ${stats.avgSleep}/10
                - Anxiety Level: ${stats.avgAnxiety}/10
                - Top stressors/factors: ${stats.topFactors.join(', ')}
                
                ${previousAnalysis ? `Previous Analysis (for comparison): "${previousAnalysis}"` : ''}

                **CRITICAL INSTRUCTION FOR CONTRADICTION DETECTION:**
                If you see a contradiction (e.g., High Mood [>7] but High Anxiety [>7], OR High Mood but "Sadness" listed in factors), you MUST:
                1. Point it out gently in the first sentence.
                2. Explain what that might mean.
                
                Your Output MUST be in this specific format (JSON-like text):
                SCORE: [Calculate a 'Wellness Score' from 1-10 based on ALL factors combined. Be honest.]
                ANALYSIS: [Your warm, empathetic, 2-3 sentence analysis in ${targetLanguage}]
                
                Example:
                SCORE: 7.5
                ANALYSIS: Your analysis text here...
                
                IMPORTANT: The 'ANALYSIS' part MUST be in ${targetLanguage} language.
            `;

            // Reuse the chat AI service to get a "response"
            const rawResponse = await awsService.getChatResponse(
                `Generate my weekly mental health summary based on my stats in ${targetLanguage}.`,
                currentUser.uid,
                [{ role: 'user', content: context }],
                targetLanguage
            );

            // Parse response (Extract Score and Analysis)
            let finalAnalysis = rawResponse;
            let aiScore: number | null = null;

            // Regex to find "SCORE: 8.5" or similar
            const scoreMatch = rawResponse.match(/SCORE:\s*([\d.]+)/i);
            const analysisMatch = rawResponse.match(/ANALYSIS:\s*([\s\S]+)/i);

            if (scoreMatch && analysisMatch) {
                aiScore = parseFloat(scoreMatch[1]);
                finalAnalysis = analysisMatch[1].trim();
            } else if (scoreMatch) {
                aiScore = parseFloat(scoreMatch[1]);
                finalAnalysis = rawResponse.replace(/SCORE:\s*[\d.]+/i, '').trim();
            }

            setAiInsight(finalAnalysis);

            // If explicit AI score is provided, we could use it, but currently we calculate it.
            // We will save it in 'aiWellnessScore' just in case.

            // Save analysis to the latest check-in with multi-language support
            if (stats.latestId) {
                const latestCheckIn = stats.checkins[0];
                const existingVariants = latestCheckIn.aiAnalysisVariants || {};

                const updates = {
                    aiAnalysis: finalAnalysis, // Keep latest as primary for fallback
                    aiAnalysisLanguage: currentLangCode,
                    aiWellnessScore: aiScore, // Save the AI specific score
                    aiAnalysisVariants: {
                        ...existingVariants,
                        [currentLangCode]: finalAnalysis
                    }
                };

                await awsService.updateCheckIn(currentUser.uid, stats.latestId, updates);

                // Update local state to reflect changes immediately
                const updatedCheckins = [...stats.checkins];
                updatedCheckins[0] = { ...updatedCheckins[0], ...updates };
                setStats({ ...stats, checkins: updatedCheckins });

                toast.success(`Analysis generated in ${targetLanguage}`);
            }

        } catch (error) {
            console.error("AI Generation error:", error);
            toast.error("Failed to generate insight.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Effect to handle language changes
    useEffect(() => {
        let timer: any;

        if (stats && stats.checkins && stats.checkins.length > 0) {
            const currentLangCode = (i18n.language || 'en').split('-')[0];
            const latestCheckIn = stats.checkins[0];

            // Check if we have a cached version for this language
            const variants = latestCheckIn.aiAnalysisVariants || {};

            if (variants[currentLangCode]) {
                // Found cached version, use it
                if (aiInsight !== variants[currentLangCode]) {
                    setAiInsight(variants[currentLangCode]);
                }
            } else {
                // No cached version for this language
                const hasAnyAnalysis = latestCheckIn.aiAnalysis || Object.keys(variants).length > 0;

                if (hasAnyAnalysis && !isGenerating) {
                    // Auto-generate for the new language
                    timer = setTimeout(() => {
                        generateAIReport(currentLangCode);
                    }, 500);
                } else {
                    setAiInsight(null); // Reset so "Analyze" button shows
                }
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [i18n.language, stats, isGenerating]);

    if (isLoading) {
        return <div className="h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
    }

    if (!stats) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700">No Stats Yet</h3>
                <p className="text-slate-500 text-sm mb-4">Complete your first Check-in to see your wellness insights here.</p>
            </div>
        );
    }

    // --- Chart Helpers ---
    // Helper: Calculate Wellness Score (Composite of Mood, Sleep, Anxiety)
    // Returns a composite score (1-10) based on all factors + AI Score if available
    const calculateWellnessScore = (checkIn: any) => {
        // 1. If AI has explicitly scored this (future proof), use it.
        if (checkIn.aiWellnessScore) return Number(checkIn.aiWellnessScore);

        // 2. Deterministic Formula (Fallback)
        const mood = checkIn.mood || 5;
        const sleep = checkIn.sleepQuality || 5; // Higher is better
        const anxiety = checkIn.anxietyLevel || 5; // Lower is better

        // Invert anxiety (10->1, 1->10)
        const anxietyScore = 11 - anxiety;

        // Weighting: Anxiety (40%) + Sleep (30%) + Mood (30%)
        // High Anxiety drastically lowers the score even if Mood is high (Contradiction handling)
        let weightedScore = (mood * 0.3) + (sleep * 0.3) + (anxietyScore * 0.4);

        // Factor Penalty
        const negativeFactors = ['sadness', 'grief', 'loneliness', 'depressed', 'stress', 'anxiety', 'tired', 'exhausted'];
        const hasNegative = (checkIn.factors || []).some((f: any) => negativeFactors.includes(f.toLowerCase()));
        if (hasNegative) weightedScore -= 0.5;

        return Number(Math.max(1, Math.min(10, weightedScore)).toFixed(1));
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-xs space-y-1 animate-in fade-in zoom-in-95 duration-200">
                    <p className="font-bold text-slate-800 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-500">Wellness:</span>
                        <span className="font-bold text-emerald-600">{data.score}/10</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-slate-50 mt-1">
                        <span className="text-slate-400">Mood:</span> <span>{data.mood}/10</span>
                        <span className="text-slate-400">Sleep:</span> <span>{data.sleepQuality}/10</span>
                        <span className="text-slate-400">Anxiety:</span> <span>{data.anxietyLevel}/10</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* 1. Mood Trend */}
                <Card className="col-span-1 md:col-span-2 border-slate-200 shadow-sm overflow-hidden relative bg-white h-[320px] flex flex-col">
                    <CardHeader className="pb-0 px-4 md:px-6 pt-4 md:pt-6 flex flex-row items-center justify-between z-10 relative shrink-0">
                        <div>
                            <CardTitle className="text-base md:text-lg flex items-center gap-2 text-slate-800">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                Wellness Score
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs md:text-sm">
                                Your wellness journey over time
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end hidden md:flex">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Latest</span>
                                <span className={`text-lg font-bold text-slate-700 leading-none`}>
                                    {stats.checkins[0] ? calculateWellnessScore(stats.checkins[0]) : '-'}<span className="text-sm text-slate-400 font-normal">/10</span>
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsHistoryOpen(true)}
                                className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200 text-xs transition-colors"
                            >
                                History
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 w-full min-h-0">
                        <div className="w-full h-full relative">
                            {(() => {
                                const reversedData = [...stats.checkins].reverse();
                                const chartData = reversedData.map((c: any) => ({
                                    ...c,
                                    score: calculateWellnessScore(c),
                                    date: c.timestamp ? new Date(c.timestamp.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'
                                }));

                                if (chartData.length === 0) return (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Activity className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">No data available yet</p>
                                    </div>
                                );

                                return (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={chartData}
                                            margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                dy={10}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis
                                                domain={[0, 10]}
                                                hide={false}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                tickCount={5}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorScore)"
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Key Metrics & Insight */}
                <div className="space-y-4">
                    <Card className="border-slate-200 shadow-sm bg-slate-50">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Moon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Sleep</span>
                                </div>
                                <span className={`text-lg font-bold ${Number(stats.avgSleep) < 5 ? 'text-amber-500' : 'text-slate-700'}`}>
                                    {stats.avgSleep}/10
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${Number(stats.avgSleep) * 10}%` }}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-sm font-medium">Anxiety</span>
                                </div>
                                <span className={`text-lg font-bold ${Number(stats.avgAnxiety) > 6 ? 'text-red-500' : 'text-slate-700'}`}>
                                    {stats.avgAnxiety}/10
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${Number(stats.avgAnxiety) * 10}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                        <CardContent className="pt-6">
                            {!aiInsight ? (
                                <div className="text-center space-y-2">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Brain className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h4 className="font-medium text-slate-800">AI Daily Insight</h4>
                                    <p className="text-xs text-slate-500 mb-3">Analyze your recent patterns</p>
                                    <Button
                                        onClick={() => generateAIReport()}
                                        disabled={isGenerating}
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-emerald-200 hover:bg-emerald-100 text-emerald-700"
                                    >
                                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />}
                                        Analyze
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm mb-1">
                                        <Brain className="w-4 h-4" />
                                        <span>Analysis</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">
                                        "{aiInsight}"
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Top Factors */}
            {stats.topFactors.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider py-1">Top Factors:</span>
                    {stats.topFactors.map((f: string) => (
                        <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {f}
                        </span>
                    ))}
                </div>
            )}

            {/* History Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title="Your Wellness History"
                className="max-h-[80vh]"
            >
                <div className="space-y-4">
                    {stats.checkins.map((checkIn: any) => {
                        const currentLangCode = (i18n.language || 'en').split('-')[0];
                        const variants = checkIn.aiAnalysisVariants || {};
                        const displayAnalysis = variants[currentLangCode] || checkIn.aiAnalysis;
                        const isTranslating = translatingIds[checkIn.id];

                        // Date Formatting
                        let dateLabel = "Unknown Date";
                        if (checkIn.timestamp) {
                            dateLabel = new Date(checkIn.timestamp.seconds * 1000).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            });
                        }

                        return (
                            <div key={checkIn.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700">{dateLabel}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-xs text-slate-500" title="Mood">
                                            <Activity className="w-3 h-3" /> {checkIn.mood}/10
                                        </div>
                                    </div>
                                </div>

                                {isTranslating ? (
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                                    </div>
                                ) : displayAnalysis ? (
                                    <div className="bg-white p-3 rounded border border-slate-100 text-sm text-slate-600 italic">
                                        "{displayAnalysis}"
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 italic">
                                        No analysis recorded.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}
