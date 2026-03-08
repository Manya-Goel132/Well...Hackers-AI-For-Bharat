/**
 * AWS Service — replaces Firebase completely.
 * Auth → AWS API Gateway + DynamoDB (manosathi-users)
 * Journal → AWS API Gateway + DynamoDB (manosathi-journals)
 * Chat → AWS API Gateway + DynamoDB (manosathi-chats)
 */

const API_BASE = 'https://6gcmnzrb72.execute-api.us-east-1.amazonaws.com';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: Date;
    lastLoginAt: Date;
    onboardingComplete: boolean;
    age?: number;
    gender?: string;
    location?: string;
    bio?: string;
    interests?: string[];
    preferences: {
        language: 'hindi' | 'english' | 'mixed';
        communicationStyle: 'formal' | 'casual';
    };
    symptomsData?: {
        symptoms: string;
        consentToStore: boolean;
        collectedAt: Date;
    };
    mentalHealthData?: {
        hasExistingConcerns: boolean;
        symptoms: {
            depression: string[];
            anxiety: string[];
            sleep: string[];
            trauma: string[];
        };
        previousDiagnosis?: string;
        additionalInfo?: string;
        collectedAt?: Date;
    };
    consents?: {
        dataUsageForAI: boolean;
        proModeAccess: boolean;
        consentDate: string;
        version?: string;
    };
}

export interface JournalEntry {
    entryId: string;
    userId: string;
    title: string;
    content: string;
    mood: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
    emotions: string[];
    tags: string[];
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
    aiInsights?: any;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

function saveToken(token: string) { localStorage.setItem('aws_auth_token', token); }
function getToken(): string { return localStorage.getItem('aws_auth_token') || ''; }
function clearToken() { localStorage.removeItem('aws_auth_token'); }

function authHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

async function apiPost(path: string, body: any, auth = false): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: auth ? authHeaders() : { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data;
}

async function apiGet(path: string): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, { method: 'GET', headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data;
}

async function apiPut(path: string, body: any): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data;
}

async function apiDelete(path: string): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
}

// ─── Convert DynamoDB record → UserProfile ────────────────────────────────────

function toProfile(raw: any): UserProfile {
    return {
        uid: raw.id,
        email: raw.email,
        displayName: raw.displayName,
        photoURL: raw.photoURL,
        createdAt: new Date(raw.createdAt),
        lastLoginAt: new Date(raw.lastLoginAt || raw.createdAt),
        onboardingComplete: raw.onboardingComplete || false,
        age: raw.age,
        gender: raw.gender,
        location: raw.location,
        bio: raw.bio,
        interests: raw.interests,
        preferences: raw.preferences || { language: 'mixed', communicationStyle: 'casual' },
        symptomsData: raw.symptomsData,
        mentalHealthData: raw.mentalHealthData,
        consents: raw.consents,
    };
}

function toUser(raw: any): User {
    return { uid: raw.id, email: raw.email, displayName: raw.displayName, photoURL: raw.photoURL || null };
}

function toJournalEntry(raw: any): JournalEntry {
    return {
        ...raw,
        entryId: raw.id || raw.entryId,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt || raw.createdAt),
    };
}

function normalizeSession(raw: any): any {
    return {
        ...raw,
        sessionId: raw.chatId || raw.sessionId,
        lastMessageAt: raw.lastMessageAt || raw.updatedAt || new Date().toISOString(),
        messages: raw.messages || [],
        title: raw.title || 'Chat',
    };
}

// ─── AwsService compatible class (drop-in replacement) ───────────────────

export class AwsService {
    private currentUser: User | null = null;
    private authListeners: Array<(user: User | null) => void> = [];

