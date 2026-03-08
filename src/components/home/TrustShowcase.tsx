import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Star, Users, Shield, Quote, CheckCircle2, Heart } from 'lucide-react';

const COMMUNITY_COLLAGE = [
    {
        id: 1,
        size: "col-span-1 md:col-span-2 md:row-span-2",
        shape: "rounded-[2rem]",
        rotation: "-rotate-2",
        color: "bg-orange-100",
        imageSrc: "/ananya-testimonial.png",
        imageDesc: "Portrait of Ananya laughing, background removed (Paper Cutout style)",
        quote: "I found my voice here.",
        author: "Ananya, 24",
        overlay: "from-black/60 via-transparent to-transparent"
    },
    {
        id: 2,
        size: "col-span-1 md:row-span-2",
        shape: "rounded-t-full rounded-b-full", // Pill vertical
        rotation: "rotate-3",
        color: "bg-blue-100",
        imageSrc: "/arjun-testimonial.png",
        imageDesc: "Student with headphones, vibrant background.",
        quote: "Focus regained.",
        author: "Arjun, Student",
        overlay: "from-blue-900/60 to-transparent"
    },
    {
        id: 3,
        size: "col-span-1",
        shape: "rounded-full aspect-square", // Circle
        rotation: "-rotate-6",
        color: "bg-purple-100",
        imageSrc: "/meera-testimonial.png",
        imageDesc: "Hands holding chai cup (Circular crop).",
        quote: "Daily comfort.",
        author: "Meera",
        overlay: "from-purple-900/40 to-transparent"
    },
    {
        id: 4,
        size: "col-span-1 md:col-span-1",
        shape: "rounded-[2rem] rounded-tr-[5rem]", // Leaf
        rotation: "rotate-1",
        color: "bg-emerald-100",
        imageSrc: "/verma-testimonial.png",
        imageDesc: "Group of friends (Organic shape crop).",
        quote: "Community heals.",
        author: "The Verma Group",
        overlay: "from-emerald-900/60 to-transparent"
    },
    {
        id: 5,
        size: "col-span-1 md:col-span-2",
        shape: "rounded-[3rem]",
        rotation: "-rotate-1",
        color: "bg-yellow-50",
        imageSrc: "/Anonymous.png",
        imageDesc: "Journal on desk (Wide shot).",
        quote: "My safe space to vent.",
        author: "Anonymous User",
        overlay: "from-black/50 to-transparent"
    },
    {
        id: 6,
        size: "col-span-1",
        shape: "rounded-[2rem] -skew-y-3", // Skewed rect
        rotation: "rotate-6",
        color: "bg-pink-100",
        imageSrc: "/Gupta.png",
        imageDesc: "Couple walking (Dynamic angle).",
        quote: "Never too late.",
        author: "Mr. & Mrs. Gupta",
        overlay: "from-pink-900/50 to-transparent"
    }
];

