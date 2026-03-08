import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, ArrowRight, CheckCircle2, Globe, Check, Sparkles, User, Heart, Shield } from 'lucide-react';
import { MentalHealthAssessment } from './MentalHealthAssessment';
import { ConsentScreen } from './ConsentScreen';
import { SymptomsCollection } from './SymptomsCollection';
import { toast } from 'sonner';

const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
];

export default function OnboardingPage() {
    const { userProfile, completeOnboarding } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState<'language' | 'profile' | 'symptoms' | 'mental_health' | 'consent'>('language');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');

    const [formData, setFormData] = useState({
        displayName: userProfile?.displayName || '',
        age: '',
        gender: '',
        goals: '',
        interests: ''
    });

    const [symptomsData, setSymptomsData] = useState<any>(null);
    const [mentalHealthData, setMentalHealthData] = useState<any>(null);
    const [consentsData, setConsentsData] = useState<any>(null);

    const handleLangSelect = (code: string) => {
        setSelectedLang(code);
        i18n.changeLanguage(code);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.displayName || !formData.age || !formData.gender) {
            toast.error(t('onboarding.required_fields') || "Please fill in all required fields");
            return;
        }
        setStep('symptoms');
    };

    const handleConsentComplete = async (consents: any) => {
        setConsentsData(consents);
        setIsLoading(true);
        try {
            await completeOnboarding({
                displayName: formData.displayName,
                age: parseInt(formData.age),
                gender: formData.gender,
                interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean),
                bio: formData.goals,
                preferences: { language: selectedLang },
                symptomsData: symptomsData,
                mentalHealthData: mentalHealthData,
                consents: consents
            });
            toast.success(t('onboarding.success') || "Welcome to ManoSathi!");
            navigate('/', { replace: true });
        } catch (error) {
            toast.error(t('onboarding.error') || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    // Sub-components for other steps remain unchanged in logic, layout handled by them for now
    if (step === 'symptoms') return <SymptomsCollection onComplete={(data) => { setSymptomsData(data); setStep('mental_health'); }} onSkip={() => { setSymptomsData(null); setStep('mental_health'); }} />;
    if (step === 'mental_health') return <MentalHealthAssessment onComplete={(data) => { setMentalHealthData(data); setStep('consent'); }} onSkip={() => { setMentalHealthData({ hasExistingConcerns: false, symptoms: { depression: [], anxiety: [], sleep: [], trauma: [] } }); setStep('consent'); }} />;
    if (step === 'consent') return <ConsentScreen onComplete={handleConsentComplete} onBack={() => setStep('mental_health')} />;

    // --- PREMIUM SPLIT LAYOUT FOR LANGUAGE & PROFILE ---
    return (
        <div className="min-h-screen bg-cream font-sans flex items-center justify-center p-4 md:p-8">
            <Card className="w-full max-w-6xl min-h-[600px] shadow-2xl rounded-3xl overflow-hidden border-none flex flex-col md:flex-row bg-white">

                {/* LEFT: Form Section */}
                <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 text-moss-800 text-xs font-bold uppercase tracking-wider mb-4">
                            <Sparkles className="w-3 h-3 fill-emerald-500 text-emerald-600" />
                            GET STARTED
                        </div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-moss-900 mb-2">
                            {step === 'language' ? (t('settings.language') || "Choose Language") : (t('onboarding.title') || "Create Profile")}
                        </h1>
                        <p className="text-moss-600 text-lg">
                            {step === 'language'
                                ? "Select your preferred language to begin your journey."
                                : "Tell us a bit about yourself so we can personalize your care."}
                        </p>
                    </div>

                    {/* CONTENT: Language Selection */}
                    {step === 'language' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLangSelect(lang.code)}
                                        className={`
                                            group relative p-3 h-20 rounded-xl border-2 text-center transition-all duration-200
                                            flex flex-col items-center justify-center
                                            ${selectedLang === lang.code
                                                ? 'bg-moss-900 border-moss-900 text-white shadow-lg scale-105'
                                                : 'bg-white border-sage-100 text-moss-700 hover:border-emerald-300 hover:bg-sage-50'}
                                        `}
                                    >
                                        <span className="font-bold text-lg leading-none mb-1">{lang.native}</span>
                                        <span className={`text-xs ${selectedLang === lang.code ? 'text-emerald-200' : 'text-moss-500'}`}>{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                            <Button onClick={() => setStep('profile')} className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-glow">
                                Continue <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* CONTENT: Profile Form */}
                    {step === 'profile' && (
                        <form onSubmit={handleProfileSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-moss-700 font-semibold" htmlFor="displayName">{t('profile.display_name') || "Name"}</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 w-4 h-4 text-moss-400" />
                                        <Input
                                            id="displayName"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            placeholder="Your Name"
                                            className="pl-9 h-11 bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-moss-700 font-semibold" htmlFor="age">{t('profile.age') || "Age"}</Label>
                                    <Input
                                        id="age"
                                        name="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="24"
                                        className="h-11 bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-moss-700 font-semibold" htmlFor="gender">{t('profile.gender') || "Gender Identity"}</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full h-11 px-3 bg-sage-50 border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="non-binary">Non-binary</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-moss-700 font-semibold" htmlFor="goals">Main Goal</Label>
                                <Textarea
                                    id="goals"
                                    name="goals"
                                    value={formData.goals}
                                    onChange={handleChange}
                                    placeholder="e.g. Reduce anxiety, sleep better..."
                                    className="min-h-[80px] bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl resize-none"
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 bg-moss-900 hover:bg-moss-800 text-white rounded-full shadow-soft mt-4">
                                Next Step <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    )}
                </div>

                {/* RIGHT: Visual Placeholder (Split Screen) */}
                <div className="hidden md:flex w-1/2 bg-sage-50 relative items-center justify-center p-12 overflow-hidden group">
                    {/* Abstract Decorative Elements */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    {/* Welcome Image Container */}
                    <div className="relative z-10 w-full max-w-md aspect-square rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white/50 backdrop-blur-sm transform transition-transform group-hover:scale-105 duration-700">
                        {/* THE WELCOME CHARACTER IMAGE */}
                        <img
                            src="/ai-companion-welcome.jpg"
                            alt="A friendly AI companion character smiling warmly, symbolizing support."
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay Gradient for Text Readability if needed later */}
                        <div className="absolute inset-0 bg-gradient-to-t from-moss-900/40 via-transparent to-transparent opacity-60" />

                        {/* Floating Badges */}
                        <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-bounce-slow">
                            <Shield className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs font-bold text-moss-800">Private</span>
                        </div>
                        <div className="absolute bottom-12 left-8 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-bounce-slow delay-700">
                            <Check className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-bold text-moss-800">Secure</span>
                        </div>
                    </div>
                </div>

            </Card>
        </div>
    );
}
