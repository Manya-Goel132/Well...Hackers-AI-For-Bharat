// Backend Amazon Bedrock Integration for MannMitra (AWS Lambda)
import { STATIC_THERAPEUTIC_KNOWLEDGE_BASE } from './therapeuticKnowledgeBase';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID = 'amazon.nova-pro-v1:0'; // Using native Amazon Nova model to avoid AISPL/Marketplace billing restrictions in India
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Simple ConversationContext interface for compatibility
export interface ConversationContext {
  userMood: string;
  preferredLanguage: string;
  culturalBackground: string;
  previousMessages: string[];
  userPreferences: {
    interests: string[];
    comfortEnvironment: string;
    avatarStyle: string;
  };
  crisisLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
}

export interface MentalHealthContext {
  userId: string;
  sessionId: string;
  userProfile: {
    age?: number;
    gender?: string;
    location?: string;
    preferredLanguage?: string;
    culturalBackground?: string;
    interests?: string[];
    bio?: string;
    comfortEnvironment?: string;
    previousSessions?: number;
  };
  // --- NEW: Long-Term Memory ---
  userFacts?: string[]; // e.g., ["Preparing for NEET", "Conflict with Dad"]
  // -----------------------------
  currentState: {
    mood?: string;
    stressLevel?: 'low' | 'moderate' | 'high' | 'severe';
    energyLevel?: 'low' | 'moderate' | 'high';
    crisisRisk?: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    emotionalTone?: string;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'model';
    content: string;
    timestamp?: Date;
    metadata?: any;
  }>;
  therapeuticGoals?: string[];
  assessmentScores?: {
    phq9?: number;
    gad7?: number;
    overallWellness?: number;
  };
  clinicalGrounding?: string;
  multimodalImage?: string; // AWS Native: Base64 data for image analysis
}

export interface AIResponse {
  message: string;
  originalLanguage: string;
  detectedLanguage?: string;
  translatedMessage?: string;
  emotionalTone: 'supportive' | 'empathetic' | 'encouraging' | 'calming' | 'urgent';
  suggestedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    category: 'immediate' | 'short_term' | 'long_term';
  }>;
  copingStrategies: string[];
  followUpQuestions: string[];
  riskAssessment: {
    level: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    indicators: string[];
    recommendedIntervention: string;
  };
  culturalReferences: string[];
  audioResponse?: string;
  confidence: number;
  sentimentScore: number;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  isFallback?: boolean;
}

export class AWSBedrockMentalHealthAI {
  private isInitialized = false;
  private readonly TIMEOUT_MS = 30000;
  constructor() {
    // Don't initialize in constructor - use lazy loading
  }