    constructor() {
        // Restore session from localStorage
        const token = getToken();
        if (token) {
            apiGet('/auth/me').then(data => {
                if (data.user) {
                    this.currentUser = toUser(data.user);
                    this.authListeners.forEach(l => l(this.currentUser));
                }
            }).catch(() => {
                clearToken();
                this.authListeners.forEach(l => l(null));
            });
        } else {
            setTimeout(() => this.authListeners.forEach(l => l(null)), 50);
        }
    }

    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        this.authListeners.push(callback);
        // Fire immediately with current known state
        setTimeout(() => callback(this.currentUser), 0);
        return () => { this.authListeners = this.authListeners.filter(l => l !== callback); };
    }

    async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
        const data = await apiPost('/auth/signup', { email, password, displayName });
        saveToken(data.token);
        this.currentUser = toUser(data.user);
        this.authListeners.forEach(l => l(this.currentUser));
        return toProfile(data.user);
    }

    async signIn(email: string, password: string): Promise<UserProfile> {
        const data = await apiPost('/auth/signin', { email, password });
        saveToken(data.token);
        this.currentUser = toUser(data.user);
        this.authListeners.forEach(l => l(this.currentUser));
        return toProfile(data.user);
    }

    async signInWithGoogle(): Promise<UserProfile> {
        // No Google on AWS — use guest account for demo
        throw new Error('Google Sign-In is not available on the AWS version. Please sign up with email and password.');
    }

    async signOut(): Promise<void> {
        clearToken();
        this.currentUser = null;
        this.authListeners.forEach(l => l(null));
    }

    async sendPasswordResetEmail(_email: string): Promise<void> {
        // TODO: Add SES-based email endpoint
        console.log('Password reset not yet implemented on AWS. Please contact support.');
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    // ── Profile ────────────────────────────────────────────────────────────────

    async createUserProfile(userProfile: UserProfile): Promise<void> {
        await apiPut('/profile', userProfile);
    }

    async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const data = await apiGet('/profile');
            return toProfile(data.profile);
        } catch {
            return null;
        }
    }

    async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
        await apiPut('/profile', updates);
    }

    async completeOnboarding(uid: string, onboardingData: any): Promise<void> {
        await apiPut('/profile', { ...onboardingData, onboardingComplete: true });
    }

    // ── Journal ────────────────────────────────────────────────────────────────

    async createJournalEntry(entry: Omit<JournalEntry, 'entryId'>): Promise<string> {
        const data = await apiPost('/journals', entry, true);

        // Trigger AWS Bedrock AI analysis asynchronously (fire & forget)
        fetch(`${API_BASE}/journal/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryId: data.entryId, content: entry.content, mood: entry.mood, userId: entry.userId })
        }).then(async res => {
            if (res.ok) {
                const aiInsights = await res.json();
                if (!aiInsights.error) {
                    await apiPut(`/journals/${data.entryId}`, { aiInsights });
                }
            }
        }).catch(e => console.error('AI insight error:', e));

        return data.entryId;
    }

    async getJournalEntries(userId: string, limit: number = 20): Promise<JournalEntry[]> {
        const data = await apiGet('/journals');
        return (data.entries || []).slice(0, limit).map(toJournalEntry);
    }

    listenToJournalEntries(
        userId: string,
        onUpdate: (entries: JournalEntry[]) => void,
        onError: (error: Error) => void,
        limitCount: number = 20
    ): () => void {
        let active = true;

        const poll = async () => {
            if (!active) return;
            try {
                const entries = await this.getJournalEntries(userId, limitCount);
                if (active) onUpdate(entries);
            } catch (e) {
                onError(e as Error);
            }
        };

        poll();
        const interval = setInterval(poll, 3000);
        return () => { active = false; clearInterval(interval); };
    }

    async updateJournalEntry(entryId: string, updates: Partial<JournalEntry>): Promise<void> {
        await apiPut(`/journals/${entryId}`, updates);
    }

    async deleteJournalEntry(entryId: string): Promise<void> {
        await apiDelete(`/journals/${entryId}`);
    }

    async createJournalRevision(_entryId: string, _revisionData: any): Promise<string> {
        return 'rev_' + Date.now();
    }

    async getJournalRevisions(_entryId: string): Promise<any[]> {
        return [];
    }

    // ── Chat ───────────────────────────────────────────────────────────────────

    // Proxy to AWS Bedrock empathic endpoint
    async getChatResponse(userMessage: string, userId: string, conversationHistory: any[] = [], language: string = 'english'): Promise<string> {
        const data = await apiPost('/chat/empathic', {
            userMessage, userId,
            previousMessages: conversationHistory.slice(-5),
            userProfile: { language }
        });
        return data.message || data.response || "I'm having trouble connecting right now.";
    }

    async saveChatSession(sessionId: string, messages: any[], userId: string): Promise<void> {
        await apiPost('/sessions', { sessionId, messages, userId }, true);
    }

    async getChatSession(sessionId: string): Promise<any | null> {
        try {
            const data = await apiGet(`/sessions/${sessionId}`);
            return data.session ? normalizeSession(data.session) : null;
        } catch {
            return null;
        }
    }

    async getStandardSessions(userId: string, limit: number = 10): Promise<any[]> {
        try {
            const data = await apiGet('/sessions');
            return (data.sessions || [])
                .filter((s: any) => !((s.chatId || s.sessionId)?.startsWith('pro_')))
                .slice(0, limit)
                .map(normalizeSession);
        } catch { return []; }
    }

    async getProSessions(userId: string, limit: number = 10): Promise<any[]> {
        try {
            const data = await apiGet('/sessions');
            return (data.sessions || [])
                .filter((s: any) => (s.chatId || s.sessionId)?.startsWith('pro_'))
                .slice(0, limit)
                .map(normalizeSession);
        } catch { return []; }
    }

    /** @deprecated */
    async getChatSessions(userId: string, limit: number = 10): Promise<any[]> {
        return this.getStandardSessions(userId, limit);
    }

    async deleteChatSession(sessionId: string): Promise<void> {
        await apiDelete(`/sessions/${sessionId}`);
    }

    async renameChatSession(sessionId: string, newTitle: string): Promise<void> {
        await apiPut(`/sessions/${sessionId}`, { title: newTitle });
    }

    // ── Misc ───────────────────────────────────────────────────────────────────

    async getCheckInHistory(_userId: string, _limitCount: number = 7): Promise<any[]> { return []; }
    async updateCheckIn(_userId: string, _checkInId: string, _updates: any): Promise<void> { }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const awsService = new AwsService();

// Stub exports that other parts of the code reference from Firebase SDK
export const auth = {
    currentUser: null as User | null,
    onAuthStateChanged: (callback: (user: User | null) => void) =>
        awsService.onAuthStateChanged(callback)
};

// Dummy db export (not used since all data goes through API Gateway)
export const db = {};
export const storage = {};
export const functions = {};
export const app = {};
