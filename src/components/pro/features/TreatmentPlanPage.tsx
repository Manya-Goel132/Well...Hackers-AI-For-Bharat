import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, FileText, CheckCircle2, Lock, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWellness } from '../../../contexts/WellnessContext';

const THERAPY_MODULES = [
    {
        id: 1,
        title: "Interoceptive Exposure for Panic",
        target: "Panic Disorder",
        desc: "Learn to experience panic-like sensations in a safe, controlled manner to reduce your fear of them.",
        rationale: "Based on the catastrophic misinterpretation model. Helps disconfirm feared consequences.",
        duration: "15 mins",
        unlocked: true,
        steps: [
            "Find a safe, comfortable place where you feel secure.",
            "Choose one exercise: Breathe rapidly (30s) or Run in place (1m).",
            "Notice the physical sensations without trying to control them.",
            "Rate your anxiety from 0-10. Notice the sensations are uncomfortable but not dangerous.",
            "Practice this daily, gradually increasing duration."
        ],
        badge: "CBT Focus"
    },
    {
        id: 2,
        title: "Worry Scheduling for GAD",
        target: "Generalized Anxiety Disorder",
        desc: "A technique to contain worry to specific times, reducing pervasive anxiety throughout your day.",
        rationale: "Addresses the cognitive avoidance model by actively processing worries at designated times.",
        duration: "20 mins",
        unlocked: true,
        steps: [
            "Set aside a specific 'Worry Time' each day - 15-20 minutes at the same time and place.",
            "When worries arise, write them down in a 'Worry List' and delay them.",
            "During worry time, review your list and actively problem-solve.",
            "After 20 minutes, stop worrying. Use a relaxation technique to transition out.",
            "Notice how many worries seem less important when reviewed later."
        ],
        badge: "Behavioral"
    },
    {
        id: 3,
        title: "Cognitive Restructuring for OCD",
        target: "Obsessive-Compulsive Disorder",
        desc: "Challenge obsessive beliefs such as inflated responsibility and overestimation of threat.",
        rationale: "Targets cognitive distortions that maintain compulsive rituals.",
        duration: "30 mins",
        unlocked: false,
        steps: [
            "Identify your obsessive thought (e.g., 'If I don't check, it will be my fault').",
            "Identify the underlying belief (e.g., Inflated responsibility).",
            "Challenge the belief: What is the hard evidence?",
            "Generate a balanced thought.",
            "Rate your belief in the original thought before and after."
        ],
        badge: "Cognitive"
    }
];

export default function TreatmentPlanPage() {
    const navigate = useNavigate();
    const [activeModuleLocal, setActiveModuleLocal] = useState<number | null>(null);
    const { setActiveTreatmentPlan } = useWellness();

    const setActiveModule = (id: number | null) => {
        setActiveModuleLocal(id);
        if (id !== null) {
            const mod = THERAPY_MODULES.find(m => m.id === id);
            if (mod) setActiveTreatmentPlan(mod.title);
        } else {
            setActiveTreatmentPlan(null);
        }
    };

    // We use activeModule to avoid changing too much code
    const activeModule = activeModuleLocal;

    const renderModuleList = () => (
        <>
            <Button variant="ghost" onClick={() => navigate('/pro-mode')} className="mb-8 -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pro Dashboard
            </Button>
            <div className="mb-10 bg-emerald-600 rounded-3xl p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <FileText />
                        Your Structured Treatment Plan
                    </h1>
                    <p className="text-emerald-50 text-lg opacity-90">Clinically validated therapy modules derived from IPS Guidelines 2020.</p>
                </div>
                <Lock className="w-32 h-32 absolute right-4 -top-4 opacity-10" />
            </div>

            <div className="space-y-6">
                {THERAPY_MODULES.map((mod) => (
                    <Card key={mod.id} className={`border-l-4 shadow-md ${mod.unlocked ? 'border-l-emerald-500' : 'border-l-slate-300 opacity-80 decoration-slate-300'}`}>
                        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-2 mb-2">
                                    {!mod.unlocked && <Lock className="w-4 h-4 text-slate-400" />}
                                    <h3 className="text-xl font-bold text-slate-800">{mod.title}</h3>
                                </div>
                                <p className="text-slate-600 mb-2">{mod.desc}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
                                    <span className={`px-2 py-0.5 rounded text-xs ${mod.unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>Target: {mod.target}</span>
                                    {mod.unlocked && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Available</span>}
                                    <span>•</span>
                                    <span>{mod.duration}</span>
                                </div>
                            </div>
                            {mod.unlocked ? (
                                <Button
                                    onClick={() => setActiveModule(mod.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto h-12 px-6 shadow-md"
                                >
                                    Start Module
                                </Button>
                            ) : (
                                <Button disabled variant="outline" className="w-full md:w-auto h-12 px-6">Locked</Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-800 font-medium">
                    <strong>Therapeutic Note:</strong> Do not engage in exposure-based exercises unless you feel safe and ready. Always consult your healthcare provider before attempting physical interoceptive modules.
                </p>
            </div>
        </>
    );

    const renderActiveModule = () => {
        const mod = THERAPY_MODULES.find(m => m.id === activeModule);
        if (!mod) return null;

        return (
            <div className="max-w-3xl mx-auto animate-in slide-in-from-right duration-500">
                <Button variant="ghost" onClick={() => setActiveModule(null)} className="mb-6 -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
                </Button>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 mt-10">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-2 block">{mod.badge}</span>
                            <h2 className="text-3xl font-display font-bold text-slate-900">{mod.title}</h2>
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-semibold">{mod.duration}</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
                        <h4 className="font-bold text-slate-800 mb-1">Clinical Rationale</h4>
                        <p className="text-slate-600 text-sm">{mod.rationale}</p>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-4">Step-by-Step Instructions</h3>
                    <div className="space-y-4">
                        {mod.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                                    {idx + 1}
                                </div>
                                <p className="text-slate-700 pt-1 text-lg">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center bg-slate-100 p-6 rounded-2xl">
                    <p className="text-slate-600 font-medium">Ready to discuss this with your AI Companion?</p>
                    <Button onClick={() => {
                        const prompt = `I am looking at the therapy module: "${mod.title}". Can you walk me through the steps?`;
                        navigate(`/chat?mode=pro&initialPrompt=${encodeURIComponent(prompt)}`);
                    }} className="bg-slate-900 hover:bg-slate-800 text-white">
                        Open Pro Chat <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {activeModule === null ? renderModuleList() : renderActiveModule()}
            </div>
        </div>
    );
}
