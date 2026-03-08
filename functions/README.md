# ManoSathi 1.0 - Firebase Functions

**Currently Implemented:** Journal AI Analysis Only

## 📁 Structure

```
functions/
├── src/
│   ├── index.ts                    # Main function export
│   └── journalAIAnalysis.ts       # Journal AI analysis logic
├── package.json                    # Minimal dependencies
├── tsconfig.json                   # TypeScript config
└── .env                           # API keys (create from .env.example)
```

## 🚀 Setup

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Configure API Key
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

### 3. Build
```bash
npm run build
```

## 🧪 Local Testing

```bash
# From root ManoSathi1.0 folder
firebase emulators:start
```

## 🌐 Deploy

```bash
# From root ManoSathi1.0 folder
firebase deploy --only functions
```

## 📋 Available Functions

### `analyzeJournalEntry` (Firestore Trigger)
- **Trigger:** `journal_entries/{entryId}` document write
- **Purpose:** Analyzes journal content using Google Gemini 2.0 Flash
- **Output:** Adds `aiInsights` field with:
  - Conversational response
  - Therapeutic perspective
  - Thought patterns
  - Emotional nuance
  - Suggested actions
  - Key themes

## 🔑 Required

- Google Gemini API Key (in `.env`)
- Firebase project initialized

## 📝 Notes

- Only analyzes NEW entries (skips if already analyzed)
- Uses Gemini 2.0 Flash model
- Supports multilingual analysis (auto-detects language)

---

**This is a minimal functions setup - only includes what's needed for current features!**
