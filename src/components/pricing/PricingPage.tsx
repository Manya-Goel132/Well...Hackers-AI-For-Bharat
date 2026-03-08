
import React from 'react';
import { Check, Info, Shield, Zap, Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="text-center py-16 px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                    Invest in Your <span className="text-emerald-600">Peace of Mind</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Professional-grade mental health support at a fraction of the cost of traditional therapy.
                    Accessible to everyone, everywhere.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Free Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col hover:shadow-md transition-shadow duration-300">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Free</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2">Essential tools for daily wellness.</p>
                        </div>
                        <div className="flex-1 space-y-4 mb-8">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Daily Mood Check-ins</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span><strong>10</strong> AI Messages / Day</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span><strong>10</strong> AI Journal Analysis / Month</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Community Access</span>
                                </li>
                            </ul>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                            Current Plan
                        </Button>
                    </div>

                    {/* Premium Plan (Best Value) */}
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-500 p-8 flex flex-col relative transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                            MOST POPULAR
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-emerald-600 mb-2">ManoSathi Premium</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-slate-900">₹399</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <p className="text-sm text-emerald-700 font-medium mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Daily therapy for ~₹13/day</p>
                        </div>
                        <div className="flex-1 space-y-4 mb-8">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span><strong>40</strong> AI Messages / Day</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span><strong>Unlimited</strong> AI Journal Analysis / Month</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Deep Psychological Insights</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Voice & Audio Support</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Personalized Growth Plans</span>
                                </li>
                            </ul>
                        </div>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                            onClick={() => navigate('/settings')}
                        >
                            Upgrade to Premium
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col hover:shadow-md transition-shadow duration-300">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">ManoSathi Pro</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-slate-900">₹599</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2">For deep healing & frequent support.</p>
                        </div>
                        <div className="flex-1 space-y-4 mb-8">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span><strong>80</strong> AI Messages / Day</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span><strong>Unlimited</strong> AI Journal Analysis / Month</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Priority Response Speed</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Advanced Trend Reports</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Crisis Alert System</span>
                                </li>
                            </ul>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/settings')}>
                            Select Pro
                        </Button>
                    </div>

                </div>

                {/* Trust Signals */}
                <div className="mt-20 text-center">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Trusted Privacy & Security</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-slate-400" />
                            <span className="font-bold text-slate-600">256-bit Encryption</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="w-6 h-6 text-slate-400" />
                            <span className="font-bold text-slate-600">HIPAA Compliant Standard</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Info className="w-6 h-6 text-slate-400" />
                            <span className="font-bold text-slate-600">Anonymous Usage</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
