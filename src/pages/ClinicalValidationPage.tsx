import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, Award, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function ClinicalValidationPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
                        <Shield className="w-10 h-10 text-purple-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                        Clinical Validation & Expert Review
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Our AI responses are validated by qualified mental health professionals to ensure safety, accuracy, and therapeutic effectiveness.
                    </p>
                </div>

                {/* Clinical Advisor Card */}
                <Card className="p-6 md:p-8 mb-8 bg-gradient-to-br from-purple-50 to-white border-purple-200">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-200">
                            <img
                                src="/1735025761155.jpeg"
                                alt="Priti Gupta"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Priti Gupta, M.S. Psychology</h2>
                            <p className="text-purple-700 font-medium mb-3">Clinical Advisor & Validator</p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Award className="w-4 h-4 text-purple-600" />
                                    <span>Master of Science in Psychology, Purdue University</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Award className="w-4 h-4 text-purple-600" />
                                    <span>Certified Clinical Hypnotherapist</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Heart className="w-4 h-4 text-purple-600" />
                                    <span>Founder, Practical Nirvana (Mental Health & Wellness Practice)</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-purple-100">
                                <h3 className="font-semibold text-slate-800 mb-2">Professional Experience</h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>• Client-centered counseling for depression, anxiety, panic attacks, and OCD</li>
                                    <li>• Specialized in stress management and work-life balance</li>
                                    <li>• Expertise in anxiety and anger management techniques</li>
                                    <li>• Community mental health consulting (Nai Disha Educational Society)</li>
                                    <li>• Clinical training instructor for therapeutic programs</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-100 rounded-lg p-4 border-l-4 border-purple-600">
                        <p className="text-slate-700 italic">
                            "I have reviewed the AI-generated responses from ManoSathi and found them to be therapeutically sound, empathetic, and aligned with evidence-based mental health practices. The system demonstrates appropriate boundaries, provides accurate information, and maintains a client-centered approach that prioritizes user safety and well-being."
                        </p>
                        <p className="text-sm text-purple-800 font-semibold mt-2">— Priti Gupta, M.S. Psychology</p>
                    </div>
                </Card>

                {/* Validation Scope */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Therapeutic Approach</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>✓ Empathetic communication style</li>
                            <li>✓ Client-centered approach</li>
                            <li>✓ Active listening techniques</li>
                            <li>✓ Non-judgmental language</li>
                        </ul>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Clinical Accuracy</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>✓ Evidence-based techniques</li>
                            <li>✓ Accurate mental health information</li>
                            <li>✓ Crisis detection protocols</li>
                            <li>✓ Professional resource referrals</li>
                        </ul>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Safety & Ethics</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>✓ Clear professional boundaries</li>
                            <li>✓ Appropriate disclaimers</li>
                            <li>✓ Crisis intervention protocols</li>
                            <li>✓ Ethical handling of sensitive topics</li>
                        </ul>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Cultural Sensitivity</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>✓ Indian cultural context</li>
                            <li>✓ Family dynamics awareness</li>
                            <li>✓ Diverse backgrounds respect</li>
                            <li>✓ Culturally appropriate language</li>
                        </ul>
                    </Card>
                </div>

                {/* Validated Techniques */}
                <Card className="p-6 md:p-8 mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Validated Therapeutic Techniques</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                            <div>
                                <h4 className="font-semibold text-slate-800">Cognitive Behavioral Therapy (CBT)</h4>
                                <p className="text-sm text-slate-600">Evidence-based approach for anxiety and depression</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                            <div>
                                <h4 className="font-semibold text-slate-800">Mindfulness & Grounding</h4>
                                <p className="text-sm text-slate-600">Present-moment awareness techniques</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                            <div>
                                <h4 className="font-semibold text-slate-800">Breathing Techniques</h4>
                                <p className="text-sm text-slate-600">Anxiety management and stress reduction</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                            <div>
                                <h4 className="font-semibold text-slate-800">Emotional Regulation</h4>
                                <p className="text-sm text-slate-600">Managing intense emotions effectively</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Disclaimer */}
                <Card className="p-6 bg-slate-50 border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3">Important Disclaimer</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        While ManoSathi's AI responses have been validated by qualified mental health professionals,
                        the platform is designed as a <strong>supportive tool</strong> and <strong>not a replacement
                            for professional therapy or medical treatment</strong>. Users experiencing severe mental health
                        concerns should always consult licensed mental health professionals.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-800 mb-2">For Mental Health Emergencies:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• <strong>Tele-MANAS:</strong> 14416 (24/7 Mental Health Helpline)</li>
                            <li>• <strong>Emergency Services:</strong> 102 / 108 / 112</li>
                        </ul>
                    </div>
                </Card>
            </div>
        </div>
    );
}