export function TrustShowcase() {
    return (
        <section className="relative py-24 bg-cream overflow-hidden">
            {/* 1. BACKGROUND LAYER */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-moss-900 rounded-b-[5rem] z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse-slow"></div>
                {/* Abstract Blobs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 mix-blend-overlay"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 mix-blend-overlay"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">

                {/* 2. HERO CONTENT with Pop-Out Person */}
                <div className="text-center mb-32 pt-10 relative">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-emerald-300 backdrop-blur-md border border-white/20 text-sm font-semibold tracking-wider uppercase mb-6 shadow-glow">
                        Trusted by 10,000+ Users
                    </span>
                    <h2 className="text-4xl md:text-6xl font-display font-medium text-white mb-6 leading-tight drop-shadow-lg">
                        <span className="relative">
                            Transforming Lives
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-500 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                            </svg>
                        </span>
                        <br />
                        <span className="text-emerald-300 italic">One Conversation at a Time.</span>
                    </h2>
                    <p className="text-emerald-100/90 max-w-2xl mx-auto text-lg leading-relaxed font-medium mb-8">
                        Join a growing community that prioritizes mental wellness. Verified by experts, loved by people like you.
                    </p>


                    {/* POP-OUT CUTOUT PERSON - Right Side */}
                    {/* <div className="hidden lg:block absolute right-0 bottom-0 w-[300px] h-[400px] pointer-events-none">
                        <div className="relative w-full h-full">
                            <div className="absolute bottom-0 right-0 w-full h-full">
                                <div className="relative w-full h-full">
                                    <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-gradient-to-t from-emerald-400/30 to-transparent rounded-t-full border-4 border-dashed border-emerald-300/20 flex items-center justify-center">
                                        <div className="text-center px-4">
                                            <p className="text-xs font-bold text-emerald-200 mb-1">BODY (IN BANNER)</p>
                                            <p className="text-[10px] text-emerald-300/70 italic">Transparent PNG</p>
                                        </div>
                                    </div>

                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-gradient-to-b from-emerald-300/40 to-transparent rounded-full border-4 border-dashed border-emerald-200/30 flex items-center justify-center -translate-y-[50%]">
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-emerald-100 mb-1">HEAD</p>
                                            <p className="text-[10px] text-emerald-200/70">(POPS OUT)</p>
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 flex items-center justify-center bg-moss-800/60 backdrop-blur-sm rounded-2xl p-4">
                                        <div className="text-center">
                                            <p className="text-white font-bold text-sm mb-2">📸 Image Placeholder</p>
                                            <p className="text-emerald-200 text-xs leading-relaxed">
                                                "Confident young person smiling,<br />
                                                full body portrait,<br />
                                                <span className="font-bold text-emerald-300">transparent background (PNG)</span>,<br />
                                                head extends upward beyond shoulders"
                                            </p>
                                            <div className="mt-3 text-[10px] text-emerald-300/80 font-mono">
                                                Use: &lt;img src="person-cutout.png" /&gt;
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* 3. FLOATNG STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32 -mt-8">
                    {/* Card 1 */}
                    <Card className="bg-white/95 backdrop-blur-xl border-4 border-white shadow-2xl transform rotate-2 hover:rotate-0 hover:-translate-y-2 transition-all duration-500 rounded-[2rem] overflow-visible">
                        <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-4xl font-bold text-moss-900 mb-2">10k+</h3>
                            <p className="text-moss-600 font-medium">Community Members</p>
                            <div className="mt-4 flex -space-x-3 justify-center">
                                <div className="w-10 h-10 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                <div className="w-10 h-10 rounded-full bg-slate-300 border-4 border-white shadow-sm" />
                                <div className="w-10 h-10 rounded-full bg-slate-400 border-4 border-white shadow-sm" />
                                <div className="w-10 h-10 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">+</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2 (Elevated Center) */}
                    <Card className="bg-white/95 backdrop-blur-xl border-4 border-white shadow-2xl transform md:-translate-y-8 z-20 hover:-translate-y-12 transition-all duration-500 relative overflow-hidden rounded-[2.5rem]">
                        <div className="absolute top-0 w-full h-3 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                        <CardContent className="p-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-yellow-50 flex items-center justify-center mb-6 text-yellow-500 shadow-md ring-4 ring-yellow-50/50">
                                <Star className="w-12 h-12 fill-current" />
                            </div>
                            <h3 className="text-5xl font-bold text-moss-900 mb-2">4.9</h3>
                            <p className="text-moss-600 font-medium text-lg">Average User Rating</p>
                            <div className="flex gap-1 mt-3 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3 */}
                    <Card className="bg-white/95 backdrop-blur-xl border-4 border-white shadow-2xl transform -rotate-2 hover:rotate-0 hover:-translate-y-2 transition-all duration-500 rounded-[2rem]">
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 text-blue-600 shadow-inner">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="text-4xl font-bold text-moss-900 mb-2">100%</h3>
                            <p className="text-moss-600 font-medium">Private & Secure</p>
                            <div className="mt-4 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> HIPAA Compliant
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. "STICKER CUTOUT" COLLAGE */}
                <div className="space-y-16">
                    <div className="text-center md:text-left flex flex-col md:flex-row items-end justify-between gap-6 pb-4 border-b border-sage-200/50">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-xs mb-3">
                                <Heart className="w-4 h-4 fill-emerald-600 animate-pulse" />
                                <span>Real Stories from Real People</span>
                            </div>
                            <h3 className="text-3xl md:text-5xl font-display font-bold text-moss-900">
                                Voices of ManoSathi
                            </h3>
                        </div>
                        <p className="text-moss-600 max-w-md text-right hidden md:block text-lg italic font-medium">
                            "This app didn't just help me cope.<br />It helped me thrive."
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 auto-rows-[250px] p-4">
                        {COMMUNITY_COLLAGE.map((item) => (
                            <div
                                key={item.id}
                                className={`relative group ${item.size} ${item.shape} ${item.rotation} cursor-pointer z-10 transition-all duration-500 hover:scale-105 hover:z-20 hover:rotate-0 hover:shadow-2xl overflow-hidden shadow-xl bg-white border-[6px] border-white`}
                            >
                                {/* Image or Placeholder Background */}
                                {item.imageSrc ? (
                                    /* Actual Image */
                                    <img
                                        src={item.imageSrc}
                                        alt={item.imageDesc}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    /* Placeholder Pattern */
                                    <div className={`absolute inset-0 ${item.color} flex items-center justify-center p-6 text-center`}>
                                        <div className="border-2 border-dashed border-moss-900/10 rounded-xl p-4 w-full h-full flex flex-col items-center justify-center gap-2 opacity-60 group-hover:opacity-40 transition-opacity">
                                            <span className="text-xs font-bold uppercase text-moss-900/40">Paper Cutout</span>
                                            <p className="text-sm text-moss-900/60 font-medium italic leading-tight">"{item.imageDesc}"</p>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent mix-blend-overlay" />
                                    </div>
                                )}

                                {/* Quote Overlay (always visible at bottom) */}
                                <div className={`absolute inset-0 bg-gradient-to-t ${item.overlay} flex flex-col justify-end p-6 md:p-8 transition-all duration-300`}>
                                    <Quote className="w-8 h-8 text-white/90 mb-3 drop-shadow-md" />
                                    <p className="text-white font-bold text-lg leading-snug mb-3 drop-shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                        {item.quote ? `"${item.quote}"` : ""}
                                    </p>
                                    <div className="h-0.5 w-12 bg-white/50 mb-3 group-hover:w-full transition-all duration-500" />
                                    <p className="text-white/90 text-sm font-bold uppercase tracking-wide drop-shadow-md">
                                        {item.author ? `"${item.author}"` : ""}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
