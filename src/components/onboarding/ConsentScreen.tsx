import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Shield, AlertTriangle, Lock, FileText, CheckCircle2, X } from 'lucide-react';

interface ConsentData {
    dataUsageForAI: boolean;
    proModeAccess: boolean;
    consentDate: string;
}

interface ConsentScreenProps {
    onComplete: (consents: ConsentData) => void;
    onBack: () => void;
}

export function ConsentScreen({ onComplete, onBack }: ConsentScreenProps) {
    const [dataUsageConsent, setDataUsageConsent] = useState(false);
    const [proModeConsent, setProModeConsent] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleSubmit = () => {
        onComplete({
            dataUsageForAI: dataUsageConsent,
            proModeAccess: proModeConsent,
            consentDate: new Date().toISOString(),
        });
    };

    const canProceed = dataUsageConsent;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-3xl shadow-xl border-slate-200 animate-in fade-in slide-in-from-right-10 duration-500">
                <CardHeader className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                        Privacy & Consent
                    </CardTitle>
                    <CardDescription className="text-slate-600 max-w-xl mx-auto">
                        Your privacy and safety are our top priorities. Please review and accept to continue.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* View Terms Button */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-blue-600" />
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold">Important Legal Disclaimers & Data Usage</p>
                                <p className="opacity-80">Please read our terms before proceeding.</p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto bg-white hover:bg-slate-50"
                            onClick={() => setShowTerms(true)}
                        >
                            Read Full Terms
                        </Button>
                    </div>

                    {/* Data Usage & Disclaimers Consent */}
                    <label className="flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-green-300 group">
                        <Checkbox
                            checked={dataUsageConsent}
                            onCheckedChange={(checked) => setDataUsageConsent(checked as boolean)}
                            className="mt-1"
                            required
                        />
                        <div className="flex-1 space-y-1">
                            <p className="font-semibold text-slate-800 text-base">
                                I agree to the Terms & Conditions and Data Usage Policy
                            </p>
                            <p className="text-sm text-slate-600">
                                I allow ManoSathi to use my data securely for personalized support. I understand this is not a medical substitute.
                            </p>
                            <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Required
                            </span>
                        </div>
                    </label>

                    {/* Pro Mode Consent */}
                    <label className="flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-purple-300 group">
                        <Checkbox
                            checked={proModeConsent}
                            onCheckedChange={(checked) => setProModeConsent(checked as boolean)}
                            className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                            <p className="font-semibold text-slate-800 text-base">
                                Enable AI Companion Pro (Clinical Assessment Mode)
                            </p>
                            <p className="text-sm text-slate-600">
                                Access optional clinical-grade assessments (PHQ-9/GAD-7) for deeper insights.
                            </p>
                            <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                Optional
                            </span>
                        </div>
                    </label>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            onClick={onBack}
                            variant="outline"
                            className="flex-1"
                        >
                            ← Back
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canProceed}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {canProceed ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    I Accept - Complete Setup
                                </>
                            ) : (
                                'Please accept required consents'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Terms Modal Overlay */}
            {showTerms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0">
                            <div>
                                <CardTitle className="text-xl">Terms & Conditions</CardTitle>
                                <CardDescription>Data Usage & Legal Disclaimers</CardDescription>
                            </div>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowTerms(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>

                        <CardContent className="overflow-y-auto p-6 space-y-6">
                            {/* Data Usage details */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-blue-600" />
                                    Data Usage & Privacy
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Your mental health information and symptoms will be used by our AI to provide better,
                                    more personalized recommendations and support. All data is end-to-end encrypted and stored
                                    securely. We never share your personal information with third parties.
                                </p>
                            </div>

                            {/* Pro Mode details */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                    Pro Mode Features
                                </h3>
                                <p className="text-sm text-slate-600">
                                    If enabled, Pro Mode uses advanced AI trained on clinical guidelines for mental health assessments (PHQ-9, GAD-7) and evidence-based therapeutic recommendations.
                                </p>
                            </div>

                            {/* Important Disclaimers details */}
                            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-700" />
                                    <p className="font-bold text-yellow-900">Important Legal Disclaimers</p>
                                </div>
                                <div className="space-y-2 text-sm text-yellow-900">
                                    <p><strong>1. Not a Medical Professional:</strong> ManoSathi is NOT a substitute for professional medical advice, diagnosis, or treatment.</p>
                                    <p><strong>2. No Prescriptions:</strong> Our AI cannot and will not prescribe medications.</p>
                                    <p><strong>3. Emergency Situations:</strong> If you're experiencing a mental health crisis, call emergency services immediately.</p>
                                    <p><strong>4. AI Limitations:</strong> AI may make mistakes, misunderstand context, or provide incomplete information.</p>
                                </div>

                                <div className="bg-red-100 border border-red-300 rounded-lg p-3 mt-2 text-sm">
                                    <p className="font-bold text-red-900 mb-1">🚨 India Emergency Contacts:</p>
                                    <div className="grid grid-cols-2 gap-2 text-red-900">
                                        <div>📞 <strong>Tele-MANAS:</strong> 14416</div>
                                        <div>📞 <strong>AASRA:</strong> 9820466726</div>
                                        <div>📞 <strong>Emergency:</strong> 102/108</div>
                                        <div>📞 <strong>Vandrevala:</strong> 1860 266 2345</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <div className="p-4 border-t bg-slate-50 flex justify-end shrink-0 rounded-b-xl">
                            <Button onClick={() => setShowTerms(false)} className="bg-slate-800 hover:bg-slate-900">
                                Close & Return
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
