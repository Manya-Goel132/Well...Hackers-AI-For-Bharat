
// Context Caching Manager for Gemini
// ⚠️ EXPLICIT CACHING DISABLED FOR FINE-TUNED MODELS (Using Implicit Caching instead)

export async function getCachedSystemPrompt(systemPrompt: string): Promise<string | null> {
    console.warn("⚠️ [ContextCache] Explicit caching called but is DISABLED. Returning null for implicit caching.");
    return null;
}

/**
 * Cache diagnostics (Stubbed)
 */
export function getCacheStats() {
    return {
        isCached: false,
        expiresInMinutes: null,
        cacheName: null
    };
}
