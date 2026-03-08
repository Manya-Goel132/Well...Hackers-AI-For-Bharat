import React from 'react';
import { Shield, Heart, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ModeSwitcherProps {
    currentMode: 'standard' | 'pro';
    onModeChange: (mode: 'standard' | 'pro') => void;
    proModeAvailable: boolean;
}

export function ModeSwitcher({ currentMode, onModeChange, proModeAvailable }: ModeSwitcherProps) {
    return (
        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Standard Mode Button */}
            <Button
                variant={currentMode === 'standard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('standard')}
                className={`flex items-center gap-2 ${currentMode === 'standard'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'hover:bg-slate-100'
                    }`}
            >
                <Heart className="w-4 h-4" />
                <span className="font-medium">Standard</span>
            </Button>

            {/* Pro Mode Button - DISABLED FOR DEPLOYMENT */}
            {/* Pro Mode Button */}
            <Button
                variant={currentMode === 'pro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('pro')}
                disabled={!proModeAvailable}
                className={`flex items-center gap-2 ${currentMode === 'pro'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'hover:bg-slate-100'
                    }`}
                title="AI Companion Pro - Clinical Mode"
            >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Pro</span>
            </Button>

            {/* Info Icon with Tooltip */}
            <div className="ml-auto group relative">
                <Info className="w-4 h-4 text-slate-500 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="space-y-2">
                        <div>
                            <strong className="text-blue-400">Standard Mode:</strong>
                            <p className="text-slate-200">Emotional support, coping strategies, and general wellness guidance.</p>
                        </div>
                        <div>
                            <strong className="text-purple-400">Pro Mode:</strong>
                            <p className="text-slate-200">Clinical assessments (PHQ-9, GAD-7), diagnostic insights, and evidence-based therapy recommendations.</p>
                        </div>
                    </div>
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
                </div>
            </div>
        </div>
    );
}

interface ModeIndicatorProps {
    mode: 'standard' | 'pro';
}

export function ModeIndicator({ mode }: ModeIndicatorProps) {
    if (mode === 'standard') {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Standard Mode</span>
                <span className="text-xs text-blue-600 dark:text-blue-400">• Emotional Support</span>
            </div>
        );
    }

    return (
        <Card className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">AI Companion Pro</span>
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded">CLINICAL</span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                        Clinical assessments, diagnostic insights, and evidence-based therapy.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                        <span>⚠️ Not a substitute for professional care</span>
                        <span>•</span>
                        <span>📞 Emergency: 14416</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

interface ProModeDisclaimerProps {
    onDismiss: () => void;
}

export function ProModeDisclaimer({ onDismiss }: ProModeDisclaimerProps) {
    return (
        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 mb-4">
            <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        You're now in AI Companion Pro
                    </h4>
                    <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                        <p>
                            <strong>What Pro Mode offers:</strong> Clinical assessments (PHQ-9, GAD-7), diagnostic insights,
                            evidence-based therapy recommendations, and more structured mental health support.
                        </p>
                        <div className="p-2 bg-white dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700">
                            <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">⚠️ Important Reminders:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>This is NOT a substitute for professional medical care</li>
                                <li>I cannot prescribe medications</li>
                                <li>For emergencies: Call 14416 (Tele-MANAS) or 102/108</li>
                                <li>Always consult licensed professionals for diagnosis and treatment</li>
                            </ul>
                        </div>
                    </div>
                    <Button
                        onClick={onDismiss}
                        size="sm"
                        className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        I Understand
                    </Button>
                </div>
            </div>
        </Card>
    );
}
