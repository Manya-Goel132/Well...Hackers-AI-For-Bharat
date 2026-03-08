import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Brain, Moon, Sun, ArrowRight, BookOpen } from 'lucide-react';

const RESOURCES = [
    {
        id: 1,
        articleId: 'understanding-anxiety',
        title: "Understanding Anxiety",
        desc: "Learn the science behind anxiety and practical tools to manage overwhelming feelings.",
        color: "bg-blue-50",
        iconColor: "text-blue-600",
        Icon: Brain,
        readTime: "5 min read"
    },
    {
        id: 2,
        articleId: 'sleep-hygiene-101',
        title: "Sleep Hygiene 101",
        desc: "Simple habits to improve your sleep quality and wake up feeling refreshed.",
        color: "bg-indigo-50",
        iconColor: "text-indigo-600",
        Icon: Moon,
        readTime: "7 min read"
    },
    {
        id: 3,
        articleId: 'grounding-techniques',
        title: "Grounding Techniques",
        desc: "Quick exercises to regain focus when you feel panic or dissociation.",
        color: "bg-emerald-50",
        iconColor: "text-emerald-600",
        Icon: Sun,
        readTime: "3 min read"
    }
];

export function RecommendedResources() {
    const navigate = useNavigate();
    return (
        <section className="bg-white py-16 px-4 border-y border-sage-100">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-moss-900">Recommended for You</h2>
                        <p className="text-moss-600 mt-2">Curated articles to support your journey.</p>
                    </div>
                    <Button variant="ghost" className="text-emerald-700 hover:text-emerald-800">
                        View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {RESOURCES.map((res) => (
                        <Card
                            key={res.id}
                            className="group hover:shadow-soft transition-all duration-300 border-none bg-white overflow-hidden cursor-pointer"
                            onClick={() => navigate(`/article/${res.articleId}`)}
                        >
                            {/* Image Placeholder */}
                            <div className={`h-48 w-full ${res.color} flex items-center justify-center relative overflow-hidden`}>
                                <div className={`p-4 rounded-full bg-white/50 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                    <res.Icon className={`w-8 h-8 ${res.iconColor}`} />
                                </div>
                                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium text-slate-600 flex items-center gap-1 shadow-sm">
                                    <BookOpen className="w-3 h-3" />
                                    {res.readTime}
                                </div>
                            </div>

                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-moss-900 mb-2 group-hover:text-emerald-700 transition-colors">
                                    {res.title}
                                </h3>
                                <p className="text-sm text-moss-600 line-clamp-2 leading-relaxed">
                                    {res.desc}
                                </p>
                                <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                    Read Article <ArrowRight className="w-3 h-3 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
