import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import {
    ArrowLeft, Save, Loader2, Edit, Trash2, X,
    Calendar, PenLine, Sparkles, History,
    BookOpen, Lightbulb, ChevronRight,
    MessageCircle, Brain, Search, Cloud, Tag,
    Mic, MicOff, FileText, Globe
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { awsService, JournalEntry } from '../services/awsService';
import { betaAnalyticsService } from '../services/betaAnalyticsService';
import { logPHIAccess } from '../services/auditLogService';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWellness } from '../contexts/WellnessContext';

export function Journal() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { setLatestJournalScore } = useWellness();

    const [voiceLanguage, setVoiceLanguage] = useState('auto');
    const [currentEntry, setCurrentEntry] = useState('');
    const [mood, setMood] = useState('');
    const [savedEntries, setSavedEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [viewingRevisions, setViewingRevisions] = useState<string | null>(null);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [clinicalReport, setClinicalReport] = useState<string | null>(null);

    const moodOptions = [
        { id: 'very_happy', label: 'Amazing', icon: '😄' },
        { id: 'happy', label: 'Good', icon: '🙂' },
        { id: 'neutral', label: 'Okay', icon: '😐' },
        { id: 'sad', label: 'Low', icon: '😔' },
        { id: 'very_sad', label: 'Rough', icon: '😫' }
    ];

    // Load initial context score
    useEffect(() => {
        if (savedEntries && savedEntries.length > 0) {
            const lastEntry = savedEntries[0];
            // Check nested metadata for sentiment
            if (lastEntry.aiInsights?.metadata?.sentimentScore !== undefined) {
                setLatestJournalScore(lastEntry.aiInsights.metadata.sentimentScore);
            } else if (lastEntry.aiInsights?.sentimentScore !== undefined) {
                setLatestJournalScore(lastEntry.aiInsights.sentimentScore);
            }
        }
    }, [savedEntries, setLatestJournalScore]);

    // Load user profile for preferences
    useEffect(() => {
        if (!currentUser) return;
        const fetchProfile = async () => {
            try {
                const profile = await awsService.getUserProfile(currentUser.uid);
                // Profile preferences loading...
            } catch (err) {
                console.error("Failed to load user profile in Journal:", err);
            }
        };
        fetchProfile();
    }, [currentUser]);

    // Real-time listener for entries
    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        const unsubscribe = awsService.listenToJournalEntries(
            currentUser.uid,
            (entries) => {
                setSavedEntries(entries);
                setLoading(false);
            },
            (error) => {
                console.error('Error loading journal:', error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser || !currentEntry.trim() || !mood) return;

        setSaving(true);
        try {
            if (editingEntry) {
                const revisionData = {
                    ...editingEntry,
                    originalEntryId: editingEntry.entryId,
                    revisionNumber: Date.now(),
                    isRevision: true,
                    editedAt: new Date()
                };
                delete (revisionData as any).entryId; // Remove ID for subcollection

                await awsService.createJournalRevision(editingEntry.entryId, revisionData);
                const { deleteField } = await import('../services/awsShim');

                await awsService.updateJournalEntry(editingEntry.entryId, {
                    content: currentEntry.trim(),
                    mood: mood as any,
                    emotions: [mood],
                    aiInsights: deleteField() as any
                });

                // HIPAA Audit Log: Track journal entry update
                await logPHIAccess(currentUser.uid, 'JOURNAL_ENTRY', editingEntry.entryId, 'UPDATE');

                toast.success('Reflection updated. Analyzing...');
            } else {
                const newEntryId = await awsService.createJournalEntry({
                    userId: currentUser.uid,
                    title: `Reflection • ${new Date().toLocaleDateString(undefined, { weekday: 'long' })}`,
                    content: currentEntry.trim(),
                    mood: mood as any,
                    emotions: [mood],
                    tags: [],
                    isPrivate: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // HIPAA Audit Log: Track journal entry creation
                await logPHIAccess(currentUser.uid, 'JOURNAL_ENTRY', newEntryId, 'CREATE');

                try {
                    await betaAnalyticsService.trackJournalCreated(currentUser.uid);
                } catch (error) {
                    console.error('Error tracking journal creation:', error);
                }
                toast.success('Reflection saved. AI insights coming soon.');
            }

            setCurrentEntry('');
            setMood('');
            setEditingEntry(null);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Could not save entry');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!savedEntries.length) return;
        setGeneratingReport(true);
        try {
            const response = await fetch('https://6gcmnzrb72.execute-api.us-east-1.amazonaws.com/clinical/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    journalEntries: savedEntries.slice(0, 10).map(e => ({ date: e.createdAt, content: e.content })),
                    targetLanguage: 'en'
                })
            });
            if (!response.ok) throw new Error("AWS Report Generation Failed");
            const data = await response.json();
            setClinicalReport(data.handoverReport);
            toast.success("AI Therapist Handover Generated! 📄");
        } catch (err) {
            console.error(err);
            toast.error("Handover generation failed.");
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleVoiceInput = async () => {
        // Voice disabled
    };

    const handleEditClick = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setCurrentEntry(entry.content);
        setMood(entry.mood);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (entryId: string) => {
        if (window.confirm('Are you sure you want to delete this reflection?')) {
            try {
                await awsService.deleteJournalEntry(entryId);

                // HIPAA Audit Log: Track journal entry deletion
                if (currentUser) {
                    await logPHIAccess(currentUser.uid, 'JOURNAL_ENTRY', entryId, 'DELETE');
                }

                toast.success('Entry deleted');
            } catch (e) {
                toast.error('Failed to delete');
            }
        }
    };

    const handleViewRevisions = async (entryId: string) => {
        if (viewingRevisions === entryId) {
            setViewingRevisions(null);
            setRevisions([]);
        } else {
            try {
                const revs = await awsService.getJournalRevisions(entryId);
                setRevisions(revs);
                setViewingRevisions(entryId);
            } catch (error) {
                toast.error('Could not load history');
            }
        }
    };

    const formatDate = (date: Date | any) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-cream p-4 md:p-8 font-sans text-moss-900">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Premium Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="rounded-full h-10 w-10 bg-white shadow-sm border border-sage-100 text-moss-700 hover:bg-sage-50"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-moss-900">Personal Journal</h1>
                            <p className="text-moss-600 text-sm">Your private space for reflection & growth</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-sage-100 shadow-sm text-sm text-moss-700">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>{savedEntries.length} Reflections</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT: Editor - Notebook Style */}
                    <div className="lg:col-span-7 space-y-4 h-full">
                        <Card className="border-none shadow-soft bg-white rounded-2xl overflow-hidden h-full flex flex-col">
                            {/* Editor Header */}
                            <div className="bg-sage-50/50 p-4 border-b border-sage-100 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-moss-800 font-semibold">
                                    <PenLine className="w-4 h-4 text-emerald-600" />
                                    {editingEntry ? 'Editing Entry' : 'New Reflection'}
                                </div>
                                {editingEntry && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingEntry(null);
                                            setCurrentEntry('');
                                            setMood('');
                                        }}
                                        className="h-8 text-xs text-moss-600 hover:text-moss-900"
                                    >
                                        <X className="w-3 h-3 mr-1" /> Cancel Edit
                                    </Button>
                                )}
                            </div>

                            <div className="p-6 space-y-6 flex-1 flex flex-col">
                                {/* Mood Selector */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-moss-500 uppercase tracking-wider">
                                        How are you feeling?
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {moodOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setMood(opt.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${mood === opt.id
                                                    ? 'bg-moss-800 text-white border-moss-800 shadow-md transform scale-105'
                                                    : 'bg-white border-sage-200 text-moss-600 hover:bg-sage-50'
                                                    }`}
                                            >
                                                <span className="text-lg leading-none">{opt.icon}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Area */}
                                <div className="space-y-3 flex-1 flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-moss-500 uppercase tracking-wider">
                                            Your Thoughts
                                        </label>
                                    </div>
                                    <div className="relative flex-1">
                                        <Textarea
                                            value={currentEntry}
                                            onChange={(e) => setCurrentEntry(e.target.value)}
                                            placeholder="Start writing here..."
                                            disabled={saving}
                                            className={`w-full h-full min-h-[300px] p-4 text-base leading-relaxed resize-none rounded-xl transition-colors bg-sage-50/20 border-sage-200 focus:border-emerald-400 focus:ring-emerald-100`}
                                        />
                                        <div className="absolute bottom-3 right-3 text-xs text-moss-400 font-medium bg-white/80 px-2 py-1 rounded-md">
                                            {currentEntry.length} chars
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={(!currentEntry.trim() || !mood) || saving}
                                        className="bg-moss-800 hover:bg-moss-900 text-white px-8 h-12 rounded-full font-semibold shadow-glow transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" /> Save Reflection
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT: History Feed - Scrollable */}
                    <div className="lg:col-span-12">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-moss-900 font-display">Recent Entries</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateReport}
                                disabled={generatingReport || !savedEntries.length}
                                className="text-xs gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                                {generatingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                Therapist Report
                            </Button>
                        </div>

                        {clinicalReport && (
                            <Card className="mb-6 p-5 bg-emerald-50 border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-emerald-800">
                                        <Globe className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-wider">Multilingual Clinical Handover</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setClinicalReport(null)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="prose prose-sm text-emerald-900 leading-relaxed font-serif italic text-base">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {clinicalReport}
                                    </ReactMarkdown>
                                </div>
                                <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-between items-center">
                                    <span className="text-[10px] text-emerald-600 font-medium">Ready for therapist handover (Translated & Redacted)</span>
                                    <Button variant="ghost" size="sm" className="text-[10px] font-bold h-7 px-2 text-emerald-700 hover:bg-emerald-100">DOWNLOAD PDF</Button>
                                </div>
                            </Card>
                        )}

                        <div className="space-y-4 h-full overflow-y-auto pr-2 pb-20 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-12 text-sage-400">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    <p>Loading your journal...</p>
                                </div>
                            ) : savedEntries.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-sage-200 text-sage-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-sage-200" />
                                    <p className="font-medium">No entries yet</p>
                                    <p className="text-sm mt-1">Start writing to see your history here.</p>
                                </div>
                            ) : (
                                savedEntries.map((entry) => (
                                    <div
                                        key={entry.entryId}
                                        className="group bg-white rounded-xl p-5 border border-sage-100 hover:border-emerald-200 hover:shadow-soft transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Entry Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center text-xl shadow-inner">
                                                    {moodOptions.find((m) => m.id === entry.mood)?.icon || '⚪'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-moss-500 uppercase tracking-wide">
                                                            {formatDate(entry.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-moss-900 text-sm line-clamp-1">{entry.title}</h3>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-sage-100">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600" onClick={() => handleEditClick(entry)}>
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-amber-50 text-slate-400 hover:text-amber-600" onClick={() => handleViewRevisions(entry.entryId)}>
                                                    <History className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => handleDelete(entry.entryId)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content Preview */}
                                        <p className="text-moss-700 text-sm leading-relaxed line-clamp-3 mb-4 pl-1">
                                            {entry.content}
                                        </p>

                                        {/* AI Insights Section */}
                                        {entry.aiInsights && (entry.aiInsights.conversationalResponse || entry.aiInsights.summary) && (
                                            <div className="mt-4 space-y-4">
                                                {/* 💬 Response */}
                                                {(entry.aiInsights.conversationalResponse || entry.aiInsights.summary) && (
                                                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                                        <div className="flex items-center gap-2 text-blue-800 mb-2">
                                                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                                                <MessageCircle className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Response</span>
                                                        </div>
                                                        <div className="text-sm text-moss-800 leading-relaxed">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
                                                            }}>
                                                                {entry.aiInsights.conversationalResponse || entry.aiInsights.summary}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 🧠 Therapeutic Perspective */}
                                                {entry.aiInsights.therapeuticPerspective && (
                                                    <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                                                        <div className="flex items-center gap-2 text-purple-800 mb-2">
                                                            <div className="p-1.5 bg-purple-100 rounded-lg">
                                                                <Brain className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Therapeutic Perspective</span>
                                                        </div>
                                                        <p className="text-sm text-moss-800 leading-relaxed">
                                                            {entry.aiInsights.therapeuticPerspective}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* 🔍 Thought Patterns */}
                                                {entry.aiInsights.thoughtPatterns && (
                                                    <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                                        <div className="flex items-center gap-2 text-amber-800 mb-2">
                                                            <div className="p-1.5 bg-amber-100 rounded-lg">
                                                                <Search className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Thought Patterns</span>
                                                        </div>
                                                        <p className="text-sm text-moss-800 leading-relaxed">
                                                            {entry.aiInsights.thoughtPatterns}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* 💭 Emotional Nuance */}
                                                {entry.aiInsights.emotionalNuance && (
                                                    <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100">
                                                        <div className="flex items-center gap-2 text-rose-800 mb-2">
                                                            <div className="p-1.5 bg-rose-100 rounded-lg">
                                                                <Cloud className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Emotional Nuance</span>
                                                        </div>
                                                        <p className="text-sm text-moss-800 leading-relaxed">
                                                            {entry.aiInsights.emotionalNuance}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* 💡 Try This */}
                                                {entry.aiInsights.tryThis && (
                                                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                                                        <div className="flex items-center gap-2 text-emerald-800 mb-2">
                                                            <div className="p-1.5 bg-emerald-100 rounded-lg">
                                                                <Lightbulb className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Try This</span>
                                                        </div>
                                                        <p className="text-sm text-moss-800 leading-relaxed">
                                                            {entry.aiInsights.tryThis}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* 🏷️ Key Themes */}
                                                {entry.aiInsights.keyThemes && entry.aiInsights.keyThemes.length > 0 && (
                                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                                        <div className="flex items-center gap-2 text-slate-700 mb-2">
                                                            <div className="p-1.5 bg-slate-100 rounded-lg">
                                                                <Tag className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Key Themes</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {entry.aiInsights.keyThemes.map((theme, idx) => (
                                                                <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                                                                    {theme}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Ecosystem Bridge: Discuss with AI */}
                                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-200/50 rounded-full shadow-inner">
                                                    <Brain className="w-4 h-4 text-emerald-700" />
                                                </div>
                                                <p className="text-sm text-emerald-800 font-medium">Want to explore these thoughts further?</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    const trimmed = entry.content.length > 200 ? entry.content.substring(0, 200) + '...' : entry.content;
                                                    const moodLabel = moodOptions.find(m => m.id === entry.mood)?.label || entry.mood;
                                                    const prompt = `I just wrote this in my journal (feeling ${moodLabel}):\n"${trimmed}"\n\nCan we talk about this?`;
                                                    navigate(`/chat?mode=standard&initialPrompt=${encodeURIComponent(prompt)}`);
                                                }}
                                                className="w-full sm:w-auto text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-full px-4"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Discuss with AI
                                            </Button>
                                        </div>

                                        {/* Revision History Viewer */}
                                        {viewingRevisions === entry.entryId && revisions.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-sage-100 animate-in slide-in-from-top-2">
                                                <h4 className="text-xs font-bold text-moss-600 uppercase mb-3 flex items-center gap-2">
                                                    <History className="w-3 h-3" />
                                                    Previous Versions
                                                </h4>
                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                                    {revisions.map((rev, idx) => (
                                                        <div key={rev.revisionId} className="bg-sage-50 rounded-lg p-3 text-xs border border-sage-200/50">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-semibold text-moss-700">v{revisions.length - idx}</span>
                                                                <span className="text-[10px] text-moss-500">{formatDate(rev.editedAt || rev.createdAt)}</span>
                                                            </div>
                                                            <p className="text-moss-600 line-clamp-2">{rev.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Journal;
