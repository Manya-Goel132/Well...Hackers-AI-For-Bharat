/**
 * Language Detection Utility for Indian Languages
 * 
 * Detects language from text based on Unicode character ranges
 */

interface LanguagePattern {
    name: string;
    pattern: RegExp;
    priority: number; // Higher priority = checked first
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
    { name: 'tamil', pattern: /[\u0B80-\u0BFF]/, priority: 10 },        // Tamil
    { name: 'telugu', pattern: /[\u0C00-\u0C7F]/, priority: 10 },       // Telugu
    { name: 'kannada', pattern: /[\u0C80-\u0CFF]/, priority: 10 },      // Kannada
    { name: 'malayalam', pattern: /[\u0D00-\u0D7F]/, priority: 10 },    // Malayalam
    { name: 'bengali', pattern: /[\u0980-\u09FF]/, priority: 10 },      // Bengali
    { name: 'gujarati', pattern: /[\u0A80-\u0AFF]/, priority: 10 },     // Gujarati
    { name: 'punjabi', pattern: /[\u0A00-\u0A7F]/, priority: 10 },      // Punjabi (Gurmukhi)
    { name: 'hindi', pattern: /[\u0900-\u097F]/, priority: 9 },         // Hindi/Marathi (Devanagari)
    { name: 'urdu', pattern: /[\u0600-\u06FF]/, priority: 10 },         // Urdu (Arabic script)
    { name: 'odia', pattern: /[\u0B00-\u0B7F]/, priority: 10 },         // Odia
    { name: 'assamese', pattern: /[\u0980-\u09FF]/, priority: 9 },      // Assamese (shares with Bengali)
];

/**
 * Detect the primary language from text
 * @param text - The text to analyze
 * @returns Detected language code or 'english' as default
 */
export function detectLanguage(text: string): string {
    if (!text || text.trim().length === 0) {
        return 'english';
    }

    // Check for Indian language scripts
    for (const lang of LANGUAGE_PATTERNS.sort((a, b) => b.priority - a.priority)) {
        if (lang.pattern.test(text)) {
            return lang.name;
        }
    }

    // Default to English if no Indian script detected
    return 'english';
}

/**
 * Get a user-friendly language name
 */
export function getLanguageDisplayName(languageCode: string): string {
    const displayNames: Record<string, string> = {
        'english': 'English',
        'hindi': 'हिन्दी',
        'tamil': 'தமிழ்',
        'telugu': 'తెలుగు',
        'kannada': 'ಕನ್ನಡ',
        'malayalam': 'മലയാളം',
        'bengali': 'বাংলা',
        'gujarati': 'ગુજરાતી',
        'punjabi': 'ਪੰਜਾਬੀ',
        'marathi': 'मराठी',
        'urdu': 'اردو',
        'odia': 'ଓଡ଼ିଆ',
        'assamese': 'অসমীয়া'
    };

    return displayNames[languageCode] || 'English';
}

/**
 * Detect if text is in mixed language (code-switching)
 */
export function isMixedLanguage(text: string): boolean {
    let detectedScripts = 0;

    for (const lang of LANGUAGE_PATTERNS) {
        if (lang.pattern.test(text)) {
            detectedScripts++;
        }
    }

    // Check for Latin script (English)
    if (/[a-zA-Z]/.test(text)) {
        detectedScripts++;
    }

    return detectedScripts > 1;
}
