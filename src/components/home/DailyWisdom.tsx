import React, { useState, useEffect } from 'react';
import { Quote, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

// Robust fallback list for offline usage or API failure
const FALLBACK_QUOTES = [
    { text: "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.", author: "Unknown" },
    { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
    { text: "There is hope, even when your brain tells you there isn't.", author: "John Green" },
    { text: "Self-care is how you take your power back.", author: "Lalah Delia" },
    { text: "What you feel is valid. You have the right to feel whatever you feel.", author: "ManoSathi Philosophy" },
    { text: "Breathe. It's just a bad day, not a bad life.", author: "Unknown" },
    { text: "You are not your illness. You have an individual story to tell.", author: "Julian Seifter" },
    { text: "There is a crack in everything, that’s how the light gets in.", author: "Leonard Cohen" },
    { text: "It is okay to have depression, it is okay to have anxiety and it is okay to have an adjustment disorder. We need to improve the conversation.", author: "Prince Harry" },
    { text: "The strongest people are those who win battles we know nothing about.", author: "Unknown" },
    { text: "Healing takes time, and asking for help is a courageous step.", author: "Mariska Hargitay" },
    { text: "You generally hear that what a man doesn't know doesn't hurt him, but in business what a man doesn't know does hurt.", author: "Gerald Brenan" },
    { text: "Positive vibes only isn’t a thing. Humans have a wide range of emotions and that’s OK.", author: "Molly Bahr" },
    { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" },
    { text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.", author: "Albus Dumbledore" },
    { text: "Promise me you’ll always remember: You’re braver than you believe, and stronger than you seem, and smarter than you think.", author: "Christopher Robin to Pooh" },
    { text: "Just when the caterpillar thought the world was ending, he turned into a butterfly.", author: "Proverb" },
    { text: "You don’t have to struggle in silence. You can be un-silent. You can live well with a mental health condition, as long as you open up to somebody about it.", author: "Demi Lovato" },
    { text: "Be gentle with yourself. You are doing the best you can.", author: "Unknown" },
    { text: "Recovery is not one and done. It is a lifelong journey that takes place one day, one step at a time.", author: "Unknown" },
    { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott" },
    { text: "Sometimes the people around you won’t understand your journey. They don’t need to, it’s not for them.", author: "Joubert Botha" },
    { text: "One small crack does not mean that you are broken, it means that you were put to the test and you didn’t fall apart.", author: "Linda Poindexter" },
    { text: "Make your mental health a priority.", author: "Unknown" },
    { text: "If you are going through hell, keep going.", author: "Winston Churchill" },
    { text: "Don’t let yesterday take up too much of today.", author: "Will Rogers" },
    { text: "It’s up to you today to start making healthy choices. Not choices that are just healthy for your body, but for your mind.", author: "Steve Maraboli" },
    { text: "There is no normal life that is free of pain. It's the very wrestling with our problems that can be the impetus for our growth.", author: "Fred Rogers" }
];

interface QuoteData {
    text: string;
    author: string;
}

export function DailyWisdom() {
    const [quote, setQuote] = useState<QuoteData>(FALLBACK_QUOTES[0]);
    const [isFading, setIsFading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial random load
    useEffect(() => {
        refreshQuote();
    }, []);

    const fetchQuoteFromAPI = async (): Promise<QuoteData | null> => {
        try {
            // Using a reliable quote API
            const response = await fetch('https://api.quotable.io/random?tags=wisdom,inspirational,happiness,self-help');
            if (!response.ok) throw new Error('API Failed');
            const data = await response.json();
            return {
                text: data.content,
                author: data.author
            };
        } catch (error) {
            console.warn('Quote API failed, falling back to local list', error);
            return null;
        }
    };

    const refreshQuote = async () => {
        if (loading) return;

        setIsFading(true);
        setLoading(true);

        // Minimum delay for animation smoothness
        const minDelay = new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Try API first
            const apiQuote = await fetchQuoteFromAPI();

            await minDelay; // Ensure animation plays

            if (apiQuote) {
                setQuote(apiQuote);
            } else {
                // Fallback to random local quote (different from current)
                let nextQuote;
                do {
                    nextQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
                } while (nextQuote.text === quote.text && FALLBACK_QUOTES.length > 1);
                setQuote(nextQuote);
            }
        } catch (e) {
            // Safety net
            const nextQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
            setQuote(nextQuote);
        } finally {
            setIsFading(false);
            setLoading(false);
        }
    };

    return (
        <section className="relative bg-moss-900 text-cream py-24 px-4 overflow-hidden">
            {/* Top Wave (Cream to Moss) */}
            <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none rotate-180">
                <svg className="relative block w-[calc(100%+1.3px)] h-16 md:h-32 text-cream" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
                </svg>
            </div>

            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute top-1/2 left-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-sage-500/10 rounded-full blur-3xl translate-y-1/3"></div>

            <div className="max-w-4xl mx-auto relative z-10 text-center">
                <div className="inline-flex items-center gap-2 text-emerald-300 uppercase tracking-widest text-xs font-bold mb-8 animate-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="w-4 h-4" />
                    <span>Daily Wisdom</span>
                </div>

                <div className={`transition-all duration-500 transform ${isFading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                    <Quote className="w-12 h-12 text-emerald-500/30 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-display font-medium leading-tight text-white mb-8 min-h-[120px] flex items-center justify-center">
                        "{quote.text}"
                    </h2>
                    <p className="text-xl text-emerald-200 font-handwriting">
                        — {quote.author}
                    </p>
                </div>

                <div className="mt-12">
                    <Button
                        onClick={refreshQuote}
                        disabled={loading}
                        variant="outline"
                        className="rounded-full border-emerald-500/30 text-emerald-100 hover:bg-emerald-900/50 hover:text-white hover:border-emerald-400 transition-all duration-300 min-w-[140px]"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Inspire Me
                    </Button>
                </div>
            </div>

            {/* Bottom Wave (Moss to White) */}
            <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
                <svg className="relative block w-[calc(100%+1.3px)] h-16 md:h-24 text-white" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="currentColor"></path>
                </svg>
            </div>
        </section>
    );
}
