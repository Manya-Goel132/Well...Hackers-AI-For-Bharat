# ManoSathi Mental Health Platform - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │ Android App  │  │   iOS App    │      │
│  │  (React +    │  │ (Capacitor)  │  │ (Capacitor)  │      │
│  │  TypeScript) │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon API Gateway (HTTP API)                   │
│         CORS: allowedOrigins: * — all routes                │
│  POST /auth/signup    POST /auth/signin   GET  /auth/me     │
│  GET  /profile        PUT  /profile                         │
│  GET  /journals       POST /journals                        │
│  GET  /journals/{id}  PUT  /journals/{id} DEL /journals/{id}│
│  GET  /sessions       POST /sessions                        │
│  GET  /sessions/{id}  PUT  /sessions/{id} DEL /sessions/{id}│
│  POST /chat/empathic  POST /chat/clinical                   │
│  POST /journal/analyze                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AWS Lambda Functions                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  authLambda  │  │profileLambda │  │journalLambda │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────────────────────────┐    │
│  │chatSession   │  │  generateEmpathicResponseLambda  │    │
│  │Lambda        │  │  generateClinicalResponseLambda  │    │
│  └──────────────┘  │  analyzeJournalEntryLambda       │    │
│                    └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────────┐
│   Amazon DynamoDB   │     │     Amazon Bedrock          │
│  manosathi-users    │     │  amazon.nova-pro-v1:0        │
│  manosathi-chats    │     │  (ConverseCommand SDK)       │
│  manosathi-journals │     │  Empathic + Clinical modes   │
│  manosathi-treatment│     │  Journal Analysis            │
└─────────────────────┘     └─────────────────────────────┘
```

### 1.2 Component Architecture

**Frontend Components:**
- `App.tsx` - Main application router and auth wrapper
- `AuthProvider.tsx` - AWS JWT auth context and state management
- `HomePage.tsx` - Dashboard with quick actions
- `Chat.tsx` - AI companion chat interface
- `Journal.tsx` - Journaling with AWS Bedrock AI analysis
- `CheckIn.tsx` - Mental health questionnaire (PHQ-9 / GAD-7)
- `Breathe.tsx` - Guided breathing exercises
- `DailyWisdom.tsx` - Dynamic quotes with API integration + fallback
- `RecommendedResources.tsx` - Educational articles library
- `ClinicalValidationPage.tsx` - Trust and validation information
- `ProfilePage.tsx` - User profile management
- `SettingsPage.tsx` - App preferences
- `BetaDashboard.tsx` - Admin analytics (internal)

**Backend Lambda Functions:**
- `authLambda.ts` — Handles `/auth/signup`, `/auth/signin`, `/auth/me` with JWT
- `profileLambda.ts` — Handles GET/PUT `/profile` with DynamoDB
- `journalLambda.ts` — Handles CRUD for `/journals` and `/journals/{id}`
- `chatSessionLambda.ts` — Handles CRUD for `/sessions` and `/sessions/{id}`
- `generateEmpathicResponseLambda.ts` — Standard AI chat via Bedrock + aiOrchestrator
- `generateClinicalResponseLambda.ts` — Pro/clinical AI chat via Bedrock
- `analyzeJournalEntryLambda.ts` — Async Bedrock journal analysis

**Core Backend Modules:**
- `awsBedrockAI.ts` — Amazon Bedrock ConverseCommand integration (Nova Pro)
- `aiOrchestrator.ts` — AI request coordination and context assembly
- `memoryManager.ts` — DynamoDB-backed long-term memory (pattern extraction)
- `aws/dynamoDB.ts` — DynamoDB client and table name constants
- `therapeuticKnowledgeBase.ts` — Static therapeutic knowledge for system prompts

**Frontend Services:**
- `firebaseService.ts` — AWS API Gateway wrapper (drop-in replacement for Firebase SDK)
- `standardAIService.ts` — Standard AI fetch with 3-attempt retry and AbortController timeout
- `useSessionTimeout.ts` — HIPAA-compliant auto-logout hook
- `firebaseShim.ts` — Stub for legacy Firebase imports (no-ops, silent)

---

## 2. Data Models

### 2.1 User Profile (DynamoDB: `manosathi-users-dev`)

```typescript
interface UserProfile {
  id: string;            // Hash Key (uid)
  email: string;         // GSI: email-index
  displayName: string;
  passwordHash: string;  // SHA256 with salt
  salt: string;
  photoURL?: string;
  createdAt: string;     // ISO 8601
  lastLoginAt: string;
  onboardingComplete: boolean;

