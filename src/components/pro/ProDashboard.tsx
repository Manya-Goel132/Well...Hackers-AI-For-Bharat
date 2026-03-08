import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Brain, Stethoscope, Activity, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { useWellness } from '../../contexts/WellnessContext';

export function ProDashboard() {
    const navigate = useNavigate();
    const wellness = useWellness();

    // Calculate dynamic Wellness Score (0-100)
    // 100 is best. PHQ9/GAD7 higher is worse. Journal higher is better.
    const calculateScore = () => {
        let score = 85; // Starting point if no data

        if (wellness.phq9Score !== null || wellness.gad7Score !== null || wellness.latestJournalScore !== null) {
            score = 100;

            // Subtract for depression (max 30 pts)
            if (wellness.phq9Score !== null) {
                score -= (wellness.phq9Score / 27) * 30;
            } else {
                score -= 5; // Penalty for missing data? No, let's keep it neutral
            }

            // Subtract for anxiety (max 30 pts)
            if (wellness.gad7Score !== null) {
                score -= (wellness.gad7Score / 21) * 30;
            }

            // Adjustment for journal (max 40 pts)
            if (wellness.latestJournalScore !== null) {
                // Latest sentiment is -1 to 1. 1.0 is +20, -1.0 is -20
                score += (wellness.latestJournalScore * 20);
                // Since base was 100, if journal is -1, it becomes 80.
            }
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    };

    const displayScore = calculateScore();

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-600 rounded-2xl shadow-lg hover:scale-105 transition-transform">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Companion Pro</h1>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200 uppercase tracking-wide">Clinical</span>
                            </div>
                            <p className="text-slate-500 font-medium">Advanced Diagnostic & Therapeutic Suite</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Companion
                    </Button>
                </div>

                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Welcome to the Clinical World</h2>
                        <p className="text-purple-100 mb-8 text-lg leading-relaxed">
                            access a world of deeper diagnostics, structured therapy pathways, and clinical-grade assessments designed to provide you with professional-level insights.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button onClick={() => navigate('/pro-mode/diagnostics')} className="bg-white text-purple-600 hover:bg-purple-50 font-bold border-0">
                                Start Full Assessment
                            </Button>
                            <Button onClick={() => navigate('/pro-mode/treatment')} variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                                View My Clinical Report
                            </Button>
                        </div>
                    </div>
                    {/* Abstract Shapes Decoration */}
                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.7C91.4,-34.4,98.1,-19.7,95.8,-6.6C93.5,6.4,82.1,17.7,71.7,28.1C61.3,38.5,51.9,48.1,41.2,55.8C30.5,63.5,18.6,69.4,5.4,72.4C-7.8,75.4,-22.3,75.5,-35.1,69.5C-47.9,63.5,-59,51.4,-67.6,38C-76.2,24.6,-82.3,9.8,-80.7,-4.3C-79.1,-18.4,-69.8,-31.8,-58.5,-42.2C-47.2,-52.6,-33.9,-60,-20.5,-67.7C-7.1,-75.4,6.4,-83.4,20.2,-83.1C34,-82.8,47.8,-79.8,44.7,-76.4Z" transform="translate(100 100)" />
                        </svg>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Clinical Assessment */}
                    <Card
                        className="p-6 hover:shadow-xl transition-all cursor-pointer border-t-4 border-t-purple-500 group bg-white"
                        onClick={() => navigate('/pro-mode/diagnostics')}
                    >
                        <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Activity className="w-7 h-7 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Diagnostics</h3>
                        <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                            Clinical-grade assessments (PHQ-9, GAD-7) to establish your mental health baseline.
                        </p>
                        <div className="flex items-center text-purple-600 text-sm font-semibold group-hover:gap-2 transition-all">
                            Take Assessment <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </Card>

                    {/* AI Companion Pro */}
                    <Card
                        className="p-6 hover:shadow-xl transition-all cursor-pointer border-t-4 border-t-blue-500 group bg-white"
                        onClick={() => navigate('/chat?mode=pro')}
                    >
                        <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Brain className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">AI Companion Pro</h3>
                        <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                            Chat with our advanced clinical AI to analyze symptoms and discuss your mental health.
                        </p>
                        <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
                            Start Clinical Chat <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </Card>

                    {/* Therapy Plan */}
                    <Card
                        className="p-6 hover:shadow-xl transition-all cursor-pointer border-t-4 border-t-emerald-500 group bg-white"
                        onClick={() => navigate('/pro-mode/treatment')}
                    >
                        <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Treatment Plan</h3>
                        <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                            Structured, evidence-based therapy modules (CBT, DBT) tailored to your diagnosis.
                        </p>
                        <div className="flex items-center text-emerald-600 text-sm font-semibold group-hover:gap-2 transition-all">
                            Open Plan <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </Card>

                    {/* Professional Help */}
                    <Card
                        className="p-6 hover:shadow-xl transition-all cursor-pointer border-t-4 border-t-amber-500 group bg-white"
                        onClick={() => navigate('/pro-mode/specialist')}
                    >
                        <div className="bg-amber-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Stethoscope className="w-7 h-7 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Specialist Care</h3>
                        <p className="text-slate-500 mb-4 text-sm leading-relaxed">
                            Connect with licensed therapists and psychiatrists for medication management.
                        </p>
                        <div className="flex items-center text-amber-600 text-sm font-semibold group-hover:gap-2 transition-all">
                            Find Doctor <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </Card>
                </div>

                {/* Status Bar */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h4 className="font-semibold text-slate-700 mb-4">Your Wellness Score</h4>
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-5xl font-bold text-slate-900">{displayScore}</span>
                            <span className="text-slate-400 font-medium mb-1">/ 100</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                            <div
                                className="bg-gradient-to-r from-emerald-400 to-green-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${displayScore}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500">Last updated: {wellness.latestJournalScore || wellness.phq9Score ? 'Real-time' : 'Simulated Baseline'}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <h4 className="font-semibold text-slate-700">Clinical Mode Active</h4>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            All interactions within Pro mode are encrypted with HIPAA-compliant standards and analyzed by our advanced clinical mental health model.
                        </p>
                        <div className="flex gap-2 text-xs">
                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">End-to-End Encrypted</span>
                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">Private Storage</span>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-12 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-xs md:text-sm text-slate-500 max-w-3xl mx-auto leading-relaxed">
                        <strong>Medical Disclaimer:</strong> AI Companion Pro provides support and information based on provided inputs. It is not a medical device and does not provide medical diagnosis or treatment.
                        If you are in crisis or experiencing a medical emergency, please call emergency services immediately (14416 or 112).
                    </p>
                </div>
            </div>
        </div>
    );
}


