import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import {
    ArrowLeft, ArrowRight, Send, Loader2, MessageCircle, Plus, Menu, X, Trash2, Edit2,
    Check, AlertCircle, Shield, Activity, Heart,
    Image as ImageIcon
} from 'lucide-react';
import { PanicButton } from './PanicButton';
import { useAuth } from './auth/AuthProvider';
import { awsService, functions } from '../services/awsService';
import { httpsCallable } from '../services/awsShim';
import { toast } from 'sonner';
import { cn } from './ui/utils';
import { detectLanguage, getLanguageDisplayName } from '../utils/languageDetection';
import { assessCrisisLevel, shouldShowCrisisResources } from '../utils/crisisDetection';
import activityLogger from '../services/activityLogger';
import { betaAnalyticsService } from '../services/betaAnalyticsService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ModeSwitcher, ModeIndicator, ProModeDisclaimer } from './ModeSwitcher';
import { getClinicalResponse, hasProModeAccess } from '../services/clinicalAIService';
import { useWellness } from '../contexts/WellnessContext';
import { getStandardResponse } from '../services/standardAIService';
import { subscriptionService } from '../services/subscriptionService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isTyping?: boolean;
    image?: string;
}

interface ChatSession {
    sessionId: string;
    messages: Message[];
    lastMessageAt: Date;
    preview?: string;
    title?: string;
}

