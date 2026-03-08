import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Heart, AlertCircle, CheckCircle2, Shield, FileText, X, Lock } from 'lucide-react';

interface SymptomsData {
    symptoms: string;
    consentToStore: boolean;
    collectedAt: Date;
}

interface SymptomsCollectionProps {
    onComplete: (data: SymptomsData) => void;
    onSkip: () => void;
}

export function SymptomsCollection({ onComplete, onSkip }: SymptomsCollectionProps) {
    const [symptoms, setSymptoms] = useState('');
    const [consentToStore, setConsentToStore] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);

    const handleSubmit = () => {
        if (!consentToStore) {
            return;
        }

        onComplete({
            symptoms: symptoms.trim(),
            consentToStore,
            collectedAt: new Date(),
        });
    };

    const canProceed = symptoms.trim().length > 0 && consentToStore;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-3xl shadow-xl border-slate-200 animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <Heart className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                        Tell Us About Your Health Concerns
                    </CardTitle>
                    <CardDescription className="text-slate-600 max-w-xl mx-auto">
                        Share any medical or mental health symptoms you're experiencing. This helps us provide
                        personalized support tailored to your needs.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Symptoms Input */}
                    <div className="space-y-3">
                        <label className="block font-medium text-slate-700">
                            What symptoms or health concerns are you experiencing?
                        </label>
                        <Textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="For example: feeling anxious, trouble sleeping, low mood, stress, difficulty concentrating, physical pain, etc..."
                            className="min-h-[150px] text-base"
                            rows={6}
                        />
                        <p className="text-xs text-slate-500">
                            Be as specific as you'd like. This information helps us understand how to support you better.
                        </p>
                    </div>

                    {/* Consent Requirements (only shown if user typed something) */}
                    {symptoms.trim().length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold">Privacy & Storage Policy</p>
                                        <p className="opacity-80">How we securely handle your data.</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto bg-white hover:bg-slate-50"
                                    onClick={() => setShowPolicy(true)}
                                >
                                    Read Policy
                                </Button>
                            </div>

                            <label className="flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-green-300 group bg-white">
                                <Checkbox
                                    checked={consentToStore}
                                    onCheckedChange={(checked) => setConsentToStore(checked as boolean)}
                                    className="mt-1"
                                    required
                                />
                                <div className="flex-1 space-y-1">
                                    <p className="font-semibold text-slate-800 text-base">
                                        I consent to ManoSathi safely storing my health concerns
                                    </p>
                                    <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        Required
                                    </span>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            onClick={onSkip}
                            variant="ghost"
                            className="flex-1 order-2 sm:order-1"
                        >
                            Skip for now
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canProceed}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
                        >
                            {canProceed ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Continue
                                </>
                            ) : (
                                'Please provide symptoms and consent to continue'
                            )}
                        </Button>
                    </div>

                    {/* Disclaimer */}
                    <div className="text-center">
                        <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>
                                This is not a medical diagnosis. Always consult healthcare professionals for medical advice.
                            </span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Privacy Policy Modal */}
            {showPolicy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    Privacy & Storage Policy
                                </CardTitle>
                                <CardDescription>How we protect and use your data.</CardDescription>
                            </div>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowPolicy(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>

                        <CardContent className="overflow-y-auto p-6 space-y-6">
                            <div className="space-y-3">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    By checking the consent box, you give ManoSathi permission to securely store the symptoms
                                    and health concerns you've shared. This information helps us to:
                                </p>
                                <ul className="text-sm text-slate-600 space-y-1 pl-4 list-disc marker:text-slate-400">
                                    <li>Provide personalized mental health support and tailored recommendations.</li>
                                    <li>Track your progress and well-being over time.</li>
                                    <li>Offer highly relevant coping strategies and resources.</li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                                <p className="flex items-center gap-2 font-semibold text-slate-800">
                                    <Lock className="w-4 h-4 text-blue-600" />
                                    Your Privacy Guarantee:
                                </p>
                                <ul className="text-sm text-slate-600 space-y-2 pl-6 list-disc marker:text-slate-400">
                                    <li>All your data is encrypted end-to-end.</li>
                                    <li>We <strong>never</strong> share your personal information with third parties.</li>
                                    <li>You can view, edit, or delete your health data at any time inside your Settings.</li>
                                    <li>You can revoke this consent completely whenever you wish.</li>
                                </ul>
                            </div>
                        </CardContent>

                        <div className="p-4 border-t bg-slate-50 flex justify-end shrink-0 rounded-b-xl">
                            <Button onClick={() => setShowPolicy(false)} className="bg-slate-800 hover:bg-slate-900">
                                Understood & Close
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
