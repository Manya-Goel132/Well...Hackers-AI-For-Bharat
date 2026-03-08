import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Globe, Moon, Shield, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { dataExportService } from '../../services/dataExportService';
import { accountDeletionService } from '../../services/accountDeletionService';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { t, i18n } = useTranslation();
    const { currentUser } = useAuth();

    // Privacy & Data States
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleDownloadData = async () => {
        if (!currentUser) return;
        setExporting(true);
        try {
            const blob = await dataExportService.exportUserData(currentUser.uid);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `manosathi-data-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Your data has been downloaded.');
        } catch (error) {
            toast.error('Failed to download data');
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!currentUser) return;
        if (confirm('Are you sure? This action cannot be undone and will permanently delete all your data.')) {
            setDeleting(true);
            try {
                await accountDeletionService.deleteUserAccount(currentUser.uid);
                toast.success('Your account has been deleted.');
                // Note: Auth state change will trigger redirect to sign-in
            } catch (error: any) {
                toast.error('Failed to delete account: ' + (error.message || 'Unknown error'));
                setDeleting(false);
            }
        }
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिंदी (Hindi)' },
        { code: 'mr', name: 'मराठी (Marathi)' },
        { code: 'bn', name: 'বাংলা (Bengali)' },
        { code: 'ta', name: 'தமிழ் (Tamil)' },
        { code: 'te', name: 'తెలుగు (Telugu)' },
        { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
        { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ml', name: 'മലയാളം (Malayalam)' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
        { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
        { code: 'as', name: 'অসমীয়া (Assamese)' },
        { code: 'ur', name: 'اردو (Urdu)' },
        { code: 'sa', name: 'संस्कृतम् (Sanskrit)' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-slate-800">{t('settings.title')}</h1>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-600" />
                        {t('settings.language')}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.language_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`
                                    p-4 rounded-xl border text-left transition-all flex items-center justify-between
                                    ${i18n.language && i18n.language.startsWith(lang.code)
                                        ? 'bg-emerald-50 border-[var(--mm-primary)] ring-1 ring-[var(--mm-primary)]'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <span className={`font-medium ${i18n.language && i18n.language.startsWith(lang.code) ? 'text-[var(--mm-primary)]' : 'text-slate-700'}`}>
                                    {lang.name}
                                </span>
                                {i18n.language && i18n.language.startsWith(lang.code) && (
                                    <div className="w-2 h-2 rounded-full bg-[var(--mm-primary)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Privacy & Data Section (HIPAA Compliance) */}
            <Card className="border-red-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        Privacy & Data
                    </CardTitle>
                    <CardDescription>
                        Manage your personal data in accordance with HIPAA regulations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                            <h3 className="font-medium text-slate-900">Download My Data</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Get a copy of all your personal data in JSON format.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleDownloadData}
                            disabled={exporting}
                            className="shrink-0"
                        >
                            {exporting ? (
                                <>Downloading...</>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Data
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 bg-red-50 rounded-lg border border-red-100">
                        <div>
                            <h3 className="font-medium text-red-900">Delete Account</h3>
                            <p className="text-sm text-red-600/80 mt-1">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="shrink-0"
                        >
                            {deleting ? (
                                <>Deleting...</>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Data
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm opacity-60 cursor-not-allowed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Moon className="w-5 h-5 text-slate-400" />
                        {t('settings.theme')}
                    </CardTitle>
                    <CardDescription>{t('settings.theme_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500 italic">Coming Soon</p>
                </CardContent>
            </Card>
        </div>
    );
}
