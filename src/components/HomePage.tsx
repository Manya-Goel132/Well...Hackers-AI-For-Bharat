import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
    MessageCircle,
    BookOpen,
    Activity,
    PlayCircle,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Heart,
    Clock,
    TrendingUp,
    Zap
} from 'lucide-react';
import type { Screen } from '../types';
import DashboardStats from './dashboard/DashboardStats';
import { DailyWisdom } from './home/DailyWisdom';
import { RecommendedResources } from './home/RecommendedResources';
import { TrustShowcase } from './home/TrustShowcase';
import { useAuth } from './auth/AuthProvider';
import { toast } from 'sonner';

interface HomePageProps {
    navigateTo?: (screen: Screen) => void;
}

export default function HomePage({ navigateTo }: HomePageProps = {}) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const handleNav = (path: string) => {
        if (navigateTo) navigateTo(path as any);
        else navigate(path);
    };

    return (
        <div className="flex flex-col min-h-screen bg-cream font-sans text-moss-900 pb-20">

            {/* 1. HERO SECTION */}
            <section className="relative overflow-hidden pt-8 pb-12 md:pt-16 md:pb-24 px-4 bg-cream">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-soft-blue/50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/4" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sage-100/60 rounded-full blur-3xl -z-10 -translate-x-1/4 translate-y-1/4" />

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Left: Content */}
                    <div className="space-y-6 text-center md:text-left z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sage-200 text-sage-800 text-xs font-semibold tracking-wide uppercase shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            AI-Powered Mental Health
                        </div>

                        <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight text-moss-900">
                            {t('home.greeting') || "Your Safe Space for Mental Wellness"}
                        </h1>

                        <p className="text-lg text-moss-700 leading-relaxed max-w-lg mx-auto md:mx-0">
                            {t('home.subtitle') || "Instant, anonymous support derived from clinical protocols. Chat with our AI companion anytime, anywhere."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                            <Button
                                size="lg"
                                onClick={() => {
                                    if (!currentUser) {
                                        toast.info("Please log in or sign up to use the Chat feature.");
                                        handleNav('/auth');
                                        return;
                                    }
                                    handleNav('/chat');
                                }}
                                className="h-14 px-8 text-lg rounded-full bg-moss-900 hover:bg-moss-800 text-white shadow-soft transition-all hover:scale-105"
                            >
                                <MessageCircle className="mr-2 h-5 w-5" />
                                {t('home.chat_button')}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                    if (!currentUser) {
                                        toast.info("Please log in or sign up to create your Personalized Plan.");
                                        handleNav('/auth');
                                        return;
                                    }
                                    handleNav('/onboarding');
                                }}
                                className="h-14 px-8 text-lg rounded-full border-moss-200 text-moss-800 hover:bg-white hover:text-emerald-700 transition-colors bg-white/50 backdrop-blur-sm"
                            >
                                Personalized Plan
                            </Button>
                        </div>

                        <div className="flex items-center gap-6 justify-center md:justify-start text-sm text-moss-600 pt-4">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white"></div>
                                <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white"></div>
                                <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-700">+2k</div>
                            </div>
                            <span className="font-medium">Joined this month</span>
                        </div>
                    </div>

                    {/* Right: Rich App Preview Mockup */}
                    <div className="relative group perspective-1000 hidden md:block">
                        <div className="relative z-10 bg-white rounded-[2.5rem] p-6 shadow-2xl border border-white/50 transform transition-transform group-hover:rotate-1">
                            <div className="bg-gradient-to-br from-soft-blue via-soft-purple to-emerald-50 rounded-3xl p-6 aspect-[3/4] flex flex-col justify-between overflow-hidden relative">
                                {/* Ambient Background Effects */}
                                <div className="absolute top-10 right-10 w-32 h-32 bg-white/30 rounded-full blur-3xl animate-pulse-slow" />
                                <div className="absolute bottom-10 left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl animate-pulse-slow" />

                                {/* App Header */}
                                <div className="relative z-10 flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm">ManoSathi AI</h4>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-white/80 text-xs">Active now</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                                        <Heart className="w-4 h-4 text-white fill-white" />
                                        <span className="text-white text-xs font-bold">24/7</span>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 space-y-3 overflow-hidden">
                                    {/* AI Message */}
                                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-sm max-w-[85%] animate-in slide-in-from-left duration-700">
                                        <p className="text-moss-900 text-sm font-medium mb-2">
                                            How are you feeling today? 😊
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-moss-600">
                                            <Clock className="w-3 h-3" />
                                            <span>Just now</span>
                                        </div>
                                    </div>

                                    {/* User Response */}
                                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 shadow-md max-w-[80%] ml-auto animate-in slide-in-from-right duration-700 delay-150">
                                        <p className="text-white text-sm font-medium">
                                            Feeling much better! 🌟
                                        </p>
                                    </div>

                                    {/* AI Follow-up */}
                                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-sm max-w-[85%] animate-in slide-in-from-left duration-700 delay-300">
                                        <p className="text-moss-900 text-sm font-medium mb-3">
                                            That's wonderful to hear! 💚
                                        </p>
                                        <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs text-emerald-700 font-semibold">5-day streak!</span>
                                        </div>
                                    </div>

                                    {/* Typing Indicator */}
                                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-sm w-16 animate-in fade-in duration-700 delay-500">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Stats Bar */}
                                <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-moss-900 uppercase tracking-wide">Today's Wellness</span>
                                        <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-2 text-center">
                                            <p className="text-white text-xl font-bold">8.2</p>
                                            <p className="text-white/80 text-[10px] font-medium">Mood</p>
                                        </div>
                                        <div className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-2 text-center">
                                            <p className="text-white text-xl font-bold">12m</p>
                                            <p className="text-white/80 text-[10px] font-medium">Breathe</p>
                                        </div>
                                        <div className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-2 text-center">
                                            <p className="text-white text-xl font-bold">3</p>
                                            <p className="text-white/80 text-[10px] font-medium">Entries</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-sage-200 rounded-[3rem] -z-10 rotate-3 scale-105 opacity-50" />
                    </div>
                </div>
            </section>


            {/* 2. TRUST SHOWCASE (Parallax & Images) */}
            <TrustShowcase />

            {/* 3. DAILY WISDOM (Dark Section with Waves) */}
            <DailyWisdom />

            {/* 4. YOUR PROGRESS (White Section) */}
            <section className="bg-white pt-12 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12 md:text-center">
                        <h2 className="text-3xl font-display font-bold text-moss-900">Your Wellness Overview</h2>
                        <p className="text-moss-600 mt-2">Track your mood and sleep patterns.</p>
                    </div>
                    <DashboardStats />
                </div>
            </section>

            {/* 5. EXPLORE CARE (Floating Island Style) */}
            <div className="px-4 bg-white pb-20">
                <div className="max-w-7xl mx-auto bg-sage-50 rounded-[3rem] py-16 px-6 md:px-16 overflow-hidden relative">
                    {/* Decorative Shapes inside Island */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

                    <div className="relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-moss-900 mb-4">
                                Holistic Care Ecosystem
                            </h2>
                            <p className="text-moss-600 max-w-2xl mx-auto">
                                Comprehensive tools designed to support your mental wellness journey from every angle.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Journal Card */}
                            <Card
                                onClick={() => {
                                    if (!currentUser) {
                                        toast.info("Please log in or sign up to use the Journal feature.");
                                        handleNav('/auth');
                                        return;
                                    }
                                    handleNav('/journal');
                                }}
                                className="cursor-pointer group hover:-translate-y-2 transition-all duration-300 border-none shadow-soft hover:shadow-xl bg-white rounded-3xl"
                            >
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-moss-900 mb-2">{t('home.card_journal')}</h3>
                                    <p className="text-moss-600 text-sm mb-6 leading-relaxed">
                                        Express your thoughts securely. Analysis provided for mood tracking.
                                    </p>
                                    <div className="flex items-center text-emerald-600 text-sm font-bold group-hover:underline">
                                        Start Writing <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Breathe Card */}
                            <Card
                                onClick={() => handleNav('/calm-down')}
                                className="cursor-pointer group hover:-translate-y-2 transition-all duration-300 border-none shadow-soft hover:shadow-xl bg-white rounded-3xl"
                            >
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                        <PlayCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-moss-900 mb-2">{t('home.card_breathe')}</h3>
                                    <p className="text-moss-600 text-sm mb-6 leading-relaxed">
                                        Guided exercises to reduce anxiety and regain focus instantly.
                                    </p>
                                    <div className="flex items-center text-blue-600 text-sm font-bold group-hover:underline">
                                        Start Session <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Check-in Card */}
                            <Card
                                onClick={() => handleNav('/quiz')}
                                className="cursor-pointer group hover:-translate-y-2 transition-all duration-300 border-none shadow-soft hover:shadow-xl bg-white rounded-3xl"
                            >
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-moss-900 mb-2">{t('home.card_checkin')}</h3>
                                    <p className="text-moss-600 text-sm mb-6 leading-relaxed">
                                        Track your mood and symptom changes over time with clinical assessments.
                                    </p>
                                    <div className="flex items-center text-purple-600 text-sm font-bold group-hover:underline">
                                        Check In <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. RECOMMENDED RESOURCES */}
            <RecommendedResources />

            {/* 7. CLINICAL VALIDATION */}
            <section className="bg-sage-50 border-t border-sage-200 py-16 px-4">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">
                    <div className="flex-1 md:text-right">
                        <h2 className="text-2xl font-display font-bold text-moss-900 mb-3">
                            Clinically Validated Protocol
                        </h2>
                        <p className="text-moss-700 mb-4 text-lg">
                            "ManoSathi's AI responses are rigorously reviewed to ensure safety, empathy, and adherence to therapeutic guidelines. We prioritize your mental safety above all."
                        </p>
                        <div className="flex flex-col md:items-end gap-1">
                            <span className="font-bold text-moss-900 text-lg">Dr. Priti Gupta</span>
                            <span className="text-sm text-moss-600">M.S. Psychology & Lead Clinical Advisor</span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => handleNav('/clinical-validation')}
                            className="mt-6 text-emerald-700 hover:text-emerald-800 p-0 h-auto font-semibold hover:bg-transparent text-base"
                        >
                            View Validation Report &rarr;
                        </Button>
                    </div>

                    <div className="flex-shrink-0 relative group cursor-pointer hover:scale-105 transition-transform duration-500">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                                <ShieldCheck className="w-20 h-20 text-emerald-600 opacity-20" />
                                <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-emerald-700 text-center text-sm p-4 leading-tight">
                                    Clinical<br />Advisory<br />Board
                                </span>
                            </div>
                        </div>
                        <div className="absolute 0 bottom-2 right-2 bg-white rounded-full p-3 shadow-md border border-sage-100">
                            <CheckCircle2 className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