  // Extended profile
  age?: number;
  gender?: string;
  location?: string;
  bio?: string;
  interests?: string[];

  // Preferences
  preferences: {
    language: 'hindi' | 'english' | 'mixed';
    communicationStyle: 'formal' | 'casual';
  };

  // Consents
  consents?: {
    dataUsageForAI: boolean;
    proModeAccess: boolean;
    consentDate: string;
    version?: string;
  };
}
```

### 2.2 Journal Entry (DynamoDB: `manosathi-journals-dev`)

```typescript
interface JournalEntry {
  id: string;            // Hash Key
  userId: string;        // GSI: userId-createdAt-index
  title: string;
  content: string;
  mood: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
  emotions: string[];
  tags: string[];
  isPrivate: boolean;
  createdAt: string;     // ISO 8601 (GSI Sort Key)
  updatedAt: string;

  aiInsights?: {
    sentimentScore?: number;
    keyThemes?: string[];
    positiveMentions?: string[];
    negativeMentions?: string[];
    potentialTriggers?: string[];
    copingMentioned?: string[];
    riskFlags?: string[];
    summary?: string;

    // Detailed Insights (Bedrock)
    conversationalResponse?: string;   // Warm, empathetic reply
    therapeuticPerspective?: string;   // Clinical insight
    thoughtPatterns?: string;          // Cognitive distortions
    emotionalNuance?: string;          // Deep emotional analysis
    tryThis?: string;                  // Actionable suggestion

    analysisTimestamp?: string;
    modelVersion?: string;
    detectedLanguage?: string;
  };
}
```

### 2.3 Chat Session (DynamoDB: `manosathi-chats-dev`)

```typescript
interface ChatSession {
  chatId: string;        // Hash Key
  userId: string;        // GSI: userId-lastMessageAt-index
  sessionId: string;     // Logical group ID (same as chatId for new sessions)
  messages: Message[];
  lastMessageAt: string; // ISO 8601 (GSI Sort Key)
  title?: string;
  userMessage?: string;
  aiResponseText?: string;
  timestamp: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### 2.4 User Memory (DynamoDB: `manosathi-users-dev`, key: `memory_{userId}`)

```typescript
interface UserMemoryRecord {
  id: string;           // = "memory_{userId}"
  userId: string;
  facts: UserFact[];
  updatedAt: string;
}

interface UserFact {
  id: string;
  fact: string;
  category: 'education' | 'family' | 'career' | 'health' | 'interests' | 'goals' | 'challenges' | string;
  importance: number;   // 0-1
  confidence: number;   // 0-1
  firstMentioned: string;
  lastMentioned: string;
  mentionCount: number;
  relatedFacts: string[];
  source: 'conversation' | 'assessment' | 'activity' | 'explicit';
}
```

### 2.5 Check-In (Client-side + DynamoDB: `manosathi-treatments-dev`)

```typescript
interface CheckIn {
  checkInId: string;
  userId: string;
  timestamp: string;
  responses: {
    mood: number;           // 1-10
    stress: number;
    sleep: number;
    energy: number;
    socialConnection: number;
  };
  phq9Score?: number;
  gad7Score?: number;
  notes?: string;
}
```

---

## 3. API Design

### 3.1 AWS Lambda Functions via API Gateway

#### 3.1.1 Auth Endpoints

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| POST | /auth/signup | authLambda | Register user, returns JWT |
| POST | /auth/signin | authLambda | Login, returns JWT |
| GET  | /auth/me     | authLambda | Restore session from JWT |

**Signup Input:**
```typescript
{ email: string; password: string; displayName: string; }
```

**Signup Output:**
```typescript
{ token: string; user: { id, email, displayName, photoURL } }
```

#### 3.1.2 Profile Endpoints

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| GET | /profile | profileLambda | Get user profile from DynamoDB |
| PUT | /profile | profileLambda | Update user profile in DynamoDB |

All requests require `Authorization: Bearer <jwt>` header.

#### 3.1.3 Journal Endpoints

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| GET    | /journals       | journalLambda | List entries by userId GSI |
| POST   | /journals       | journalLambda | Create entry, trigger async Bedrock analysis |
| GET    | /journals/{id}  | journalLambda | Get single entry |
| PUT    | /journals/{id}  | journalLambda | Update entry |
| DELETE | /journals/{id}  | journalLambda | Delete entry |

#### 3.1.4 Chat Session Endpoints

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| GET    | /sessions       | chatSessionLambda | List sessions by userId GSI |
| POST   | /sessions       | chatSessionLambda | Create/save session |
| GET    | /sessions/{id}  | chatSessionLambda | Get single session |
| PUT    | /sessions/{id}  | chatSessionLambda | Rename session |
| DELETE | /sessions/{id}  | chatSessionLambda | Delete session |

#### 3.1.5 AI Endpoints

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| POST | /chat/empathic   | generateEmpathicResponseLambda | Standard AI chat (Nova Pro) |
| POST | /chat/clinical   | generateClinicalResponseLambda | Pro/clinical AI chat (Nova Pro) |
| POST | /journal/analyze | analyzeJournalEntryLambda      | Async journal insight generation |

**Empathic Input:**
```typescript
{
  userMessage: string;
  userId: string;
  previousMessages: { role: string; content: string }[];
  userProfile?: { language?: string; age?: number; gender?: string };
  assessments?: { phq9?: number; gad7?: number };
  sessionId?: string;
}
```

**Empathic Output:**
```typescript
{
  message: string;
  interventionType: string;
  activityRecommendations: any[];
  emotionalSupport: { empathyLevel: number; copingStrategies: string[] };
  riskAssessment: { level: string; indicators: string[]; immediateActions: string[] };
  culturalAdaptation: { language: string; culturalReferences: string[] };
  followUp: { recommended: boolean; timeframe: string; focus: string[] };
  resources: { emergency: string[] };
}
```

---

## 4. AI Integration Design

### 4.1 Amazon Bedrock (Nova Pro)

**Model ID:** `amazon.nova-pro-v1:0`

**SDK:** `@aws-sdk/client-bedrock-runtime` — `ConverseCommand`

**Auth:** Lambda IAM execution role (SigV4 — no Bearer tokens)

**Configuration:**
- maxTokens: 1500
- temperature: 0.7
- topP: 0.8
- Timeout: 30 seconds (AbortController)

**Therapeutic System Prompt:**
```
You are ManoSathi, a warm, empathetic mental health companion for Indian youth.
Core Principles:
1. Empathy First: Validate emotions before offering solutions
2. Cultural Sensitivity: Respect Indian values, family dynamics, social norms
3. Crisis Awareness: Detect and respond to crisis situations immediately
4. Evidence-Based: Use CBT, DBT, mindfulness techniques
5. Language Flexibility: Respond in user's preferred language (Hindi/English/mixed)

Response Style:
- Warm, conversational, non-judgmental
- Use simple language, avoid jargon
- Reference Indian cultural context when relevant
```

### 4.2 Memory System Architecture

**Hybrid History Strategy (Cost Optimized):**
1. **All user messages** included in Converse context (~50 tokens each)
2. **Last 2 AI responses** only (~310 tokens each)
3. **Long-term facts** (top 5 from DynamoDB) injected into system prompt
4. History sorted by timestamp before sending to Bedrock

**Memory Extraction (Pattern-Based):**
- No external AI model needed for memory extraction
- Regex patterns match: education, family, career, health, interests
- Facts deduplicated via substring matching
- Top 30 facts kept, sorted by importance score

### 4.3 Retry & Fallback Architecture

**Frontend (standardAIService.ts):**
- 3 attempts with 1.5s × attempt delay between retries
- AbortController with 28s timeout per attempt
- Detects: `AbortError`, `Failed to fetch`
- Final fallback: "I'm having a little trouble connecting right now..."

**Lambda (awsBedrockAI.ts):**
- 3 attempts with 200ms × attempt exponential backoff
- Catches: timeout, Bedrock throttling, empty response
- Final fallback: `getFallbackResponse()` with `isFallback: true`

---

## 5. UI/UX Design

### 5.1 Design System

**Color Palette:**
- Primary: `#10b981` (Emerald green)
- Secondary: `#6366f1` (Indigo)
- Accent: `#f59e0b` (Amber)
- Background: `#FAFAF8` (Off-white)
- Text: `#1e293b` (Slate)

### 5.2 Key Screens

#### 5.2.1 Home Page
- Hero section with greeting
- Daily Wisdom (Dynamic Quote with local fallback)
- Dashboard stats (if user has activity)
- Primary CTA: "Chat with AI"
- Secondary actions: Journal, Breathe, Check-In
- Recommended Resources (Articles)

#### 5.2.2 Journal Page
- Editor (mood selector, textarea)
- History list with entries (polled every 3s)
- **AI Insights Rendering (Bedrock powered):**
  - 💬 **Response** card
  - 🧠 **Therapeutic Perspective** card
  - 🔍 **Thought Patterns** card
  - 💭 **Emotional Nuance** card
  - 💡 **Try This** card
  - 🏷️ **Key Themes** tags

#### 5.2.3 Chat Interface
- Session sidebar (standard and pro sessions)
- Message list with user/AI bubbles
- Crisis overlay with AASRA helpline on high/severe risk
- Typing indicator during Bedrock response generation
- Session rename inline

#### 5.2.4 Clinical Validation
- Trust page showcasing clinical advisor (Priti Gupta)
- Validated techniques listing
- Safety disclaimers

---

## 6. Security Design

### 6.1 Authentication & Authorization
- JWT tokens generated by authLambda (HS256, stored in localStorage)
- JWT verified on every protected Lambda function
- No Google/Firebase auth dependencies

### 6.2 Data Privacy
- Encryption in transit (HTTPS via API Gateway)
- DynamoDB encryption at rest (AWS managed)
- Password stored as SHA256 hash with random salt
- Data minimization (only necessary fields stored)
- IAM roles enforce Lambda → DynamoDB → Bedrock access boundaries

### 6.3 HIPAA Compliance
- Session timeout hook auto-logs out inactive users
- No PII exposed via admin dashboard
- Audit trail via CloudWatch Lambda logs

---

## 7. Performance Optimization

### 7.1 Frontend Optimization
- Code splitting (Lazy load routes)
- Dynamic imports for heavy components
- Minification and compression (Vite build)
- AbortController prevents hanging requests

### 7.2 Backend Optimization
- DynamoDB GSI indexes for userId queries (O(1) lookups)
- Lambda bundle size: 3.9 MB (AWS SDK excluded — provided by runtime)
- Bedrock hybrid history: saves 40-60% tokens vs full history
- Fire-and-forget journal analysis (non-blocking POST response)

---

## 8. Deployment Architecture

### 8.1 Environments
- **Development:** Local Vite dev server (`npm run dev`) + Deployed AWS Lambda
- **Production:** AWS Lambda + API Gateway + DynamoDB + Bedrock

### 8.2 Backend Deployment
- **Framework:** Serverless Framework v3 (`serverless.yml`)
- **Runtime:** Node.js 20.x
- **Region:** us-east-1
- **Stage:** dev
- **API ID:** `6gcmnzrb72.execute-api.us-east-1.amazonaws.com`
- **Deploy command:** `AWS_PROFILE=ai4bharat serverless deploy --stage dev`

### 8.3 Frontend Deployment
- **Build:** `npm run build` (Vite)
- **Serve:** `npm run dev` (local), static hosting for production

### 8.4 Mobile Deployment
- **Android:** Capacitor (`npx cap sync android`)
- **iOS:** Capacitor (`npx cap sync ios`)

### 8.5 CI/CD Pipeline
- Build: `npm run build` (frontend) + `npm run build` (functions/tsc)
- Deploy: `serverless deploy --stage dev`

---

## 9. Scalability Considerations

- **DB:** DynamoDB auto-scaling (PAY_PER_REQUEST — no capacity planning needed)
- **Compute:** Lambda scales to 1000+ concurrent invocations automatically
- **AI:** Bedrock throughput scales with AWS account quotas
- **API:** API Gateway supports millions of requests per day with no configuration

---

## 10. Correctness & Testing

- **Auth:** JWT generation and verification tested via curl + Bedrock end-to-end
- **CORS:** OPTIONS preflight returns `204` with `Access-Control-Allow-Origin: *`
- **AI:** Bedrock ConverseCommand tested directly via AWS CLI (`aws bedrock-runtime converse`)
- **Data Integrity:** Journal and session CRUD validated via API Gateway endpoints
- **Mobile:** Responsive layout testing on simulators

---

**Document Version:** 2.0  
**Last Updated:** March 8, 2026  
**Status:** Active — AWS Backend Deployed
