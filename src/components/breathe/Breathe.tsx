
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Play, Pause, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { betaAnalyticsService } from '../../services/betaAnalyticsService';

const Breathe = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
    const [timeLeft, setTimeLeft] = useState(0);
    const [instruction, setInstruction] = useState('Ready?');
    const [cycles, setCycles] = useState(0);

    // Configuration for 4-7-8 breathing
    const BREATHE_CONFIG = {
        inhale: 4,
        hold: 7,
        exhale: 8,
    };

    useEffect(() => {
        let interval: any;

        if (isActive) {
            if (phase === 'idle') {
                // Start the cycle
                setPhase('inhale');
                setTimeLeft(BREATHE_CONFIG.inhale);
                setInstruction('Breathe In...');

                // Track usage
                if (currentUser) {
                    betaAnalyticsService.trackBreathingExercise(currentUser.uid)
                        .catch(err => console.error('Tracking error:', err));
                }
            }

            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Phase transition logic
                        handlePhaseTransition();
                        return 0; // Will be overwritten by handlePhaseTransition
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(interval);
            setPhase('idle');
            setInstruction('Ready?');
            setTimeLeft(0);
        }

        return () => clearInterval(interval);
    }, [isActive, phase]);

    const handlePhaseTransition = () => {
        switch (phase) {
            case 'inhale':
                setPhase('hold');
                setTimeLeft(BREATHE_CONFIG.hold);
                setInstruction('Hold...');
                break;
            case 'hold':
                setPhase('exhale');
                setTimeLeft(BREATHE_CONFIG.exhale);
                setInstruction('Breathe Out...');
                break;
            case 'exhale':
                setPhase('inhale');
                setTimeLeft(BREATHE_CONFIG.inhale);
                setInstruction('Breathe In...');
                setCycles(c => c + 1);
                break;
            default:
                break;
        }
    };

    const toggleSession = () => {
        setIsActive(!isActive);
    };

    const resetSession = () => {
        setIsActive(false);
        setCycles(0);
        setPhase('idle');
        setInstruction('Ready?');
    };

    // Calculate scale and opacity based on phase for animation
    const getCircleStyles = () => {
        let scale = 1;
        let opacity = 0.8;
        let duration = '0s';

        if (isActive) {
            switch (phase) {
                case 'inhale':
                    scale = 1.5;
                    opacity = 1;
                    duration = `${BREATHE_CONFIG.inhale}s`;
                    break;
                case 'hold':
                    scale = 1.5;
                    opacity = 1;
                    duration = '0s'; // Stay expanded
                    break;
                case 'exhale':
                    scale = 1;
                    opacity = 0.8;
                    duration = `${BREATHE_CONFIG.exhale}s`;
                    break;
            }
        }

        return {
            transform: `scale(${scale})`,
            opacity: opacity,
            transition: `all ${duration} ease-in-out`
        };
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 relative animate-in fade-in duration-700">
            {/* Close Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="text-center space-y-2 mb-12">
                <h1 className="text-3xl font-bold text-slate-800">Breathe</h1>
                <p className="text-slate-500">4-7-8 Relaxation Technique</p>
            </div>

            {/* Breathing Animation Circle */}
            <div className="relative flex items-center justify-center w-64 h-64 mb-16">
                {/* Background rings */}
                <div className="absolute w-full h-full rounded-full border-4 border-emerald-100 opacity-50" />
                <div className="absolute w-48 h-48 rounded-full border-4 border-emerald-50 opacity-50" />

                {/* Animated Circle */}
                <div
                    className="w-32 h-32 bg-gradient-to-br from-emerald-300 to-teal-400 rounded-full shadow-2xl shadow-emerald-200 flex items-center justify-center backdrop-blur-sm"
                    style={getCircleStyles()}
                >
                    <div className="text-white font-medium text-lg drop-shadow-md">
                        {isActive ? phase === 'hold' ? 'HOLD' : '' : 'START'}
                    </div>
                </div>

                {/* Text Instructions Overlay */}
                <div className="absolute -bottom-16 text-center w-full">
                    <div className="text-2xl font-bold text-slate-700 transition-all duration-300">
                        {instruction}
                    </div>
                    {isActive && (
                        <div className="text-sm text-slate-400 mt-1 font-mono">
                            {timeLeft}s
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center">
                <Button
                    onClick={toggleSession}
                    size="lg"
                    className={`rounded-full w-16 h-16 p-0 shadow-lg transition-all active:scale-95 ${isActive
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                        : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        }`}
                >
                    {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </Button>

                {cycles > 0 && (
                    <Button
                        onClick={resetSession}
                        variant="outline"
                        size="icon"
                        className="rounded-full w-12 h-12 border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {/* Stats */}
            {cycles > 0 && (
                <div className="mt-8 text-slate-400 text-sm">
                    Cycles completed: <span className="text-slate-600 font-semibold">{cycles}</span>
                </div>
            )}
        </div>
    );
};

export default Breathe;