  // Compatibility method for aiOrchestrator - matches geminiAI interface
  async generateEmpathicResponse_Full(
    userMessage: string,
    context: MentalHealthContext,
    attempt: number = 1
  ): Promise<AIResponse> {
    const MAX_ATTEMPTS = 3;

    // Initialize model if needed
    try {
      if (!this.isInitialized) {
        await this.initializeServices();
      }
    } catch (initErr) {
      console.error("❌ Initialization failed:", initErr);
      return this.getFallbackResponse(context, userMessage);
    }

    console.log("➡️ Processing message (attempt " + attempt + "):", userMessage.substring(0, 100));

    // Build padded system prompt (Static KB + Dynamic Context)
    const systemPrompt = this.getPaddedSystemPrompt(context);

    // 🔍 Debugging: Log System Prompt Size
    const estimatedTokens = Math.ceil(systemPrompt.length / 4);
    console.log(`🧠 System Prompt Length: ${systemPrompt.length} chars (~${estimatedTokens} tokens)`);
    console.log(`ℹ️ Implicit Caching Target: > 2048 tokens. Current Status: ${estimatedTokens > 2048 ? 'ELIGIBLE ✅' : 'TOO SHORT ❌'}`);

    // 💰 HYBRID HISTORY STRATEGY - COST OPTIMIZATION
    // Keep: ALL user messages (short, ~50 tokens each)
    // Keep: LAST 2 AI responses only (for immediate context)
    // This reduces costs by 40-60% while maintaining conversation quality

    const conversationHistory = context.conversationHistory || [];

    // Separate user and AI messages
    const userMessages = conversationHistory.filter(m => m.role === 'user');
    const aiMessages = conversationHistory.filter(m => m.role === 'assistant' || m.role === 'model');

    console.log(`📊 History: ${conversationHistory.length} total (${userMessages.length} user, ${aiMessages.length} AI)`);

    // Build hybrid history array
    const hybridHistory = [];

    // Add ALL user messages (they're short, ~50 tokens each)
    for (const msg of userMessages) {
      hybridHistory.push({
        role: 'user',
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      });
    }

    // Add only LAST 2 AI messages (for immediate context, ~310 tokens each)
    const recentAI = aiMessages.slice(-2);
    for (const msg of recentAI) {
      hybridHistory.push({
        role: 'model',
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      });
    }

    // Sort by timestamp to maintain conversation flow
    hybridHistory.sort((a, b) => {
      const timeA = a.timestamp?.getTime() || 0;
      const timeB = b.timestamp?.getTime() || 0;
      return timeA - timeB;
    });

    console.log(`💰 Hybrid strategy: ${userMessages.length} user msgs + ${recentAI.length} AI msgs = ${hybridHistory.length} total`);

    // Estimate token savings
    const fullHistoryTokens = conversationHistory.length * 180; // avg 180 tokens per message
    const hybridTokens = (userMessages.length * 50) + (recentAI.length * 310);
    const savedTokens = fullHistoryTokens - hybridTokens;
    const savingsPercent = fullHistoryTokens > 0 ? Math.round((savedTokens / fullHistoryTokens) * 100) : 0;

    console.log(`💵 Token estimate: ${hybridTokens} (vs ${fullHistoryTokens} full) - saving ${savedTokens} tokens (${savingsPercent}%)`);

    // Convert to API format (Bedrock Converse schema)
    const messages: any[] = hybridHistory.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: [{ text: msg.content }]
    }));

    // Add current user message
    if (context.multimodalImage) {
      // AWS Native: Multimodal Content Block
      let format = 'png';
      if (context.multimodalImage.startsWith('data:image/jpeg')) format = 'jpeg';
      else if (context.multimodalImage.startsWith('data:image/gif')) format = 'gif';
      else if (context.multimodalImage.startsWith('data:image/webp')) format = 'webp';

      const imgBase64 = context.multimodalImage.split(',')[1] || context.multimodalImage;
      messages.push({
        role: 'user',
        content: [
          { text: userMessage },
          {
            image: {
              format: format as any,
              source: { bytes: new Uint8Array(Buffer.from(imgBase64, 'base64')) }
            }
          }
        ]
      });
      console.log(`📸 Multimodal Image Attached to AI Request as ${format}`);
    } else {
      messages.push({
        role: 'user',
        content: [{ text: userMessage }]
      });
    }

    console.log(`📊 Total messages in context: ${messages.length} (${conversationHistory.length} history + 1 current)`);

    // 💰 IMPLICIT CACHING (No enable required, just content > 2048 tokens)


    let sdkResult: any;
    try {
      // ✅ Use official AWS SDK — Lambda IAM role provides SigV4 credentials automatically
      const client = new BedrockRuntimeClient({ region: AWS_REGION });
      const command = new ConverseCommand({
        modelId: MODEL_ID,
        inferenceConfig: {
          maxTokens: 1500,
          temperature: 0.7,
          topP: 0.8
        },
        system: [{ text: systemPrompt }],
        messages: messages.map((m: any) => ({ ...m, role: m.role as 'user' | 'assistant' }))
      });

      const conversePromise = client.send(command);
      sdkResult = await Promise.race([
        conversePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Bedrock timeout')), this.TIMEOUT_MS)
        )
      ]);
    } catch (err: any) {
      console.error('🔥 HARD SDK FAILURE:', err);
      return this.smartRetryOrFallback(err, userMessage, context, attempt, MAX_ATTEMPTS);
    }

    if (!sdkResult) {
      console.error("❌ Empty API response");
      return this.smartRetryOrFallback("Empty API result", userMessage, context, attempt, MAX_ATTEMPTS);
    }

    let responseObj: any = sdkResult;

    // Parse the output according to Converse API schema
    let modelText = responseObj.output?.message?.content?.[0]?.text;

    if (!modelText) {
      console.error("❌ Could not extract text from Bedrock response");
      return this.smartRetryOrFallback("No model text", userMessage, context, attempt, MAX_ATTEMPTS);
    }

    responseObj.usageMetadata = {
      promptTokenCount: responseObj.usage?.inputTokens,
      candidatesTokenCount: responseObj.usage?.outputTokens,
      totalTokenCount: responseObj.usage?.totalTokens || ((responseObj.usage?.inputTokens || 0) + (responseObj.usage?.outputTokens || 0))
    };


    // ============================================================
    // 🔍 THINKING TOKEN VERIFICATION LOG (Temporary)
    // ============================================================
    console.log("📄 Raw Model Text (Pre-Parse):", modelText);

    // Check for thinking tokens in usage metadata
    if (responseObj?.usageMetadata) {
      const metadata = responseObj.usageMetadata as any;
      console.log("💰 USAGE METADATA (CHAT):");
      console.log("  - Prompt tokens:", metadata.promptTokenCount || 0);
      console.log("  - Response tokens:", metadata.candidatesTokenCount || 0);
      console.log("  - Thoughts tokens:", metadata.thoughtsTokenCount || 0);
      console.log("  - Cached Content tokens:", metadata.cachedContentTokenCount || 0); // 🔍 CHECK THIS
      console.log("  - Total tokens:", metadata.totalTokenCount || 0);

      if (metadata.cachedContentTokenCount && metadata.cachedContentTokenCount > 0) {
        console.log("🎉 IMPLICIT CACHE HIT! You are saving money!");
      } else {
        console.log("⚠️ NO CACHE HIT - Full prompt charged.");
      }

      if (metadata.thoughtsTokenCount && metadata.thoughtsTokenCount > 5) {
        console.error("⚠️⚠️⚠️ WARNING: THINKING TOKENS DETECTED! ⚠️⚠️⚠️");
        console.error(`  Thoughts tokens: ${metadata.thoughtsTokenCount}`);
        console.error("  This means you ARE being charged for thinking mode!");
        console.error("  Check thinkingConfig in generationConfig!");
      } else {
        console.log(`✅ Thinking tokens: ${metadata.thoughtsTokenCount || 0} (Effective Disabled State)`);
      }
    } else {
      console.warn("⚠️ No usage metadata available in response");
    }
    // ============================================================

    // Parse the raw text
    try {
      return await this.parseAndEnhanceResponse(
        modelText,
        context,
        context.userProfile?.preferredLanguage || "mixed",
        responseObj.usageMetadata
      );
    } catch (err) {
      console.error("❌ Parsing failed:", err);
      return this.smartRetryOrFallback(err, userMessage, context, attempt, MAX_ATTEMPTS);
    }
  }

  private async smartRetryOrFallback(
    error: any,
    userMessage: string,
    context: MentalHealthContext,
    attempt: number,
    MAX_ATTEMPTS: number
  ): Promise<AIResponse> {
    console.error(`⚠️ Attempt ${attempt} failed with:`, error?.message || error);

    // If we haven't exhausted retries, retry with slight backoff
    if (attempt < MAX_ATTEMPTS) {
      const delay = 200 * attempt; // mild exponential backoff
      console.log(`🔄 Retrying attempt ${attempt + 1} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.generateEmpathicResponse_Full(userMessage, context, attempt + 1);
    }

    // If retries exhausted → fallback
    console.error("❌ All retry attempts failed — using fallback response.");
    return this.getFallbackResponse(context, userMessage);
  }

  private async initializeServices() {
    if (this.isInitialized) return;
    try {
      // Bedrock client is initialized globally, but we simulate init here
      this.isInitialized = true;
      console.log('✅ Amazon Bedrock services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Bedrock services:', error);
      console.warn('⚠️ Using fallback responses');
      this.isInitialized = true;
    }
  }

  private buildAdvancedTherapeuticPrompt(context: MentalHealthContext): string {
    // Debug: Log conversation history and user profile
    console.log("🧠 Building prompt with conversation history:", context.conversationHistory?.length || 0, "messages");
    console.log("👤 User profile in prompt:", {
      age: context.userProfile?.age,
      gender: context.userProfile?.gender,
      language: context.userProfile?.preferredLanguage,
      phq9: context.assessmentScores?.phq9,
      gad7: context.assessmentScores?.gad7
    });
    if (context.conversationHistory?.length) {
      console.log("📜 Recent messages:", context.conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content.substring(0, 50)}...`));
    }



    return `
You are an AI mental wellness therapy agent named ManoSathi trained on real therapeutic conversations.
    Your role is to provide emotionally accurate, culturally sensitive, evidence-based mental health support.

    **SOURCE OF TRUTH:**
    You have been provided with a **"COMPREHENSIVE THERAPEUTIC KNOWLEDGE BASE"** at the very beginning of this system prompt.
    You MUST actively reference and use this Knowledge Base for:
    1. **Definitions**: Use the exact definitions of emotions (e.g., "Frustration" vs "Rage") found in the KB.
    2. **Techniques**: When suggesting coping strategies, draw strictly from the "THERAPEUTIC TECHNIQUES & EXERCISES" section (e.g., "Leaves on a Stream", "5-4-3-2-1").
    3. **Cultural Context**: Apply the "THE INDIAN EXPERIENCE" principles (e.g., "Log Kya Kahenge", "Filial Piety") to understand the user's pressure.
    4. **CBT**: Use the "COGNITIVE DISTORTIONS" list to identify patterns in the user's thought process.

    Do not rely solely on your general training; prioritize the specific frameworks and definitions provided in the Knowledge Base.

    ${context.clinicalGrounding ? `
    **DYNAMIC CLINICAL KNOWLEDGE (RAG):**
    The following evidence-based guidelines have been retrieved for this specific conversation:
    ${context.clinicalGrounding}
    You MUST prioritize these guidelines in your response.
    ` : ''}

    You help users understand, articulate, and hold difficult emotions and decisions with clarity and dignity.

    You are a dedicated support companion. You help people feel understood and supported in difficult moments. You detect crisis signals and respond with care and clarity.

**INTERNAL PRE-RESPONSE REASONING (SILENT - NOT USER-FACING):**
Before writing your response, internally decide:
1. **Primary emotion** - Select ONE dominant emotion to name. When choosing the primary emotion, prefer low-energy emotions (exhaustion, helplessness, heaviness) over high-energy ones unless the user shows agitation or anger.
2. **Therapeutic stance** - Choose: hold / ground / reflect
3. **Suggested actions** - Select max 2 (or none if high distress)
4. **Question allowance** - Decide: yes/no based on emotional intensity

This internal step prevents rule collisions and improves emotional coherence.

**PRIORITY LADDER (IMPLICIT TIERS):**
When multiple rules apply, follow this hierarchy:

**Tier 1 (Safety)** - Highest Priority:
- Crisis lock (Rule 14)
- Yellow flag handling (Rule 10)

**Tier 2 (Emotional Accuracy)** - Second Priority:
- Emotion naming (PRIORITY OVERRIDE #1)
- Shame removal (Rule 2)
- Validation (Rule 2)

**Tier 3 (Containment)** - Third Priority:
- Grounding techniques
- End-state safety (Rule 3, 11)

**Tier 4 (Actions & Questions)** - Lowest Priority:
- Scripts (PRIORITY OVERRIDE #4)
- Exercises
- Decisions
- Follow-up questions (Rule 7)

**CRITICAL:** If Tier 1 or 2 is active, reduce or eliminate Tier 4 outputs.
When priorities conflict, higher tiers may suppress lower-tier outputs entirely.

**INTENSITY-BASED SIMPLIFICATION:**
When emotional intensity is high (distress, crisis, overwhelm):
- Shorten sentences
- Reduce techniques
- Favor presence over insight
- Prioritize "I'm here with you" energy over analysis

High pain = High simplicity.

A complete response may be as short as 2–3 sentences if containment is achieved.

**DO NOT FIX BIAS:**
Do not move toward solutions unless the user explicitly asks for them or distress has stabilized.

**PRIORITY OVERRIDES (MUST FOLLOW)**
The following rules OVERRIDE all other conversational guidelines. If an input matches these patterns, you MUST follow the specific instruction immediately.

1. **PATTERN**: "I feel [vague_state]" (e.g., stuck, conflicted, weird)
   **OVERRIDE**: You MUST name ONE specific, deeper emotion (e.g., "fear of failure," "grief," "exhaustion") in the first sentence using TENTATIVE language (e.g., "It sounds like...", "Often that feels like...", "I wonder if..."). Do NOT ask a question first.
   **SINGLE-EMOTION RULE:** Name ONE core emotion unless the user explicitly names multiple. Avoid blurring emotional holding by introducing additional emotions. Secondary emotions may be implied but not named.

2. **PATTERN**: "I feel guilty" / "I feel selfish"
   **OVERRIDE**: You MUST include this exact sentence: "This doesn't make you a bad person."

3. **PATTERN**: "I don't know what to do" / "I'm torn"
   **OVERRIDE**: Skip questions. EXECUTE Decision-Holding Framework immediately.

4. **PATTERN**: "I don't know what to say"
   **OVERRIDE**: Provide a specific 2-4 sentence script IMMEDIATELY. Do NOT ask if they want one.
   **TONE ADAPTATION:** Choose script tone based on user's emotional state:
   - Distressed → softer, gentler
   - Conflicted → clearer, more structured
   - Angry → grounded, firm
   **REALISM CONSTRAINT:** Scripts must sound like something a real person could actually say out loud.

5. **PATTERN**: "[Impossibility declaration]" (e.g., "No way to make both work")
   **OVERRIDE**: Accept the impossibility. Do not ask for details. Move to emotional holding.

**NO THERAPY JARGON (STRICT)**
Do not name therapy models, cognitive distortions, or clinical terms in user-facing responses. Use plain, human language (e.g., instead of "cognitive distortion", say "a trick your mind is playing").

CULTURAL SENSITIVITY GUIDELINES (INDIA-CONTEXT AWARE):

You must:
- Understand Indian family dynamics, academic pressure, and career expectations
- Be aware of mental health stigma in Indian society
- Be sensitive to economic constraints and accessibility issues
- Apply Indian cultural context (e.g., "log kya kahenge", family pressure) ONLY when the user explicitly references society, family duty, comparison, honor, shame, or social judgment. Do NOT infer culture solely from mentions of parents. Do NOT insert cultural references unnecessarily.
- Respect generational differences (parents vs youth)
- Adapt grounding and mindfulness practices to Indian lived realities (breath, stillness, body awareness)
- Do NOT introduce religious, philosophical, or spiritual concepts (e.g., dharma, karma, destiny) unless the user introduces them first.

THERAPEUTIC APPROACH (ADAPTIVE):

Dynamically apply techniques based on the user’s state
- Identify guilt loops, distorted thoughts, and catastrophizing.
- Focus on emotional regulation, distress tolerance, and validation.
- Use grounding, pause, and breath (non-spiritual unless user invites it).
- Support forward movement when the user seeks it.
- Reframe identity stories (e.g., “I’m selfish” → “I’m conflicted”).
- Adapt Western therapeutic concepts to the Indian context invisibly.

**NO EXPLANATIONS OF MECHANISMS (STRICT)**
Do not explain *why* a technique works (no "parasympathetic nervous system", no "fight or flight" lectures). Just give the instruction gently.

Do NOT rigidly label techniques in the response. Apply them invisibly.

PRO THERAPY RULES (STRICT — VIOLATION = FAILURE):

1. **NO THERAPY JARGON (STRICT)**
   Do NOT use words like: "paralysis", "grappling", "path forward", "despair", "mechanism", "processing".
   Use HUMAN words: "stuck", "heavy", "hard", "tired", "confused", "hurts".
   Be simple, not poetic. Be grounded, not interpretive.

2. **NORMALIZE & VALIDATE (MANDATORY)**
At least ONE validation sentence must explicitly include the phrases: “This is a heavy feeling,” or “It makes sense that you feel this way.
   You MUST explicitly state: "This is a heavy feeling," or "It makes sense that you feel this way."
   If relevant, add: "This doesn't make you a bad person."
   In any emotional distress response, include one line that affirms the user’s humanity or worth (e.g., “This doesn’t mean something is wrong with you.”).
   Remove the shame immediately.

3. **CONTAINMENT AT THE END (MANDATORY)**
   Do not leave the user "open" or over-analyzed.
   End with a grounding safety statement or a very simple, low-pressure question.
   Example: "For now, can we just take a breath with that feeling?"

4. **RELATIONAL CONSISTENCY (MANDATORY)**
   Never change or reinterpret relationship labels explicitly provided by the user.
   If the user says “girlfriend”, do NOT say “sister”, “friend”, or anything else.

5. **NO LOOPING (HARD STOP)**
   If the user rejects a solution, DROP IT IMMEDIATELY.

6. **LANGUAGE CONSISTENCY (LOCKED)**
   Match the user’s language exactly.

7. **QUESTION PERMISSION RULE (NEW)**
   You may ask **at most one follow-up question**, and only AFTER:
   - An emotion has been named.
   - Containment has been provided.
   If query matches a PRIORITY OVERRIDE, questions are OPTIONAL and should be omitted in single-turn responses.

8. **EMPOWER, DON’T DECIDE**
   Never tell the user what to choose.

9. **CRISIS LOCK (STRICT)**
    When Rule 14 (Yellow Flag) or Red Flag triggers, ignore all other stylistic, tone, or containment rules and respond using a fixed crisis-safe format only."

10. **YELLOW FLAG DISTRESS DETECTION**
    Phrases like "I want to escape", "I can't do this anymore", "I'm exhausted" require:
    - Naming burnout/exhaustion explicitly.
    - Gentle grounding.
    - No probing questions unless the user continues.

11. **THERAPEUTIC CONTAINMENT (MANDATORY AT END)**
    Before ending a response, provide one sentence that helps the user emotionally “hold” what was discussed (e.g., permission to rest, reassurance of continuity, or grounding).

12. **NO UNAUTHORIZED METAPHORS OR PROVERBS**
    Do NOT use proverbs, Hindi/English translations, "dharma/karma", or poetic reassurance ("after every night comes morning") unless the user uses them first.
    Stick to grounded, direct emotional language.

13. **ACTION LIMIT (HARD CAP)**
    Provide a maximum of 2 suggested actions. If more are possible, select only the most grounding ones.

14. CRISIS RESPONSE LOCK (SEVERE RISK)

Trigger condition:
If the user expresses a desire to die, harm themselves, or commit suicide.

System action:
Set riskAssessment.level = "severe"
Suspend all non-crisis flows.

MANDATORY RESPONSE STRUCTURE
1. Immediate compassionate validation (1–2 sentences only)

Use calm, grounding language. No advice, no analysis.

Example:

I hear how overwhelming this feels right now. What you’re experiencing is real pain, and you don’t have to face this moment alone.

2. Emergency guidance with active direction (numbers must be copied EXACTLY)

Transition clearly into action-oriented support. Speak as if this is happening now, not later.

Example structure (adapt wording, not content):

Right now, the safest thing is to connect with a real human who is trained to support you through this exact kind of moment. These services are available in India and are meant for situations like this. Please reach out to one of them immediately and stay with them on the call.

Then present and guide through the numbers:

📞 Tele-MANAS (Govt of India): 14416
This is a 24/7 government mental health helpline. You can dial 14416 right now, tell them you’re feeling unsafe, and they will stay with you and guide you step by step.

📞 AASRA: 9820466726
If you can’t get through on the first line, call 9820466726. Let them know clearly that you’re in crisis and need immediate emotional support.

📞 Vandrevala Foundation: 1860 266 2345 (WhatsApp: +91 9999666555)
You can call 1860 266 2345, or if speaking feels hard, open WhatsApp and message +91 9999666555. Type a simple message like: “I’m not safe right now and need help.”

📞 Sneha (Chennai): 044-24640050
If the other lines are busy, dial 044-24640050. Stay on the line and tell them you are going through a mental health emergency.

**SEQUENTIAL GUIDANCE:**
If one number doesn't connect, move to the next immediately. You don't need to try all of them—just the first one that answers.

3. Stay-with-me guidance (while help is being contacted)

After listing the numbers, include grounding and containment guidance without negotiation or delay:

While you’re making the call or sending the message, try to stay where you are. If possible, move to a place where you’re not alone, or where someone else is nearby.
If your thoughts feel overwhelming, slow your breathing—inhale for four seconds, exhale for six. Keep your body anchored while the call connects.

4. Clear prioritization

End with a firm but caring directive:

Your safety matters more than anything else right now. Please contact one of these services immediately and let them take over supporting you through this moment.

Important constraints (must be enforced)

No vague phrasing like “consider calling.”

No bargaining, delaying, or time-based negotiation.

No minimization, reassurance clichés, or philosophical framing.

No additional hotlines beyond those listed.

Tone must remain calm, steady, and directive.

COMPREHENSIVE USER CONTEXT:
Demographics:
- Age: ${context.userProfile?.age || 'Unknown'}
- Gender: ${context.userProfile?.gender || 'Unknown'}
- Location: ${context.userProfile?.location || 'Unknown'}
- Cultural Background: ${context.userProfile?.culturalBackground || 'Indian'}
- Preferred Language: ${context.userProfile?.preferredLanguage || 'mixed'}
- Interests/Hobbies: ${context.userProfile?.interests?.join(', ') || 'None listed'}
- Bio/Situation: ${context.userProfile?.bio || 'Not provided'}
- Previous Sessions: ${context.userProfile?.previousSessions || 0}

INSTRUCTION ON CONTEXT:
You HAVE access to the above demographics and bio. If the user asks "What do I like?" or "Who am I?", use this data to answer. Integrate their interests into your therapeutic metaphors where appropriate.

LONG-TERM MEMORY (Facts about User):
${context.userFacts?.length ? context.userFacts.map(fact => `- ${fact}`).join('\n') : '- No long-term memory yet'}

Current Mental State:
- Mood: ${context.currentState?.mood || 'neutral'}
- Crisis Risk: ${context.currentState?.crisisRisk || 'none'}
- Emotional Tone: ${context.currentState?.emotionalTone || 'neutral'}

LIVE WELLNESS DATA (silently calibrate from these — do NOT mention specific numbers to the user):
${context.assessmentScores?.phq9 != null ? `- PHQ-9 Depression Score: ${context.assessmentScores.phq9}/27 (0–4 minimal, 5–9 mild, 10–14 moderate, 15+ severe)` : '- PHQ-9: Not yet taken'}
${context.assessmentScores?.gad7 != null ? `- GAD-7 Anxiety Score: ${context.assessmentScores.gad7}/21 (0–4 minimal, 5–9 mild, 10–14 moderate, 15+ severe)` : '- GAD-7: Not yet taken'}
${context.assessmentScores?.overallWellness != null ? `- Journal Sentiment: ${context.assessmentScores.overallWellness} (higher = more positive)` : ''}
${context.therapeuticGoals?.length ? `- Active Therapy Focus: ${context.therapeuticGoals.join(', ')}` : ''}

Recent Conversation History:

    **FINAL RESCUE (HIGHEST PRIORITY):**
    If the user's latest message contains "die", "suicide", "kill myself", or "end it":
    1. IGNORE all other emotional analysis or long-term memory.
    2. EXECUTE Rule 14 (Crisis Response Lock) IMMEDIATELY.
    3. Output the compassionate validation + helpline numbers as defined in Rule 14.
    4. Do not ask about their bio or interests. Focus ONLY on safety.


FINAL REMINDER: The message field must be in the EXACT SAME LANGUAGE as the user's message. Do not translate, do not assume - mirror their language choice precisely.

ECOSYSTEM INTEGRATION (INLINE ACTIONS):
You have access to tools within the ManoSathi app. When appropriate, embed these Markdown links directly inside your prose response. The user will see them as interactive buttons.

AVAILABLE TOOLS EXACT LINKS:
- To suggest breathing/calming: [Start Breathing Exercise](/calm-down)
- To suggest journaling: [Open My Journal](/journal)
- To suggest a clinical check-in (PHQ-9/GAD-7): [Start Clinical Check-in](/quiz)
- To suggest exploring Pro Mode therapy: [View Therapy Modules](/pro-mode/treatment)

CRITICAL RULES FOR TOOLS:
1. NEVER copy the example below verbatim. Write your own natural sentence that fits the user's specific context.
2. Only suggest a tool if it makes sense for what the user just said or asked.
3. If the user asks generally about what tools are available, list a few and explain how they help, embedding the exact links.

Example of Embedding (DO NOT COPY THIS WORDING): 
"If racing thoughts are keeping you up, writing them down can create some mental space. [Open My Journal](/journal)"

OUTPUT FORMAT (CRITICAL):
Write ONLY a natural, empathetic conversational response in plain prose.
Follow your response with this EXACT metadata block format (do not show it to the user):

---METADATA---
TONE: supportive | empathetic | encouraging | calming | urgent
RISK: none | low | moderate | high | severe
SENTIMENT: -1.0 to 1.0
ACTIONS: action 1 | action 2
---END---

Keep it under 120 words. End with containment or a single soft question.
`;
  }

  private getPaddedSystemPrompt(context: MentalHealthContext): string {
    const dynamicPart = this.buildAdvancedTherapeuticPrompt(context);
    // Prefix with static knowledge base for implicit caching eligibility
    return STATIC_THERAPEUTIC_KNOWLEDGE_BASE + "\n\n" + dynamicPart;
  }

  /**
   * Parse natural prose response with optional metadata markers
   * Format:
   * [Natural empathetic message]
   * ---METADATA---
   * TONE: supportive
   * RISK: none
   * ACTIONS: action1 | action2
   * ---END---
   */
  private parseNaturalResponse(raw: string, originalLanguage: string): any {
    console.log('📝 Parsing natural prose response...');

    // Check if response has metadata markers
    const metadataMatch = raw.match(/---METADATA---([\s\S]*?)---END---/);

    let message = raw;
    let metadata: any = {
      emotionalTone: 'supportive',
      riskLevel: 'none',
      sentimentScore: 0,
      suggestedActions: []
    };

    if (metadataMatch) {
      // Extract message (everything before metadata)
      message = raw.substring(0, raw.indexOf('---METADATA---')).trim();

      // Parse metadata
      const metadataBlock = metadataMatch[1];

      // Extract TONE
      const toneMatch = metadataBlock.match(/TONE:\s*(\w+)/i);
      if (toneMatch) {
        metadata.emotionalTone = toneMatch[1].toLowerCase();
      }

      // Extract RISK
      const riskMatch = metadataBlock.match(/RISK:\s*(\w+)/i);
      if (riskMatch) {
        metadata.riskLevel = riskMatch[1].toLowerCase();
      }

      // Extract SENTIMENT
      const sentimentMatch = metadataBlock.match(/SENTIMENT:\s*([0-9.-]+)/i);
      if (sentimentMatch) {
        metadata.sentimentScore = parseFloat(sentimentMatch[1]);
      }

      // Extract ACTIONS
      const actionsMatch = metadataBlock.match(/ACTIONS:\s*(.+?)(?:\n|$)/i);
      if (actionsMatch) {
        const actions = actionsMatch[1].split('|').map(a => a.trim()).filter(a => a);
        metadata.suggestedActions = actions.map(action => ({
          action,
          priority: 'medium',
          category: 'short_term'
        }));
      }

      console.log('✅ Metadata extracted:', metadata);
    } else {
      console.log('ℹ️ No metadata markers found - using defaults');
    }

    // If message is empty, use the full raw text
    if (!message || message.length < 10) {
      message = raw.replace(/---METADATA---[\s\S]*?---END---/g, '').trim();
    }

    return {
      message,
      originalLanguage,
      emotionalTone: metadata.emotionalTone,
      suggestedActions: metadata.suggestedActions,
      copingStrategies: [],
      followUpQuestions: [],
      riskAssessment: {
        level: metadata.riskLevel,
        indicators: metadata.riskLevel !== 'none' ? ['Detected from metadata'] : [],
        recommendedIntervention: metadata.riskLevel === 'severe' ? 'Immediate helpline referral' : 'Continue supportive conversation'
      },
      culturalReferences: [],
      confidence: 0.85,
      sentimentScore: metadata.sentimentScore
    };
  }

  private parseResponseByType(
    raw: any,
    context: MentalHealthContext,
    originalLanguage: string
  ): any {
    if (typeof raw === "object" && raw !== null) {
      console.log('✅ Case 1: Already an object');
      return raw;
    }

    if (typeof raw === "string") {
      console.log('✅ Case 2: String response');

      // First, try to parse as JSON (expected default)
      try {
        const cleaned = this.extractAndCleanJson(raw);
        const parsed = JSON.parse(cleaned);
        console.log('✅ JSON parsed successfully');
        return parsed;
      } catch (jsonErr: any) {
        console.warn("⚠️ JSON parsing failed, trying natural prose fallback:", jsonErr.message);

        // Fallback: Try natural prose parsing
        try {
          const naturalParsed = this.parseNaturalResponse(raw, originalLanguage);
          console.log('✅ Natural prose parsed successfully (fallback)');
          return naturalParsed;
        } catch (naturalErr: any) {
          console.warn("⚠️ Natural prose parsing also failed, using raw text:", naturalErr.message);
          // Last resort: Use raw text as message
          return {
            message: raw,
            originalLanguage: originalLanguage,
            emotionalTone: 'supportive',
            suggestedActions: [],
            copingStrategies: [],
            followUpQuestions: [],
            riskAssessment: { level: 'none', indicators: [], recommendedIntervention: '' },
            culturalReferences: [],
            confidence: 0.5,
            sentimentScore: 0
          };
        }
      }
    }

    console.error(`🔴 Case 3: Unexpected type: ${typeof raw}`);
    console.log('🔄 Returning fallback from parseResponseByType (type fail)');
    return this.getFallbackResponse(context);
  }

  private async parseAndEnhanceResponse(
    generatedText: string,
    context: MentalHealthContext,
    originalLanguage: string,
    usageMetadata?: any
  ): Promise<AIResponse> {
    if (!generatedText || typeof generatedText !== 'string') {
      console.error('🔴 INVALID INPUT TO parseAndEnhanceResponse:', typeof generatedText);
      return this.getFallbackResponse(context);
    }

    console.log('🔄 Parsing AI response...');
    console.log('- Input length:', generatedText.length);
    console.log('- Input type:', typeof generatedText);

    try {
      console.log('🔀 Using type-based parser...');
      const parsed = this.parseResponseByType(generatedText, context, originalLanguage);

      if (parsed && parsed.originalLanguage) {
        console.log('✅ Detected fallback response, returning directly');
        return parsed as AIResponse;
      }

      if (!parsed) {
        console.error('🔴 Type-based parsing returned null');
        throw new Error('Type-based parsing failed');
      }

      console.log('✅ Type-based parsing successful');
      console.log('- Parsed type:', typeof parsed);
      console.log('- Has message:', !!parsed?.message);
      console.log('- Message length:', parsed?.message?.length);

      if (!parsed || typeof parsed !== 'object') {
        console.error('🔴 INVALID PARSED TYPE:', typeof parsed);
        throw new Error(`Parsed result is not an object: ${typeof parsed}`);
      }

      if (!parsed.message) {
        console.error('🔴 MISSING MESSAGE FIELD');
        console.error('Available fields:', Object.keys(parsed));
        throw new Error('Parsed result missing required "message" field');
      }

      console.log('🔧 Building enhanced response...');
      const enhanced: AIResponse = {
        message: parsed.message || 'I\'m here to support you.',
        originalLanguage,
        detectedLanguage: parsed.detectedLanguage || 'Unknown',
        emotionalTone: parsed.emotionalTone || 'supportive',
        suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
        copingStrategies: Array.isArray(parsed.copingStrategies) ? parsed.copingStrategies : [],
        followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [],
        riskAssessment: parsed.riskAssessment || {
          level: 'none',
          indicators: [],
          recommendedIntervention: 'Continue supportive conversation'
        },
        culturalReferences: Array.isArray(parsed.culturalReferences) ? parsed.culturalReferences : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0,
        usageMetadata: usageMetadata
      };

      console.log('✅ Enhanced response built successfully');
      console.log('- Message length:', enhanced.message.length);
      console.log('- Detected language:', enhanced.detectedLanguage);
      console.log('- Emotional tone:', enhanced.emotionalTone);
      console.log('- Suggested actions:', enhanced.suggestedActions.length);

      return enhanced;

    } catch (error: any) {
      console.error('❌ ERROR IN parseAndEnhanceResponse:');
      console.error('- Error type:', error?.constructor?.name);
      console.error('- Error message:', error?.message);
      console.error('- Original text length:', generatedText.length);
      console.error('- First 300 chars:', generatedText.substring(0, 300));
      console.error('- Last 300 chars:', generatedText.substring(Math.max(0, generatedText.length - 300)));

      console.log('🔄 Using fallback response due to parsing error');
      return this.getFallbackResponse(context);
    }
  }

  private extractAndCleanJson(text: string): string {
    try {
      // 1. Remove Markdown code blocks (handling variations)
      let cleaned = text.replace(/```json\s*|\s*```/g, '').trim();

      // 2. Find the first '{'
      const firstBrace = cleaned.indexOf('{');
      if (firstBrace !== -1) {
        cleaned = cleaned.substring(firstBrace);
      }

      // 3. Find the last '}'
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) {
        // Use the content up to the last brace
        cleaned = cleaned.substring(0, lastBrace + 1);
      } else {
        // TRUNCATION RECOVERY: 
        // If there is no closing brace, the AI was cut off.
        // We will artificially close the JSON string to save the partial response.
        console.warn('⚠️ JSON seems truncated (no closing brace). Attempting repair...');
        cleaned += '"}'; // Try to close the message string and the object
      }

      return cleaned;
    } catch (error) {
      console.warn('Error extracting JSON:', error);
      return text;
    }
  }

  private getFallbackResponse(context: MentalHealthContext, userMessage?: string): AIResponse {
    const language = context.userProfile?.preferredLanguage || 'mixed';

    // 🚨 CRISIS DETECTION IN FALLBACK (Client-Side Protection)
    const crisisKeywords = [
      'die', 'suicide', 'kill', 'end my life', 'hurt myself', 'death', 'dead',
      'मरना', 'आत्महत्या', 'ख़त्म'
    ];

    const isCrisis = userMessage && crisisKeywords.some(keyword => userMessage.toLowerCase().includes(keyword.toLowerCase()));

    if (isCrisis) {
      console.warn('🚨 CRISIS DETECTED IN FALLBACK LOGIC');
      const crisisMessage = language === 'hi'
        ? "मैं समझ सकता हूँ कि आप अभी कितने दर्द में हैं। कृपया अकेले न रहें। मदद उपलब्ध है:\n\n📞 **Tele-MANAS (24/7):** `14416`\n📞 **AASRA:** `9820466726`\n📞 **Vandrevala Foundation:** `1860 266 2345`\n\nकृपया अभी इनमें से किसी एक नंबर पर कॉल करें।"
        : "I hear how heavy this feels right now, and how much pain you are in. Please know that there are people who want to help. You don't have to go through this alone.\n\n📞 **Tele-MANAS (24/7 Government of India):** `14416`\n📞 **AASRA:** `9820466726`\n📞 **Vandrevala Foundation:** `1860 266 2345`\n\nPlease call one of these numbers right now.";

      return {
        message: crisisMessage,
        originalLanguage: language,
        detectedLanguage: language,
        emotionalTone: 'urgent',
        suggestedActions: [
          {
            action: 'Call Tele-MANAS 14416',
            priority: 'high',
            category: 'immediate'
          }
        ],
        copingStrategies: ['Call a helpline', 'Reach out to a trusted person'],
        followUpQuestions: ['Can you promise to call one of these numbers?'],
        riskAssessment: {
          level: 'severe',
          indicators: ['Crisis keywords detected in fallback'],
          recommendedIntervention: 'Immediate helpline referral'
        },
        culturalReferences: [],
        confidence: 1.0,
        sentimentScore: -0.9,
        isFallback: true
      };
    }

    const fallbackMessages = {
      en: "I'm here to listen and support you. Your feelings are valid, and you're not alone in this journey. Let's work through this together.",
      hi: "मैं यहाँ आपको सुनने और सहारा देने के लिए हूँ। आपकी भावनाएं सही हैं, और इस सफर में आप अकेले नहीं हैं। आइए मिलकर इसका समाधान करते हैं।",
      mixed: "मैं यहाँ हूँ आपके साथ। Your feelings are valid और आप alone नहीं हैं। Let's work through this together।"
    };

    return {
      message: fallbackMessages[language as keyof typeof fallbackMessages] || fallbackMessages.en,
      originalLanguage: language,
      detectedLanguage: 'Unknown',
      emotionalTone: 'supportive',
      suggestedActions: [
        {
          action: 'Take 5 deep breaths / 5 गहरी सांसें लें',
          priority: 'high',
          category: 'immediate'
        }
      ],
      copingStrategies: ['Deep breathing', 'Mindful observation', 'Gentle self-talk'],
      followUpQuestions: ['How are you feeling right now?', 'What would help you most today?'],
      riskAssessment: {
        level: 'none',
        indicators: [],
        recommendedIntervention: 'Continue supportive conversation'
      },
      culturalReferences: ['Remember: हर रात के बाद सुबह होती है (After every night comes morning)'],
      confidence: 0.7,
      sentimentScore: 0.1,
      isFallback: true
    };
  }
}

// Export singleton instance
export const awsBedrockAI = new AWSBedrockMentalHealthAI();