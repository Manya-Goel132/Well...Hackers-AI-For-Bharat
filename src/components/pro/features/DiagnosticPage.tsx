import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Activity, ClipboardList, CheckCircle, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PHQ9_QUESTIONS, GAD7_QUESTIONS } from '../../../services/clinicalAIService';
import { useWellness } from '../../../contexts/WellnessContext';

type AssessmentType = 'PHQ9' | 'GAD7' | null;

const OPTIONS = [
    { label: 'Not at all', score: 0 },
    { label: 'Several days', score: 1 },
    { label: 'More than half the days', score: 2 },
    { label: 'Nearly every day', score: 3 }
];

export default function DiagnosticPage() {
    const navigate = useNavigate();
    const [activeAssessment, setActiveAssessment] = useState<AssessmentType>(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const { setPHQ9Score, setGAD7Score } = useWellness();

    const questions = activeAssessment === 'PHQ9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;

    const startAssessment = (type: AssessmentType) => {
        setActiveAssessment(type);
        setCurrentQuestionIdx(0);
        setAnswers([]);
        setIsComplete(false);
    };

    const handleAnswer = (score: number) => {
        const newAnswers = [...answers, score];
        setAnswers(newAnswers);

        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(curr => curr + 1);
        } else {
            setIsComplete(true);
            const finalTotalScore = [...answers, score].reduce((a, b) => a + b, 0);
            if (activeAssessment === 'PHQ9') {
                setPHQ9Score(finalTotalScore);
            } else if (activeAssessment === 'GAD7') {
                setGAD7Score(finalTotalScore);
            }
        }
    };

    const getScoreInterpretation = (score: number, type: AssessmentType) => {
        if (type === 'PHQ9') {
            if (score <= 4) return { level: 'None-minimal', desc: 'Your symptoms suggest minimal depression.', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            if (score <= 9) return { level: 'Mild', desc: 'Your symptoms suggest mild depression.', color: 'text-amber-600', bg: 'bg-amber-50' };
            if (score <= 14) return { level: 'Moderate', desc: 'Your symptoms suggest moderate depression. Consider speaking with a professional.', color: 'text-orange-600', bg: 'bg-orange-50' };
            if (score <= 19) return { level: 'Moderately Severe', desc: 'Your symptoms suggest moderately severe depression. Professional support is strongly recommended.', color: 'text-red-500', bg: 'bg-red-50' };
            return { level: 'Severe', desc: 'Your symptoms suggest severe depression. Please seek professional medical help immediately.', color: 'text-red-700', bg: 'bg-red-100' };
        } else {
            if (score <= 4) return { level: 'Minimal', desc: 'Your symptoms suggest minimal anxiety.', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            if (score <= 9) return { level: 'Mild', desc: 'Your symptoms suggest mild anxiety.', color: 'text-amber-600', bg: 'bg-amber-50' };
            if (score <= 14) return { level: 'Moderate', desc: 'Your symptoms suggest moderate anxiety. Consider speaking with a professional.', color: 'text-orange-600', bg: 'bg-orange-50' };
            return { level: 'Severe', desc: 'Your symptoms suggest severe anxiety. Professional support is strongly recommended.', color: 'text-red-700', bg: 'bg-red-100' };
        }
    };

    const renderSelection = () => (
        <>
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <Activity className="text-purple-600" />
                    Clinical Diagnostics
                </h1>
                <p className="text-slate-600 text-lg">Establish your mental health baseline with clinically validated assessments.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-all border-t-4 border-t-purple-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-purple-100 p-3 rounded-lg text-purple-700">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">9 Questions</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">PHQ-9 Assessment</h3>
                        <p className="text-slate-500 mb-6 font-medium">Patient Health Questionnaire for assessing severity of depression symptoms over the last 2 weeks.</p>
                        <Button
                            onClick={() => startAssessment('PHQ9')}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Start Assessment
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all border-t-4 border-t-blue-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">7 Questions</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">GAD-7 Assessment</h3>
                        <p className="text-slate-500 mb-6 font-medium">General Anxiety Disorder assessment for measuring anxiety severity over the last 2 weeks.</p>
                        <Button
                            onClick={() => startAssessment('GAD7')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Start Assessment
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                <CheckCircle className="text-emerald-500 mt-1 w-6 h-6 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-slate-800 mb-1">Clinically Validated & Accurate</h4>
                    <p className="text-sm text-slate-500">The PHQ-9 and GAD-7 are gold standard tools. Outcomes here use exact clinical scoring algorithms. However, these are screening tools and not a formal medical diagnosis.</p>
                </div>
            </div>
        </>
    );

    const renderAssessment = () => {
        const progress = ((currentQuestionIdx) / questions.length) * 100;

        return (
            <div className="max-w-2xl mx-auto mt-8">
                <Button variant="ghost" onClick={() => setActiveAssessment(null)} className="mb-6 -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancel Assessment
                </Button>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeAssessment} Assessment</h2>
                    <p className="text-slate-600">Over the last 2 weeks, how often have you been bothered by the following problem?</p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${activeAssessment === 'PHQ9' ? 'bg-purple-600' : 'bg-blue-600'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <Card className="border-none shadow-lg">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                            Question {currentQuestionIdx + 1} of {questions.length}
                        </span>
                        <h3 className="text-xl font-semibold text-slate-800 leading-relaxed">
                            {questions[currentQuestionIdx]}
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {OPTIONS.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt.score)}
                                    className="w-full p-4 text-left border rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-slate-700 flex justify-between items-center group"
                                >
                                    <span>{opt.label}</span>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${activeAssessment === 'PHQ9' ? 'border-purple-600 text-purple-600' : 'border-blue-600 text-blue-600'}`}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-current" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderResult = () => {
        const totalScore = answers.reduce((a, b) => a + b, 0);
        const interp = getScoreInterpretation(totalScore, activeAssessment);

        // Critical Check: Question 9 on PHQ-9 is about self-harm.
        const containsSelfHarmRisk = activeAssessment === 'PHQ9' && answers[8] > 0;

        return (
            <div className="max-w-3xl mx-auto mt-8 opacity-0 animate-in fade-in duration-700 fill-mode-forwards">
                <div className="text-center mb-10">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${interp.bg}`}>
                        <span className={`text-4xl font-bold ${interp.color}`}>{totalScore}</span>
                    </div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Assessment Complete</h2>
                    <p className="text-lg text-slate-600">Your {activeAssessment} score is {totalScore} out of {questions.length * 3}.</p>
                </div>

                <Card className={`border-t-8 shadow-lg mb-8 ${activeAssessment === 'PHQ9' ? 'border-t-purple-600' : 'border-t-blue-600'}`}>
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Activity className={`w-6 h-6 ${interp.color}`} />
                            Severity: <span className={interp.color}>{interp.level}</span>
                        </h3>
                        <p className="text-slate-700 text-lg leading-relaxed mb-6">
                            {interp.desc}
                        </p>

                        {containsSelfHarmRisk && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                                <h4 className="flex items-center gap-2 text-red-800 font-bold mb-3">
                                    <AlertTriangle className="w-5 h-5" /> Safety Alert
                                </h4>
                                <p className="text-red-700 font-medium mb-4">
                                    You indicated having thoughts that you would be better off dead or hurting yourself. Your safety is deeply important to us.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button onClick={() => window.open('tel:14416')} className="bg-red-600 hover:bg-red-700 text-white w-full">
                                        Call Tele-MANAS (14416)
                                    </Button>
                                    <Button onClick={() => window.open('tel:9820466726')} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 w-full">
                                        Call AASRA (India)
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-slate-100">
                            <Button onClick={() => {
                                const prompt = `I just completed a ${activeAssessment} assessment and scored ${totalScore} (Severity: ${interp.level}). Can we discuss these results?`;
                                navigate(`/chat?mode=pro&initialPrompt=${encodeURIComponent(prompt)}`);
                            }} className="w-full font-bold h-12 bg-purple-600 hover:bg-purple-700 text-white">
                                Discuss Results with AI Companion <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Button onClick={() => navigate('/pro-mode/treatment')} className="w-full font-bold h-12 bg-slate-900 hover:bg-slate-800 text-white">
                                    View Therapy Plan
                                </Button>
                                <Button onClick={() => navigate('/pro-mode/specialist')} variant="outline" className="w-full font-bold h-12 border-slate-300 text-slate-700">
                                    Connect with a Specialist
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <Button variant="ghost" onClick={() => setActiveAssessment(null)} className="text-slate-500 hover:text-slate-900">
                        <RotateCcw className="w-4 h-4 mr-2" /> Retake or Select Another Assessment
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {!activeAssessment && (
                    <Button variant="ghost" onClick={() => navigate('/pro-mode')} className="mb-8 -ml-4">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pro Dashboard
                    </Button>
                )}

                {!activeAssessment && renderSelection()}
                {activeAssessment && !isComplete && renderAssessment()}
                {isComplete && renderResult()}
            </div>
        </div>
    );
}
