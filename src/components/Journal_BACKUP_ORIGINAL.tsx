import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import {
  ArrowLeft, Save, Loader2, Edit, Trash2, X,
  Sparkles, Calendar, Heart, Brain, PenLine
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { awsService, JournalEntry } from '../services/awsService';
import { toast } from 'sonner';
import type { Screen } from '../types';
import { activityLogger } from '../services/activityLogger';
import type { MoodType } from '../types/activity';

interface JournalProps {
  navigateTo?: (screen: Screen) => void;
}

export function Journal({ navigateTo }: JournalProps = {}) {
  const { currentUser } = useAuth();
  const [currentEntry, setCurrentEntry] = useState('');
  const [mood, setMood] = useState('');
  const [savedEntries, setSavedEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Track writing session start time
  const writingStartTime = useRef<number | null>(null);

  // Localization function for UI labels
  const getLocalizedText = (key: string, language: string = 'en'): string => {
    const translations: Record<string, Record<string, string>> = {
      // Page titles
      'dailyJournal': {
        'en': 'Daily Journal',
        'hi': 'दैनिक डायरी',
        'ta': 'தினசரி நாட்குறிப்பு',
        'gu': 'દૈનિક ડાયરી',
        'bn': 'দৈনিক জার্নাল',
        'te': 'రోజువారీ జర్నల్',
        'mr': 'दैनिक डायरी',
        'kn': 'ದೈನಂದಿನ ಜರ್ನಲ್',
        'ml': 'ദിനപത്രിക',
        'pa': 'ਰੋਜ਼ਾਨਾ ਜਰਨਲ',
        'ur': 'روزانہ جرنل',
        'or': 'ଦୈନିକ ଜର୍ଣ୍ଣାଲ',
        'as': 'দৈনিক জাৰ্নেল'
      },
      'reflectMoment': {
        'en': 'Take a moment to reflect on your day.',
        'hi': 'अपने दिन पर विचार करने के लिए एक पल लें।',
        'ta': 'உங்கள் நாளைப் பற்றி சிந்திக்க சிறிது நேரம் எடுத்துக்கொள்ளுங்கள்.',
        'gu': 'તમારા દિવસ પર વિચાર કરવા માટે એક ક્ષણ લો.',
        'bn': 'আপনার দিন সম্পর্কে চিন্তা করতে একটু সময় নিন।',
        'te': 'మీ రోజు గురించి ఆలోచించడానికి కొంత సమయం తీసుకోండి.',
        'mr': 'तुमच्या दिवसावर विचार करण्यासाठी थोडा वेळ घ्या.',
        'kn': 'ನಿಮ್ಮ ದಿನದ ಬಗ್ಗೆ ಯೋಚಿಸಲು ಸ್ವಲ್ಪ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳಿ.',
        'ml': 'നിങ്ങളുടെ ദിവസത്തെക്കുറിച്ച് ചിന്തിക്കാൻ ഒരു നിമിഷം എടുക്കുക.',
        'pa': 'ਆਪਣੇ ਦਿਨ ਬਾਰੇ ਸੋਚਣ ਲਈ ਇੱਕ ਪਲ ਲਓ।',
        'ur': 'اپنے دن پر غور کرنے کے لیے ایک لمحہ نکالیں۔',
        'or': 'ଆପଣଙ୍କ ଦିନ ବିଷୟରେ ଚିନ୍ତା କରିବାକୁ କିଛି ସମୟ ନିଅନ୍ତୁ।',
        'as': 'আপোনাৰ দিনটোৰ বিষয়ে চিন্তা কৰিবলৈ এটা মুহূৰ্ত লওক।'
      },
      'newReflection': {
        'en': 'New Reflection',
        'hi': 'नया विचार',
        'ta': 'புதிய சிந்தனை',
        'gu': 'નવો વિચાર',
        'bn': 'নতুন চিন্তা',
        'te': 'కొత్త ఆలోచన',
        'mr': 'नवीन विचार',
        'kn': 'ಹೊಸ ಚಿಂತನೆ',
        'ml': 'പുതിയ ചിന്ത',
        'pa': 'ਨਵਾਂ ਵਿਚਾਰ',
        'ur': 'نیا خیال',
        'or': 'ନୂତନ ଚିନ୍ତା',
        'as': 'নতুন চিন্তা'
      },
      'editingEntry': {
        'en': 'Editing Entry',
        'hi': 'संपादन',
        'ta': 'திருத்துகிறது',
        'gu': 'સંપાદન',
        'bn': 'সম্পাদনা',
        'te': 'సవరణ',
        'mr': 'संपादन',
        'kn': 'ಸಂಪಾದನೆ',
        'ml': 'എഡിറ്റിംഗ്',
        'pa': 'ਸੰਪਾਦਨ',
        'ur': 'ترمیم',
        'or': 'ସମ୍ପାଦନା',
        'as': 'সম্পাদনা'
      },
      'cancel': {
        'en': 'Cancel',
        'hi': 'रद्द करें',
        'ta': 'ரத்து',
        'gu': 'રદ કરો',
        'bn': 'বাতিল',
        'te': 'రద్దు',
        'mr': 'रद्द करा',
        'kn': 'ರದ್ದು',
        'ml': 'റദ്ദാക്കുക',
        'pa': 'ਰੱਦ ਕਰੋ',
        'ur': 'منسوخ',
        'or': 'ବାତିଲ',
        'as': 'বাতিল'
      },
      'howFeeling': {
        'en': 'How are you feeling?',
        'hi': 'आप कैसा महसूस कर रहे हैं?',
        'ta': 'நீ எப்படி உணர்கிறாய்?',
        'gu': 'તું કેવું અનુભવે છે?',
        'bn': 'তুমি কেমন অনুভব করছ?',
        'te': 'నువ్వు ఎలా ఫీల్ అవుతున్నావు?',
        'mr': 'तू कसं वाटतंय?',
        'kn': 'ನೀನು ಹೇಗೆ ಅನಿಸುತ್ತಿದೆ?',
        'ml': 'നീ എങ്ങനെ തോന്നുന്നു?',
        'pa': 'ਤੂੰ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਿਹਾ ਹੈਂ?',
        'ur': 'تم کیسا محسوس کر رہے ہو؟',
        'or': 'ତୁମେ କିପରି ଅନୁଭବ କରୁଛ?',
        'as': 'তুমি কেনে অনুভৱ কৰিছা?'
      },
      'yourThoughts': {
        'en': 'Your Thoughts',
        'hi': 'आपके विचार',
        'ta': 'உன் எண்ணங்கள்',
        'gu': 'તારા વિચારો',
        'bn': 'তোমার চিন্তা',
        'te': 'నీ ఆలోచనలు',
        'mr': 'तुझे विचार',
        'kn': 'ನಿನ್ನ ಆಲೋಚನೆಗಳು',
        'ml': 'നിന്റെ ചിന്തകൾ',
        'pa': 'ਤੇਰੇ ਵਿਚਾਰ',
        'ur': 'تمہارے خیالات',
        'or': 'ତୁମର ଚିନ୍ତା',
        'as': 'তোমাৰ চিন্তা'
      },
      'placeholder': {
        'en': "What's on your mind today?...",
        'hi': 'आज आपके मन में क्या है?...',
        'ta': 'இன்று உன் மனதில் என்ன இருக்கிறது?...',
        'gu': 'આજે તારા મનમાં શું છે?...',
        'bn': 'আজ তোমার মনে কী আছে?...',
        'te': 'ఈరోజు నీ మనసులో ఏముంది?...',
        'mr': 'आज तुझ्या मनात काय आहे?...',
        'kn': 'ಇಂದು ನಿನ್ನ ಮನಸ್ಸಿನಲ್ಲಿ ಏನಿದೆ?...',
        'ml': 'ഇന്ന് നിന്റെ മനസ്സിൽ എന്താണ്?...',
        'pa': 'ਅੱਜ ਤੇਰੇ ਮਨ ਵਿੱਚ ਕੀ ਹੈ?...',
        'ur': 'آج تمہارے ذہن میں کیا ہے؟...',
        'or': 'ଆଜି ତୁମ ମନରେ କଣ ଅଛି?...',
        'as': 'আজি তোমাৰ মনত কি আছে?...'
      },
      'characters': {
        'en': 'characters',
        'hi': 'अक्षर',
        'ta': 'எழுத்துகள்',
        'gu': 'અક્ષરો',
        'bn': 'অক্ষর',
        'te': 'అక్షరాలు',
        'mr': 'अक्षरे',
        'kn': 'ಅಕ್ಷರಗಳು',
        'ml': 'അക്ഷരങ്ങൾ',
        'pa': 'ਅੱਖਰ',
        'ur': 'حروف',
        'or': 'ଅକ୍ଷର',
        'as': 'আখৰ'
      },
      'saveReflection': {
        'en': 'Save Reflection',
        'hi': 'सहेजें',
        'ta': 'சேமி',
        'gu': 'સાચવો',
        'bn': 'সংরক্ষণ',
        'te': 'సేవ్',
        'mr': 'जतन करा',
        'kn': 'ಉಳಿಸು',
        'ml': 'സേവ് ചെയ്യുക',
        'pa': 'ਸੰਭਾਲੋ',
        'ur': 'محفوظ کریں',
        'or': 'ସଞ୍ଚୟ',
        'as': 'সংৰক্ষণ'
      },
      'pastReflections': {
        'en': 'Past Reflections',
        'hi': 'पिछले विचार',
        'ta': 'கடந்த சிந்தனைகள்',
        'gu': 'ભૂતકાળના વિચારો',
        'bn': 'অতীত চিন্তা',
        'te': 'గత ఆలోచనలు',
        'mr': 'मागील विचार',
        'kn': 'ಹಿಂದಿನ ಚಿಂತನೆಗಳು',
        'ml': 'മുൻകാല ചിന്തകൾ',
        'pa': 'ਪੁਰਾਣੇ ਵਿਚਾਰ',
        'ur': 'ماضی کے خیالات',
        'or': 'ଅତୀତ ଚିନ୍ତା',
        'as': 'পুৰণি চিন্তা'
      },
      'noEntries': {
        'en': 'No entries yet.',
        'hi': 'अभी तक कोई प्रविष्टि नहीं।',
        'ta': 'இன்னும் எதுவும் இல்லை.',
        'gu': 'હજી કોઈ એન્ટ્રી નથી.',
        'bn': 'এখনও কোনো এন্ট্রি নেই।',
        'te': 'ఇంకా ఎంట్రీలు లేవు.',
        'mr': 'अद्याप कोणतीही नोंद नाही.',
        'kn': 'ಇನ್ನೂ ಯಾವುದೇ ಎಂಟ್ರಿಗಳಿಲ್ಲ.',
        'ml': 'ഇതുവരെ എൻട്രികളൊന്നുമില്ല.',
        'pa': 'ਅਜੇ ਕੋਈ ਐਂਟਰੀ ਨਹੀਂ।',
        'ur': 'ابھی تک کوئی اندراج نہیں۔',
        'or': 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପ୍ରବିଷ୍ଟି ନାହିଁ।',
        'as': 'এতিয়ালৈকে কোনো এন্ট্ৰি নাই।'
      },
      // Mood labels
      'amazing': { 'en': 'Amazing', 'hi': 'शानदार', 'ta': 'அருமை', 'gu': 'અદ્ભુત', 'bn': 'অসাধারণ', 'te': 'అద్భుతం', 'mr': 'अप्रतिम', 'kn': 'ಅದ್ಭುತ', 'ml': 'അത്ഭുതം', 'pa': 'ਸ਼ਾਨਦਾਰ', 'ur': 'شاندار', 'or': 'ଅଦ୍ଭୁତ', 'as': 'আচৰিত' },
      'good': { 'en': 'Good', 'hi': 'अच्छा', 'ta': 'நல்லது', 'gu': 'સારું', 'bn': 'ভালো', 'te': 'మంచి', 'mr': 'चांगले', 'kn': 'ಒಳ್ಳೆಯದು', 'ml': 'നല്ലത്', 'pa': 'ਚੰਗਾ', 'ur': 'اچھا', 'or': 'ଭଲ', 'as': 'ভাল' },
      'okay': { 'en': 'Okay', 'hi': 'ठीक', 'ta': 'சரி', 'gu': 'ઠીક', 'bn': 'ঠিক', 'te': 'సరే', 'mr': 'ठीक', 'kn': 'ಸರಿ', 'ml': 'ശരി', 'pa': 'ਠੀਕ', 'ur': 'ٹھیک', 'or': 'ଠିକ', 'as': 'ঠিক' },
      'low': { 'en': 'Low', 'hi': 'उदास', 'ta': 'மனம் சரியில்லை', 'gu': 'નીચું', 'bn': 'খারাপ', 'te': 'తక్కువ', 'mr': 'खालचे', 'kn': 'ಕಡಿಮೆ', 'ml': 'താഴ്ന്ന', 'pa': 'ਘੱਟ', 'ur': 'کم', 'or': 'କମ', 'as': 'কম' },
      'rough': { 'en': 'Rough', 'hi': 'कठिन', 'ta': 'கஷ்டம்', 'gu': 'મુશ્કેલ', 'bn': 'কঠিন', 'te': 'కష్టం', 'mr': 'कठीण', 'kn': 'ಕಷ್ಟ', 'ml': 'പ്രയാസം', 'pa': 'ਔਖਾ', 'ur': 'مشکل', 'or': 'କଷ୍ଟ', 'as': 'কঠিন' }
    };

    return translations[key]?.[language] || translations[key]?.['en'] || key;
  };

  // UI Language - LOCKED TO ENGLISH
  // The UI stays in English, but AI responses will still be in the user's language
  const [uiLanguage] = useState<string>('en'); // Always English

  // DISABLED: Dynamic UI language switching
  // This was causing UI to change languages when user typed in other languages
  // Now UI stays in English while AI responds in user's language
  /*
  useEffect(() => {
    if (currentEntry.length > 10) {
      const detectedLang = detectLanguageFromContent(currentEntry);
      setUiLanguage(detectedLang);
    }
  }, [currentEntry]);
  */

  // Simplified Mood Options - now using localized labels
  const moodOptions = [
    { id: 'very_happy', labelKey: 'amazing', icon: '😄' },
    { id: 'happy', labelKey: 'good', icon: '🙂' },
    { id: 'neutral', labelKey: 'okay', icon: '😐' },
    { id: 'sad', labelKey: 'low', icon: '😔' },
    { id: 'very_sad', labelKey: 'rough', icon: '😫' }
  ];

  // --- Real-time Listener ---
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
      },
      20
    );
    return () => unsubscribe();
  }, [currentUser]);

  // --- Handlers ---
  const handleSave = async () => {
    if (!currentUser || !currentEntry.trim() || !mood) return;

    setSaving(true);
    try {
      // Calculate duration if tracking
      const duration = writingStartTime.current
        ? Math.floor((Date.now() - writingStartTime.current) / 1000)
        : undefined;

      const wordCount = currentEntry.trim().split(/\s+/).length;

      if (editingEntry) {
        // Update
        await awsService.updateJournalEntry(editingEntry.entryId, {
          content: currentEntry.trim(),
          mood: mood as any,
          emotions: [mood]
        });
        toast.success('Reflection updated');
      } else {
        // Create
        await awsService.createJournalEntry({
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

        // Log activity
        await activityLogger.logActivity(
          currentUser.uid,
          'journal',
          'journal_entry_created',
          {
            wordCount,
            mood: mood as MoodType,
            duration,
            gratitudeCount: (currentEntry.match(/grateful|thankful|blessed|appreciate/gi) || []).length
          }
        );

        toast.success('Reflection saved');
      }

      // Reset
      setCurrentEntry('');
      setMood('');
      setEditingEntry(null);
      writingStartTime.current = null;
    } catch (error) {
      toast.error('Could not save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setCurrentEntry(entry.content);
    setMood(entry.mood);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (entryId: string) => {
    if (window.confirm('Delete this memory?')) {
      try {
        await awsService.deleteJournalEntry(entryId);
        toast.success('Deleted');
      } catch (e) { toast.error('Failed to delete'); }
    }
  };

  const formatDate = (date: Date | any) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to detect language from text content
  const detectLanguageFromContent = (text: string): string => {
    if (!text) return 'en';

    // Check for various Indian language scripts
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi/Marathi (Devanagari)
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali/Assamese
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'; // Punjabi
    if (/[\u0600-\u06FF]/.test(text)) return 'ur'; // Urdu
    if (/[\u0B00-\u0B7F]/.test(text)) return 'or'; // Odia

    return 'en'; // Default to English
  };

  // Helper function to validate AI response language matches content language
  const validateLanguageMatch = (aiResponse: string, contentLanguage: string, detectedLanguage?: string): boolean => {
    // If AI explicitly provided detectedLanguage, use that
    const aiLang = detectedLanguage || detectLanguageFromContent(aiResponse);

    // Allow match if languages are the same, or if content is English (fallback allowed)
    return aiLang === contentLanguage || contentLanguage === 'en';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* --- LEFT COLUMN: EDITOR (Span 7) --- */}
        <div className="lg:col-span-7 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{getLocalizedText('dailyJournal', uiLanguage)}</h1>
            <div className="h-px flex-1 bg-slate-200 ml-4"></div>
          </div>
          <p className="text-slate-500 -mt-4 mb-6">{getLocalizedText('reflectMoment', uiLanguage)}</p>

          <Card className="border-none shadow-lg shadow-slate-200/50 bg-white overflow-hidden">
            {/* Editor Header */}
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <PenLine className="w-4 h-4 text-[var(--mm-primary)]" />
                {editingEntry ? getLocalizedText('editingEntry', uiLanguage) : getLocalizedText('newReflection', uiLanguage)}
              </div>
              {editingEntry && (
                <Button variant="ghost" size="sm" onClick={() => { setEditingEntry(null); setCurrentEntry(''); setMood(''); }}>
                  <X className="w-4 h-4 mr-1" /> {getLocalizedText('cancel', uiLanguage)}
                </Button>
              )}
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* 1. Mood Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">{getLocalizedText('howFeeling', uiLanguage)}</label>
                <div className="flex flex-wrap gap-3">
                  {moodOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={async () => {
                        setMood(opt.id);
                        // Log mood selection
                        if (currentUser) {
                          await activityLogger.logActivity(
                            currentUser.uid,
                            'journal',
                            'mood_selected',
                            { mood: opt.id as MoodType }
                          );
                        }
                      }}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                        ${mood === opt.id
                          ? 'bg-[var(--mm-primary)] text-white shadow-md shadow-emerald-100 scale-105'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }
                      `}
                    >
                      <span>{opt.icon}</span>
                      <span>{getLocalizedText(opt.labelKey, uiLanguage)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Text Area */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">{getLocalizedText('yourThoughts', uiLanguage)}</label>
                <Textarea
                  value={currentEntry}
                  onChange={(e) => {
                    setCurrentEntry(e.target.value);
                    // Track writing start time on first keystroke
                    if (!writingStartTime.current && e.target.value.length === 1) {
                      writingStartTime.current = Date.now();
                    }
                  }}
                  placeholder={getLocalizedText('placeholder', uiLanguage)}
                  className="
                    min-h-[250px] resize-none border-0 bg-slate-50/50 rounded-xl p-6
                    text-lg leading-relaxed text-slate-700
                    placeholder:text-slate-300 focus-visible:ring-0 focus:bg-white transition-all
                  "
                />
              </div>

              {/* 3. Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  {currentEntry.length} {getLocalizedText('characters', uiLanguage)}
                </div>
                <Button
                  onClick={handleSave}
                  disabled={(!currentEntry.trim() || !mood) || saving}
                  className="bg-[var(--mm-primary)] hover:opacity-90 text-white px-8 h-12 rounded-xl font-medium shadow-lg shadow-emerald-100 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> {getLocalizedText('saveReflection', uiLanguage)}</>}
                </Button>
              </div>
            </div>
          </Card>
        </div>


        {/* --- RIGHT COLUMN: HISTORY (Span 5) --- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-xl font-semibold text-slate-800">{getLocalizedText('pastReflections', uiLanguage)}</h2>
            <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{savedEntries.length}</span>
          </div>

          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 scrollbar-none">
            {loading ? (
              <div className="text-center py-10 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : savedEntries.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                <p>{getLocalizedText('noEntries', uiLanguage)}</p>
              </div>
            ) : (
              savedEntries.map((entry) => (
                <div
                  key={entry.entryId}
                  className="group bg-white rounded-xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 relative"
                >
                  {/* Entry Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{moodOptions.find(m => m.id === entry.mood)?.icon || '⚪'}</span>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">{entry.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(entry.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Actions (Visible on Hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(entry)}>
                        <Edit className="w-3 h-3 text-slate-400 hover:text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(entry.entryId)}>
                        <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Entry Content Preview */}
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-3">
                    {entry.content}
                  </p>

                  {/* AI Insights - Single Conversational Response with Language Validation */}
                  {entry.aiInsights && entry.aiInsights.summary && (() => {
                    const insights = entry.aiInsights as any;

                    // Detect language for section headers
                    const lang = insights.detectedLanguage || 'en';

                    // Multilingual section headers
                    const headers: Record<string, Record<string, string>> = {
                      conversational: {
                        en: '💬 Response',
                        hi: '💬 प्रतिक्रिया',
                        ta: '💬 பதில்',
                        gu: '💬 પ્રતિસાદ',
                        bn: '💬 প্রতিক্রিয়া',
                        te: '💬 ప్రతిస్పందన',
                        mr: '💬 प्रतिसाद',
                        kn: '💬 ಪ್ರತಿಕ್ರಿಯೆ',
                        ml: '💬 പ്രതികരണം',
                      },
                      therapeutic: {
                        en: '🧠 Therapeutic Perspective',
                        hi: '🧠 चिकित्सीय दृष्टिकोण',
                        ta: '🧠 சிகிச்சை பார்வை',
                        gu: '🧠 ઉપચારાત્મક દ્રષ્ટિકોણ',
                        bn: '🧠 থেরাপিউটিক দৃষ্টিভঙ্গি',
                        te: '🧠 చికిత్సా దృక్పథం',
                        mr: '🧠 उपचारात्मक दृष्टीकोन',
                        kn: '🧠 ಚಿಕಿತ್ಸಾ ದೃಷ್ಟಿಕೋನ',
                        ml: '🧠 ചികിത്സാ കാഴ്ചപ്പാട്',
                      },
                      thoughts: {
                        en: '🔍 Thought Patterns',
                        hi: '🔍 विचार पैटर्न',
                        ta: '🔍 சிந்தனை முறைகள்',
                        gu: '🔍 વિચાર પેટર્ન',
                        bn: '🔍 চিন্তার ধরণ',
                        te: '🔍 ఆలోచన నమూనాలు',
                        mr: '🔍 विचार पद्धती',
                        kn: '🔍 ಆಲೋಚನಾ ಮಾದರಿಗಳು',
                        ml: '🔍 ചിന്താ രീതികൾ',
                      },
                      emotions: {
                        en: '💭 Emotional Nuance',
                        hi: '💭 भावनात्मक सूक्ष्मता',
                        ta: '💭 உணர்ச்சி நுணுக்கம்',
                        gu: '💭 ભાવનાત્મક સૂક્ષ્મતા',
                        bn: '💭 আবেগের সূক্ষ্মতা',
                        te: '💭 భావోద్వేగ సూక్ష్మత',
                        mr: '💭 भावनिक सूक्ष्मता',
                        kn: '💭 ಭಾವನಾತ್ಮಕ ಸೂಕ್ಷ್ಮತೆ',
                        ml: '💭 വൈകാരിക സൂക്ഷ്മത',
                      },
                      tryThis: {
                        en: '💡 Try This',
                        hi: '💡 यह आज़माएं',
                        ta: '💡 இதை முயற்சி செய்யுங்கள்',
                        gu: '💡 આ અજમાવો',
                        bn: '💡 এটি চেষ্টা করুন',
                        te: '💡 దీన్ని ప్రయత్నించండి',
                        mr: '💡 हे करून पहा',
                        kn: '💡 ಇದನ್ನು ಪ್ರಯತ್ನಿಸಿ',
                        ml: '💡 ഇത് പരീക്ഷിക്കൂ',
                      },
                      themes: {
                        en: '🏷️ Key Themes',
                        hi: '🏷️ मुख्य विषय',
                        ta: '🏷️ முக்கிய தலைப்புகள்',
                        gu: '🏷️ મુખ્ય વિષયો',
                        bn: '🏷️ মূল বিষয়',
                        te: '🏷️ ముఖ్య అంశాలు',
                        mr: '🏷️ मुख्य विषय',
                        kn: '🏷️ ಪ್ರಮುಖ ವಿಷಯಗಳು',
                        ml: '🏷️ പ്രധാന വിഷയങ്ങൾ',
                      },
                    };

                    const getHeader = (key: string) => headers[key]?.[lang] || headers[key]?.['en'] || key;

                    return (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {/* Conversational Response */}
                        {(insights.conversationalResponse || insights.summary) && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">
                              {getHeader('conversational')}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {insights.conversationalResponse || insights.summary}
                            </p>
                          </div>
                        )}

                        {/* Therapeutic Perspective */}
                        {insights.therapeuticPerspective && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">
                              {getHeader('therapeutic')}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {insights.therapeuticPerspective}
                            </p>
                          </div>
                        )}

                        {/* Thought Patterns */}
                        {insights.thoughtPatterns && (
                          <div className="bg-amber-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-amber-900 mb-2">
                              {getHeader('thoughts')}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {insights.thoughtPatterns}
                            </p>
                          </div>
                        )}

                        {/* Emotional Nuance */}
                        {insights.emotionalNuance && (
                          <div className="bg-pink-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-pink-900 mb-2">
                              {getHeader('emotions')}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {insights.emotionalNuance}
                            </p>
                          </div>
                        )}

                        {/* Try This */}
                        {insights.tryThis && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-green-900 mb-2">
                              {getHeader('tryThis')}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {insights.tryThis}
                            </p>
                          </div>
                        )}

                        {/* Key Themes (as tags) */}
                        {insights.keyThemes && insights.keyThemes.length > 0 && (
                          <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">
                              {getHeader('themes')}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {insights.keyThemes.map((theme: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200"
                                >
                                  {theme}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Backend metadata is NOT displayed (sentimentScore, riskFlags, etc.) */}
                      </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Journal;