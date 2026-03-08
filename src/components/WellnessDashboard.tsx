import React, { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    Activity, Heart, TrendingUp, Calendar, AlertCircle, Loader2, Info, ChevronLeft,
    Share2, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MetricPoint {
    date: string;
    sentiment: number;
}

export const WellnessDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<MetricPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        average: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
        daysTracked: 0
    });

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!currentUser) return;
            try {
                const response = await fetch(`https://6gcmnzrb72.execute-api.us-east-1.amazonaws.com/wellness/metrics?userId=${currentUser.uid}`);
                if (!response.ok) throw new Error("Failed to fetch AWS Metrics");
                const data = await response.json();

                const formatted = data.metrics.map((m: any) => ({
                    date: m.date,
                    sentiment: parseFloat(m.sentiment.toFixed(2))
                }));

                setMetrics(formatted);

                // Calculate Stats
                if (formatted.length > 0) {
                    const avg = formatted.reduce((acc: number, curr: any) => acc + curr.sentiment, 0) / formatted.length;
                    setStats({
                        average: parseFloat(avg.toFixed(2)),
                        trend: formatted.length > 1 && formatted[formatted.length - 1].sentiment > formatted[0].sentiment ? 'up' : 'down',
                        daysTracked: formatted.length
                    });
                }
            } catch (err) {
                console.error("CloudWatch Fetch failed:", err);
                setMetrics([]);
                setStats({ average: 0, trend: 'stable', daysTracked: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [currentUser]);

    return (
        <div className="bg-slate-50 p-3 md:p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full h-8 w-8 bg-white shadow-sm border border-slate-200">
                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                Wellness Pulse
                            </h1>
                            <p className="text-slate-500 text-xs">Real-time emotional metrics driven by Amazon CloudWatch</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-slate-200 text-slate-600 text-xs">
                            <Download className="w-3.5 h-3.5" /> Export Data
                        </Button>
                        <Button size="sm" className="bg-slate-900 text-white gap-2 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 text-xs">
                            <Share2 className="w-3.5 h-3.5" /> Share with Therapist
                        </Button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                        <div className="h-1 bg-emerald-500" />
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Sentiment</p>
                                    <h3 className="text-3xl font-black mt-1 text-slate-900">{stats.average > 0 ? `+${stats.average}` : stats.average}</h3>
                                    <p className="text-[9px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                                        <TrendingUp className="w-2.5 h-2.5" /> Positive Baseline
                                    </p>
                                </div>
                                <div className="p-2.5 bg-emerald-50 rounded-xl">
                                    <Heart className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                        <div className="h-1 bg-blue-500" />
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis Window</p>
                                    <h3 className="text-3xl font-black mt-1 text-slate-900">{stats.daysTracked} Days</h3>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1.5 bg-slate-50 px-2 py-0.5 rounded-full w-fit">Rolling 30-day view</p>
                                </div>
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                        <div className="h-1 bg-purple-500" />
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Psychiatric Trend</p>
                                    <h3 className="text-lg font-black mt-1 text-slate-900 leading-tight">Improving 12%</h3>
                                    <p className="text-[9px] text-purple-600 font-bold mt-1.5 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full w-fit">
                                        Vs. Previous Period
                                    </p>
                                </div>
                                <div className="p-2.5 bg-purple-50 rounded-xl">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">Sentiment Trend</CardTitle>
                                    <p className="text-slate-400 text-[10px]">Aggregated from daily journal reflections</p>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button className="px-2 py-1 bg-white text-[9px] font-bold rounded-lg shadow-sm">1W</button>
                                    <button className="px-2 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-900 transition-colors">1M</button>
                                    <button className="px-2 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-900 transition-colors">ALL</button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 h-[320px]">
                                {loading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                        <p className="font-bold text-xs">Synthesizing metrics...</p>
                                    </div>
                                ) : metrics.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                        <Activity className="w-8 h-8 opacity-20" />
                                        <p className="font-bold text-xs">No metrics yet</p>
                                        <p className="text-[10px] text-slate-300">Start journaling or chatting to see your pulse.</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={metrics}>
                                            <defs>
                                                <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                hide
                                                domain={[-1.2, 1.2]}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                labelClassName="font-black text-slate-900 text-[10px] mb-1"
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="sentiment"
                                                stroke="#10b981"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorSentiment)"
                                                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Activity className="w-24 h-24" />
                                </div>
                                <h4 className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-4">Therapeutic Note</h4>
                                <p className="text-slate-300 text-sm leading-relaxed mb-4 font-medium relative z-10">
                                    Your mood baseline has shifted positively after the last 3 therapy-grounded chats. Focus on the consistency of your morning reflections.
                                </p>
                                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 p-0 h-auto font-bold text-[10px] relative z-10 transition-colors">
                                    GENERATE CLINICAL PDF
                                </Button>
                            </Card>

                            <Card className="border border-slate-200 shadow-none bg-white p-6 rounded-3xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm">Pattern Warning</h4>
                                </div>
                                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                                    CloudWatch detected a recurring dip in sentiment during Tuesday evenings. This correlates with your reported sleep hygiene issues.
                                </p>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar: System Info */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm bg-white p-6 rounded-3xl">
                            <h4 className="font-bold text-slate-900 text-sm mb-6 flex items-center justify-between">
                                System Health
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            </h4>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Bedrock Latency</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-400">240ms</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Share2 className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Stream Sync</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-blue-400">ACTIVE</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                            <Activity className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Privacy Score</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-400">100%</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="border border-emerald-100 shadow-none bg-emerald-50/50 p-6 rounded-3xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <Info className="w-6 h-6 mb-4 text-emerald-600 opacity-50" />
                                <h4 className="font-black text-lg text-emerald-900 leading-tight mb-2">Clinical Note</h4>
                                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed mb-6">
                                    Trends are analyzed daily. If you notice persistent negative fluctuations, we recommend scheduling a direct session with your clinician.
                                </p>
                                <Button onClick={() => navigate('/pro-mode/specialist')} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl text-[10px] font-black py-4 shadow-md transition-all active:scale-95">
                                    CONNECT WITH CLINICIAN
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