export function Chat() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { phq9Score, gad7Score, activeTreatmentPlan, latestJournalScore } = useWellness();

    const [searchParams, setSearchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'pro' ? 'pro' : 'standard';
    const initialPrompt = searchParams.get('initialPrompt');

    useEffect(() => {
        if (initialPrompt && !inputMessage) {
            setInputMessage(initialPrompt);
            searchParams.delete('initialPrompt');
            setSearchParams(searchParams, { replace: true });
        }
    }, [initialPrompt, searchParams, setSearchParams]);

    const [chatMode, setChatMode] = useState<'standard' | 'pro'>(initialMode);

    useEffect(() => {
        const targetMode = searchParams.get('mode') === 'pro' ? 'pro' : 'standard';
        if (chatMode !== targetMode) {
            setChatMode(targetMode);
        }
    }, [searchParams]);

    const [proModeAvailable, setProModeAvailable] = useState(false);
    const [showProDisclaimer, setShowProDisclaimer] = useState(false);

    const [standardSessionId, setStandardSessionId] = useState<string>(() => 'std_' + Date.now());
    const [proSessionId, setProSessionId] = useState<string>(() => 'pro_' + Date.now());

    const [standardSessions, setStandardSessions] = useState<ChatSession[]>([]);
    const [proSessions, setProSessions] = useState<ChatSession[]>([]);

    const currentSessionId = chatMode === 'pro' ? proSessionId : standardSessionId;
    const setCurrentSessionId = chatMode === 'pro' ? setProSessionId : setStandardSessionId;

    const sessions = chatMode === 'pro' ? proSessions : standardSessions;
    const setSessions = chatMode === 'pro' ? setProSessions : setStandardSessions;

    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [userData, setUserData] = useState<any>(null);
    const [showPanicProtocol, setShowPanicProtocol] = useState(false);
    const [themeColor, setThemeColor] = useState<string>('emerald');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!currentUser) return;
        const fetchProfile = async () => {
            try {
                const profile = await awsService.getUserProfile(currentUser.uid);
                setUserData(profile);
                const hasPro = await hasProModeAccess(profile);
                setProModeAvailable(hasPro);
            } catch (err) {
                console.error("Failed to load user profile:", err);
            }
        };
        fetchProfile();
    }, [currentUser]);

    const scrollToBottom = (instant: boolean = false) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: instant ? 'auto' : 'smooth'
            });
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (!currentUser) return;
        const loadSessions = async () => {
            try {
                const [std, pro] = await Promise.all([
                    awsService.getStandardSessions(currentUser.uid),
                    awsService.getProSessions(currentUser.uid)
                ]);
                setStandardSessions(std);
                setProSessions(pro);
            } catch (error) {
                console.error('Error loading sessions:', error);
            }
        };
        loadSessions();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !currentSessionId) return;
        const loadSession = async () => {
            try {
                const session = await awsService.getChatSession(currentSessionId);
                if (session?.messages) {
                    const messagesWithDates = session.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
                    }));
                    setMessages(messagesWithDates);
                } else {
                    setMessages([]);
                }
            } catch (error: any) {
                if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
                    setMessages([]);
                } else {
                    console.error('Error loading session:', error);
                    setMessages([]);
                }
            } finally {
                setTimeout(() => scrollToBottom(true), 100);
            }
        };
        loadSession();
    }, [currentUser, currentSessionId]);

    const handleModeChange = (newMode: 'standard' | 'pro') => {
        setMessages([]);
        if (newMode === 'pro') {
            if (!proModeAvailable) {
                toast.error('Pro mode requires consent.');
                return;
            }
            setSearchParams({ mode: 'pro' });
            setChatMode("pro");
            return;
        }
        setSearchParams({ mode: 'standard' });
        setChatMode('standard');
        toast.success('Switched to Standard Mode 💙');
    };

    const handleSend = async () => {
        if (!currentUser || !inputMessage.trim() || loading) return;

        const userText = inputMessage.trim();
        const userMessage: Message = {
            role: 'user',
            content: userText,
            timestamp: new Date(),
            image: selectedImage || undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setSelectedImage(null);
        setLoading(true);
        setTimeout(() => scrollToBottom(), 50);

        try {
            const crisisAssessment = assessCrisisLevel(userText);
            let aiText = '';
            let isCrisis = false;

            if (shouldShowCrisisResources(crisisAssessment)) {
                isCrisis = true;
            }

            try {
                const emotionalKeywords = /feel|sad|happy|angry|anxious|stressed|depressed|lonely|scared|hurt|love|hate|worried|overwhelmed/i;
                const isEmotional = emotionalKeywords.test(userText);
                betaAnalyticsService.trackChatMessage(currentUser.uid, userText.length, isEmotional, currentSessionId);
            } catch (e) {
                console.error('Analytics error:', e);
            }

            activityLogger.logActivity(currentUser.uid, 'chat', 'message_sent', {
                messageCount: messages.length + 1,
                conversationId: currentSessionId,
                sentiment: 0
            }).catch(err => console.error('Log error:', err));

            const detectedLanguage = detectLanguage(userMessage.content);
            const history = messages.slice(-30).map(m => ({
                role: m.role,
                content: m.content
            }));

            let isFallback = false;

            if (chatMode === 'pro') {
                const clinicalHistory = messages.slice(-5).map(m => ({
                    role: m.role,
                    content: m.content
                }));
                const response = await getClinicalResponse(
                    userMessage.content,
                    currentUser.uid,
                    clinicalHistory,
                    {
                        phq9Score,
                        gad7Score,
                        activeTreatmentPlan,
                        latestJournalScore
                    }
                );
                aiText = response;
                if (aiText.includes("technical difficulties")) {
                    isFallback = true;
                }
            } else {
                const response = await getStandardResponse(
                    userMessage.content,
                    currentUser.uid,
                    history,
                    {
                        userProfile: {
                            name: currentUser.displayName || userData?.displayName || 'Friend',
                            age: userData?.age || 22,
                            gender: userData?.gender || 'unknown',
                            location: userData?.location || 'India',
                            bio: userData?.bio || '',
                            preferredLanguage: userData?.preferences?.language || detectedLanguage,
                            culturalBackground: userData?.culturalBackground || 'Indian',
                            interests: userData?.interests || [],
                            comfortEnvironment: 'calm',
                            previousSessions: sessions.length
                        },
                        currentState: {
                            mood: 'seeking support',
                            stressLevel: 'moderate',
                            energyLevel: 'moderate',
                            crisisRisk: crisisAssessment.level,
                            emotionalTone: 'reflective'
                        },
                        assessmentScores: {
                            phq9: phq9Score !== null ? phq9Score : 0,
                            gad7: gad7Score !== null ? gad7Score : 0,
                            overallWellness: latestJournalScore !== null ? latestJournalScore : 50
                        },
                        therapeuticGoals: activeTreatmentPlan ? [activeTreatmentPlan] : ['Emotional support'],
                        multimodalImage: userMessage.image
                    }
                );
                aiText = response.message;
                isFallback = response.isFallback;
                if (response.emotionalTone === 'calming' || response.emotionalTone === 'supportive') setThemeColor('emerald');
                else if (response.emotionalTone === 'empathetic') setThemeColor('indigo');
                else if (response.emotionalTone === 'encouraging') setThemeColor('amber');
                else if (response.emotionalTone === 'urgent') setThemeColor('rose');
            }

            let finalOutputText = aiText;
            try {
                if (typeof finalOutputText === 'string' && finalOutputText.trim().startsWith('{')) {
                    const parsedJson = JSON.parse(finalOutputText);
                    if (parsedJson.message) finalOutputText = parsedJson.message;
                } else if (typeof finalOutputText === 'object' && finalOutputText !== null) {
                    finalOutputText = (finalOutputText as any).message || JSON.stringify(finalOutputText);
                }
            } catch (e) { }

            const aiMessage: Message = {
                role: 'assistant',
                content: finalOutputText,
                timestamp: new Date(),
                isTyping: true
            };

            const updatedMessages = [...messages, userMessage, aiMessage];
            setMessages(updatedMessages);

            if (!isFallback) {
                await subscriptionService.incrementMessageCount(currentUser.uid);
            }

            const serializedMessages = updatedMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp.toISOString()
            }));

            await awsService.saveChatSession(currentSessionId, serializedMessages, currentUser.uid);

            if (chatMode === 'pro') {
                const pro = await awsService.getProSessions(currentUser.uid);
                setProSessions(pro);
            } else {
                const std = await awsService.getStandardSessions(currentUser.uid);
                setStandardSessions(std);
            }

            const totalMessages = updatedMessages.length;
            if (totalMessages > 0 && totalMessages % 10 === 0) {
                updateMemoryInBackground(updatedMessages, currentUser.uid);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to get response.');
        } finally {
            setLoading(false);
        }
    };

    const updateMemoryInBackground = async (msgs: Message[], userId: string) => {
        try {
            const updateMemory = httpsCallable(functions, 'updateConversationMemory');
            const recentHistory = msgs.slice(-15).map(m => ({
                role: m.role,
                content: m.content
            }));
            updateMemory({ userId, recentHistory }).catch(err => console.error('Memory update failed:', err));
        } catch (error) {
            console.error('Memory update trigger error:', error);
        }
    };

    useEffect(() => {
        return () => {
            if (messages.length > 0 && messages.length % 10 !== 0 && currentUser) {
                updateMemoryInBackground(messages, currentUser.uid);
            }
        }
    }, [messages, currentUser]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const createNewChat = () => {
        const prefix = chatMode === 'pro' ? 'pro_' : 'std_';
        const newSessionId = prefix + Date.now();
        setCurrentSessionId(newSessionId);
        setMessages([]);
        setIsSidebarOpen(false);
    };

    const switchSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setIsSidebarOpen(false);
    };

    const getSessionPreview = (session: ChatSession): string => {
        if (session.messages && session.messages.length > 0) {
            const firstUserMsg = session.messages.find(m => m.role === 'user');
            return firstUserMsg?.content.substring(0, 50) + '...' || 'New conversation';
        }
        return 'New conversation';
    };

    const handleDeleteChat = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;
        try {
            await awsService.deleteChatSession(sessionId);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
            if (currentSessionId === sessionId) createNewChat();
            toast.success('Chat deleted');
        } catch (error) {
            console.error('Error deleting chat:', error);
            toast.error('Failed to delete chat');
        }
    };

    const startRenaming = (session: ChatSession, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSessionId(session.sessionId);
        setEditTitle(session.title || getSessionPreview(session));
    };

    const saveRename = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editTitle.trim()) return;
        try {
            await awsService.renameChatSession(sessionId, editTitle.trim());
            setSessions(prev => prev.map(s =>
                s.sessionId === sessionId ? { ...s, title: editTitle.trim() } : s
            ));
            setEditingSessionId(null);
            toast.success('Chat renamed');
        } catch (error) {
            console.error('Error renaming:', error);
            toast.error('Failed to rename chat');
        }
    };

    return (
        <div className="h-[calc(100dvh-130px)] md:h-[calc(100vh-140px)] bg-cream flex rounded-2xl md:rounded-3xl border border-sage-200 shadow-soft overflow-hidden relative font-sans text-slate-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`
                absolute md:relative z-30 h-full flex flex-col transition-all duration-300 ease-in-out
                w-[85%] sm:w-72 md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${chatMode === 'pro' ? 'bg-moss-50 border-r border-moss-200' : 'bg-sage-50/50 border-r border-sage-100'}
            `}>
                <div className="p-3 border-b flex justify-between items-center bg-white/50">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        {chatMode === 'pro' ? 'Pro Sessions' : 'Chats'}
                    </h2>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-2 space-y-2">
                    <div className="md:hidden">
                        <ModeSwitcher currentMode={chatMode} onModeChange={handleModeChange} proModeAvailable={proModeAvailable} />
                    </div>
                    <Button onClick={createNewChat} className="w-full bg-moss-900 hover:bg-moss-800 text-white" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map((session) => (
                        <div key={session.sessionId} onClick={() => switchSession(session.sessionId)}
                            className={`group relative p-2 rounded-lg border cursor-pointer transition-colors ${currentSessionId === session.sessionId ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-slate-50 border-transparent'}`}>
                            {editingSessionId === session.sessionId ? (
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 min-w-0 bg-white text-xs border rounded px-1 outline-none" autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && saveRename(session.sessionId, e as any)} />
                                    <button onClick={(e) => saveRename(session.sessionId, e)} className="p-1 hover:bg-emerald-200 rounded text-emerald-700"><Check className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="text-xs font-medium text-slate-700 line-clamp-1">{session.title || getSessionPreview(session)}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(session.lastMessageAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => startRenaming(session, e)} className="p-1 hover:bg-blue-100 rounded text-slate-500"><Edit2 className="w-3 h-3" /></button>
                                        <button onClick={(e) => handleDeleteChat(session.sessionId, e)} className="p-1 hover:bg-red-100 rounded text-slate-500"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-sage-100 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-[10px] text-moss-600 font-medium">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        <span>Anonymity Protected</span>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white/90 backdrop-blur-md border-b border-sage-100 p-3 flex justify-between items-center z-10 font-sans">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden pointer-events-auto">
                            <Menu className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hidden md:flex rounded-full h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                            <h1 className="text-lg font-display font-bold text-moss-900 truncate">AI Companion</h1>
                            <div className="hidden md:block">
                                <ModeSwitcher currentMode={chatMode} onModeChange={handleModeChange} proModeAvailable={proModeAvailable} />
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => toast.info('SOS development ongoing')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 px-3 text-xs shadow-lg">
                        <AlertCircle className="w-4 h-4 mr-1" /> Help Now
                    </Button>
                </header>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(240,253,244,0.5),transparent)]">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {showProDisclaimer && <ProModeDisclaimer onDismiss={() => setShowProDisclaimer(false)} />}
                        <ModeIndicator mode={chatMode} />

                        {messages.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <MessageCircle className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2 font-display">Start your journey today</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Share your thoughts, feelings, or just say hello. I'm here to support you in a safe, judgment-free space.</p>
                            </div>
                        ) : (
                            messages.map((message, idx) => (
                                <div key={idx} className={cn("flex w-full", message.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[85%] px-4 py-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        message.role === 'user' ? "bg-moss-800 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm"
                                    )}>
                                        {message.image && <img src={message.image} alt="Upload" className="mb-2 rounded-lg max-h-60" />}
                                        <div className={cn("prose prose-sm max-w-none", message.role === 'user' ? "prose-invert text-white" : "prose-slate")}>
                                            {message.isTyping ? (
                                                <Typewriter content={message.content} onComplete={() => setMessages(prev => prev.map((m, i) => i === idx ? { ...m, isTyping: false } : m))} />
                                            ) : (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && <div className="bg-white border p-3 rounded-2xl w-fit flex items-center gap-2 text-slate-500 text-sm shadow-sm"><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="bg-white border-t p-3 md:p-4 shrink-0">
                    <div className="max-w-3xl mx-auto">
                        {selectedImage && (
                            <div className="mb-2 relative inline-block">
                                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-emerald-500" />
                                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                        <div className="flex gap-2 items-end">
                            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setSelectedImage(reader.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }} />
                            <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="h-[52px] w-12 text-slate-400 hover:text-emerald-600">
                                <ImageIcon className="w-6 h-6" />
                            </Button>
                            <div className="relative flex-1">
                                <Textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type what's on your mind..."
                                    className={`min-h-[52px] max-h-32 py-4 resize-none rounded-xl border-slate-200 text-slate-900 bg-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm`} disabled={loading} />
                            </div>
                            <Button onClick={handleSend} disabled={!inputMessage.trim() || loading} className={`bg-moss-900 hover:bg-moss-800 text-white h-[52px] w-12 rounded-xl shadow-md`}>
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {showPanicProtocol && <PanicButton userId={currentUser?.uid || 'guest'} onClose={() => { setShowPanicProtocol(false); toast.success('Completed 💚'); }} />}
        </div>
    );
}

const Typewriter = ({ content, onComplete }: { content: string, onComplete?: () => void }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(prev => prev + content[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 10);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
        return undefined;
    }, [currentIndex, content, onComplete]);

    return (
        <div className="prose prose-sm max-w-none prose-slate">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>
        </div>
    );
};

export default Chat;
